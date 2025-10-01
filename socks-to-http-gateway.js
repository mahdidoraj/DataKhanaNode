const http            = require('http');
const net             = require('net');
const { SocksClient } = require('socks');
const { URL }         = require('url');
const EventEmitter    = require('events');

class SocksToHttpGateway extends EventEmitter {
	/**
	 * @param {Object[]} proxiesConfig - آرایه‌ای از تنظیمات پروکسی‌ها
	 *   هر آیتم: { name?: string, socksHost: string, socksPort: number, localPort: number, maxPool?: number, connTimeoutMs?: number }
	 * @param {Object} globalOptions
	 *   - defaultMaxPool: تعداد حداکثر سوکت idle برای هر (socks proxy + target host:port)
	 *   - defaultConnTimeoutMs: timeout برای کانکشن‌های TCP
	 */
	constructor(proxiesConfig = [], globalOptions = {}) {
		super();
		this.proxiesConfig = proxiesConfig.map((p, i) => ({
			name: p.name || `socks-${i}`,
			socksHost: p.socksHost,
			socksPort: p.socksPort,
			localPort: p.localPort,
			maxPool: p.maxPool ?? globalOptions.defaultMaxPool ?? 4,
			connTimeoutMs: p.connTimeoutMs ?? globalOptions.defaultConnTimeoutMs ?? 30_000,
		}));

		// map: proxyName -> { server, pool: Map<string, []> }
		this._servers = new Map();
		this._running = false;

		// default: close idle sockets after idleTimeoutMs
		this.idleTimeoutMs = globalOptions.idleTimeoutMs ?? 60_000;
	}

	/**
	 * Start all HTTP proxy servers
	 */
	async startAll() {
		if (this._running) return;
		for (const conf of this.proxiesConfig) {
			await this._startProxyServer(conf);
		}
		this._running = true;
		this.emit('started');
	}

	/**
	 * Stop all servers and destroy pools
	 */
	async stopAll() {
		if (!this._running) return;
		const promises = [];
		for (const [name, info] of this._servers.entries()) {
			promises.push(this._closeServer(name));
		}
		await Promise.all(promises);
		this._servers.clear();
		this._running = false;
		this.emit('stopped');
	}

	/**
	 * Start single proxy's HTTP server
	 */
	_startProxyServer(conf) {
		return new Promise((resolve, reject) => {
			const pool   = new Map(); // key: `${destHost}:${destPort}` -> [{socket, lastUsedAt, timer}]
			const server = http.createServer();

			// Handle normal HTTP requests (GET/POST/... via proxy)
			server.on('request', (clientReq, clientRes) => {
				this._handleHttpRequest(conf, pool, clientReq, clientRes).catch(err => {
					// If not already responded
					if (!clientRes.headersSent) {
						clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
						clientRes.end('Bad Gateway: ' + String(err.message));
					}
					this.emit('error', err);
				});
			});

			// Handle CONNECT method (HTTPS tunneling)
			server.on('connect', (req, clientSocket, head) => {
				this._handleConnectRequest(conf, pool, req, clientSocket, head).catch(err => {
					// Send proper proxy error back to client and destroy
					try {
						clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\n\r\n`);
					} catch (_) {}
					clientSocket.destroy();
					this.emit('error', err);
				});
			});

			server.on('clientError', (err, socket) => {
				// avoid uncaught
				try {
					socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
				} catch (_) {}
				this.emit('clientError', err);
			});

			server.on('error', (err) => {
				this.emit('error', err);
			});

			server.listen(conf.localPort, () => {
				this._servers.set(conf.name, { conf, server, pool });
				this.emit('proxy-started', conf);
				resolve();
			});

			// graceful close on server close
			server.on('close', () => {
				// destroy pool sockets
				for (const arr of pool.values()) {
					for (const slot of arr) {
						try { slot.socket.destroy(); } catch (_) {}
						if (slot.timer) clearTimeout(slot.timer);
					}
				}
				pool.clear();
			});
		});
	}

	/**
	 * Close a running server
	 */
	_closeServer(name) {
		return new Promise((resolve) => {
			const info = this._servers.get(name);
			if (!info) return resolve();
			info.server.close(() => {
				// destroy pooled sockets
				for (const arr of info.pool.values()) {
					for (const slot of arr) {
						try { slot.socket.destroy(); } catch (_) {}
						if (slot.timer) clearTimeout(slot.timer);
					}
				}
				info.pool.clear();
				resolve();
			});
		});
	}

	/**
	 * Handle non-CONNECT HTTP requests (forward via SOCKS)
	 */
	async _handleHttpRequest(conf, pool, clientReq, clientRes) {
		// clientReq.url is full URL for proxy requests (e.g. "http://example.com/path")
		let targetUrl;
		try {
			targetUrl = new URL(clientReq.url);
		} catch (err) {
			// Malformed URL - respond 400
			clientRes.writeHead(400, { 'Content-Type': 'text/plain' });
			clientRes.end('Bad Request - invalid URL');
			return;
		}

		const destHost = targetUrl.hostname;
		const destPort = targetUrl.port ? parseInt(targetUrl.port, 10) : (targetUrl.protocol === 'https:' ? 443 : 80);
		const destPath = targetUrl.pathname + (targetUrl.search || '');

		// create or reuse a socks-to-destination socket
		const destKey   = `${destHost}:${destPort}`;
		let socksSocket = await this._acquireSocketFromPool(conf, pool, destKey);

		let createdByUs = false;
		if (!socksSocket || socksSocket.destroyed) {
			socksSocket = await this._createSocksConnection(conf, destHost, destPort, conf.connTimeoutMs);
			createdByUs = true;
		}

		// Construct request to send to origin server (path-only, not full URL)
		// Clone headers but remove proxy-specific and hop-by-hop headers
		const headers = Object.assign({}, clientReq.headers);
		delete headers['proxy-authorization'];
		delete headers['proxy-connection'];
		delete headers['connection'];
		delete headers['keep-alive'];
		delete headers['transfer-encoding'];
		// Ensure Host header is correct
		headers['host'] = destHost + (destPort && destPort !== 80 && destPort !== 443 ? `:${destPort}` : '');

		// Build the request
		const reqLines = [];
		reqLines.push(`${clientReq.method} ${destPath} HTTP/1.1`);
		for (const [k, v] of Object.entries(headers)) {
			if (Array.isArray(v)) {
				for (const vv of v) reqLines.push(`${k}: ${vv}`);
			} else if (typeof v !== 'undefined') {
				reqLines.push(`${k}: ${v}`);
			}
		}
		reqLines.push(`\r\n`); // end headers

		// Write request header to socksSocket
		try {
			socksSocket.write(reqLines.join('\r\n'));
		} catch (err) {
			socksSocket.destroy();
			throw err;
		}

		// Pipe request body to socksSocket
		clientReq.pipe(socksSocket, { end: false });

		// Read response from socksSocket and forward to clientRes
		// We can't rely on node http parser here; we'll create a temporary parser by
		// letting http.IncomingMessage parse it by creating a fake socket? Simpler: listen for 'data' once and parse headers manually.
		// We'll implement a tiny header translator: accumulate until \r\n\r\n then parse status line + headers and forward.

		let buffer        = Buffer.alloc(0);
		let headersParsed = false;
		const onData      = (chunk) => {
			if (!headersParsed) {
				buffer    = Buffer.concat([buffer, chunk]);
				const idx = buffer.indexOf('\r\n\r\n');
				if (idx !== -1) {
					const headerPart    = buffer.slice(0, idx).toString('utf8');
					const rest          = buffer.slice(idx + 4);
					const headerLines   = headerPart.split('\r\n');
					const statusLine    = headerLines.shift();
					const m             = statusLine.match(/^HTTP\/\d\.\d\s+(\d+)\s*(.*)/);
					const statusCode    = m ? parseInt(m[1], 10) : 502;
					const statusMessage = m ? (m[2] || '') : '';

					const responseHeaders = {};
					for (const line of headerLines) {
						const pos = line.indexOf(':');
						if (pos === -1) continue;
						const key = line.slice(0, pos).trim().toLowerCase();
						const val = line.slice(pos + 1).trim();
						// Remove hop-by-hop headers
						if ([
							'connection',
							'keep-alive',
							'proxy-authenticate',
							'proxy-authorization',
							'proxy-connection',
							'transfer-encoding',
						].includes(key)) continue;
						responseHeaders[key] = responseHeaders[key] ? responseHeaders[key] + ', ' + val : val;
					}

					// Write headers to client
					clientRes.writeHead(statusCode, statusMessage, responseHeaders);

					// Write remaining body that's already read
					if (rest && rest.length) clientRes.write(rest);

					headersParsed = true;
				}
			} else {
				clientRes.write(chunk);
			}
		};

		const onEnd = () => {
			clientRes.end();
			// put socket back to pool if keep-alive indicated and not destroyed
			this._releaseSocketToPool(conf, pool, destKey, socksSocket);
			cleanup();
		};

		const onError = (err) => {
			try {
				clientRes.writeHead(502, { 'content-type': 'text/plain' });
				clientRes.end('Bad Gateway: ' + err.message);
			} catch (_) {}
			try { socksSocket.destroy(); } catch (_) {}
			cleanup();
		};

		const cleanup = () => {
			socksSocket.removeListener('data', onData);
			socksSocket.removeListener('end', onEnd);
			socksSocket.removeListener('error', onError);
			socksSocket.setTimeout(0);
		};

		socksSocket.on('data', onData);
		socksSocket.on('end', onEnd);
		socksSocket.on('error', onError);
		socksSocket.setTimeout(conf.connTimeoutMs, () => {
			socksSocket.destroy();
		});

		// Also watch client socket errors
		clientReq.on('aborted', () => {
			try { socksSocket.destroy(); } catch (_) {}
		});
	}

	/**
	 * Handle CONNECT requests (HTTPS tunneling)
	 * Typical flow: client sends "CONNECT host:port HTTP/1.1", server must respond "200 Connection Established"
	 * then pipe clientSocket <-> remote socket.
	 */
	async _handleConnectRequest(conf, pool, req, clientSocket, head) {
		// req.url is "host:port"
		const target   = req.url.split(':');
		const destHost = target[0];
		const destPort = parseInt(target[1] || '443', 10);

		// create a direct SOCKS connection to destHost:destPort
		let remoteSocket;
		try {
			remoteSocket = await this._createSocksConnection(conf, destHost, destPort, conf.connTimeoutMs);
		} catch (err) {
			// respond with 502 and destroy
			try {
				clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
			} catch (_) {}
			clientSocket.destroy();
			throw err;
		}

		// respond OK to client to establish tunnel
		try {
			clientSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-agent: socks-to-http-gateway\r\n\r\n');
		} catch (err) {
			remoteSocket.destroy();
			clientSocket.destroy();
			throw err;
		}

		// If there's buffered data (head), forward it
		if (head && head.length) remoteSocket.write(head);

		// Pipe bi-directionally
		clientSocket.pipe(remoteSocket);
		remoteSocket.pipe(clientSocket);

		// handle errors and timeouts
		const cleanup = () => {
			try { clientSocket.destroy(); } catch (_) {}
			try { remoteSocket.destroy(); } catch (_) {}
		};

		clientSocket.on('error', cleanup);
		remoteSocket.on('error', cleanup);
		clientSocket.setTimeout(conf.connTimeoutMs, cleanup);
		remoteSocket.setTimeout(conf.connTimeoutMs, cleanup);

		// On close, make sure sockets are destroyed
		clientSocket.on('close', () => {
			try { remoteSocket.end(); } catch (_) {}
		});
		remoteSocket.on('close', () => {
			try { clientSocket.end(); } catch (_) {}
		});
	}

	/**
	 * Create new SOCKS connection to dest (returns a net.Socket)
	 */
	async _createSocksConnection(conf, destHost, destPort, timeoutMs = 30_000) {
		// Use socks.SocksClient.createConnection
		try {
			const options = {
				command: 'connect',
				destination: { host: destHost, port: destPort },
				proxy: {
					host: conf.socksHost,
					port: conf.socksPort,
					type: 5,
				},
				timeout: timeoutMs,
			};
			const info    = await SocksClient.createConnection(options);
			const socket  = info.socket;
			// enable keepAlive so pooling can work
			socket.setKeepAlive(true);
			socket.on('error', (err) => {
				// ensure we don't let errors bubble uncaught
				this.emit('socket-error', err, { conf, destHost, destPort });
			});
			return socket;
		} catch (err) {
			// wrap error with context
			const e = new Error(`Failed to create SOCKS connection to ${destHost}:${destPort} via ${conf.socksHost}:${conf.socksPort} — ${err.message}`);
			e.cause = err;
			throw e;
		}
	}

	/**
	 * Simple pooling: acquire available idle socket for destKey
	 */
	async _acquireSocketFromPool(conf, pool, destKey) {
		const arr = pool.get(destKey);
		if (!arr || arr.length === 0) return null;
		// pop last
		while (arr.length) {
			const slot = arr.pop();
			if (slot && !slot.socket.destroyed) {
				if (slot.timer) {
					clearTimeout(slot.timer);
					slot.timer = null;
				}
				return slot.socket;
			}
		}
		return null;
	}

	/**
	 * Release socket back to pool if pool not full, otherwise destroy
	 */
	_releaseSocketToPool(conf, pool, destKey, socket) {
		if (!socket || socket.destroyed) return;
		let arr = pool.get(destKey);
		if (!arr) {
			arr = [];
			pool.set(destKey, arr);
		}
		// Check pool size
		if (arr.length >= conf.maxPool) {
			try { socket.destroy(); } catch (_) {}
			return;
		}
		// prepare cleanup timer to destroy socket after idleTimeoutMs
		const slot = { socket, lastUsedAt: Date.now(), timer: null };
		slot.timer = setTimeout(() => {
			try { socket.destroy(); } catch (_) {}
			// remove from pool
			const a   = pool.get(destKey) || [];
			const idx = a.findIndex(s => s.socket === socket);
			if (idx !== -1) a.splice(idx, 1);
		}, this.idleTimeoutMs);
		arr.push(slot);
	}

	/**
	 * Utility to get status
	 */
	status() {
		const statuses = [];
		for (const [name, info] of this._servers.entries()) {
			statuses.push({
				name,
				localPort: info.conf.localPort,
				socksHost: info.conf.socksHost,
				socksPort: info.conf.socksPort,
				poolSize: [...info.pool.values()].reduce((s, a) => s + a.length, 0),
			});
		}
		return statuses;
	}
}

module.exports = SocksToHttpGateway;
