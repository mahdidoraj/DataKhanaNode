// index.js
const SocksToHttpGateway = require('./socks-to-http-gateway');
const fs = require('fs');

async function main() {
	// پیکربندی: لیست پروکسی‌های SOCKS5 به همراه پورت محلی برای HTTP proxy
	const proxies = JSON.parse(await fs.readFileSync('./storage/proxies.json').toString());

	const gateway = new SocksToHttpGateway(proxies, {
		defaultMaxPool: 4,
		defaultConnTimeoutMs: 30_000,
		idleTimeoutMs: 60_000,
	});

	// event logging
	gateway.on('proxy-started', (conf) => {
		console.log(`HTTP proxy started: localhost:${conf.localPort} -> socks5 ${conf.socksHost}:${conf.socksPort}`);
	});

	gateway.on('error', (err) => {
		console.error('Gateway error:', err && err.message ? err.message : err);
	});

	gateway.on('socket-error', (err, ctx) => {
		console.warn('Socket error:', err && err.message, ctx);
	});

	await gateway.startAll();

	process.on('SIGINT', async () => {
		console.log('SIGINT - shutting down...');
		await gateway.stopAll();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		console.log('SIGTERM - shutting down...');
		await gateway.stopAll();
		process.exit(0);
	});

	// برای مشاهده وضعیت
	setInterval(() => {
		console.log('gateway status:', gateway.status());
	}, 30_000);
}

main().catch(err => {
	console.error('Fatal:', err);
	process.exit(1);
});
