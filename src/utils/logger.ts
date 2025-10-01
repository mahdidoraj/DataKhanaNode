export interface LogEntry {
	timestamp: Date;
	level: string;
	message: string;
	context?: string;
	metadata?: Record<string, any>;
	error?: Error;
}

export interface LoggerOptions {
	level?: string;
	context?: string;
	prettyPrint?: boolean;
	enableConsole?: boolean;
	enableFile?: boolean;
	filePath?: string;
}

// سطوح لاگ‌گیری
const LOG_LEVELS = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	trace: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
	private level: number;
	private context: string;
	private prettyPrint: boolean;
	private enableConsole: boolean;
	private enableFile: boolean;
	private filePath: string;

	constructor(options: LoggerOptions = {}) {
		this.level = LOG_LEVELS[options.level as LogLevel] || LOG_LEVELS.info;
		this.context = options.context || 'app';
		this.prettyPrint = options.prettyPrint ?? process.env.NODE_ENV !== 'production';
		this.enableConsole = options.enableConsole ?? true;
		this.enableFile = options.enableFile ?? false;
		this.filePath = options.filePath || './logs/app.log';
	}

	private shouldLog(level: LogLevel): boolean {
		return LOG_LEVELS[level] <= this.level;
	}

	private formatEntry(entry: LogEntry): string {
		const {timestamp, level, message, context, metadata, error} = entry;

		const logObject: any = {
			timestamp: timestamp.toISOString(),
			level: level.toUpperCase(),
			context: context || this.context,
			message,
		};

		if (metadata && Object.keys(metadata).length > 0) {
			logObject.metadata = metadata;
		}

		if (error) {
			logObject.error = {
				name: error.name,
				message: error.message,
				stack: error.stack,
			};
		}

		return this.prettyPrint
			? JSON.stringify(logObject, null, 2)
			: JSON.stringify(logObject);
	}

	private writeToConsole(entry: LogEntry): void {
		const formatted = this.formatEntry(entry);
		const method: any = console[entry.level as keyof Console] || console.log;
		method(formatted);
	}

	private async writeToFile(entry: LogEntry): Promise<void> {
		try {
			const formatted = this.formatEntry(entry) + '\n';
			// در production از fs.promises استفاده می‌شود
			const fs = await import('fs');
			const path = await import('path');

			const dir = path.dirname(this.filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, {recursive: true});
			}

			fs.appendFileSync(this.filePath, formatted, 'utf8');
		} catch (error) {
			console.error('Failed to write to log file:', error);
		}
	}

	private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
		if (!this.shouldLog(level)) return;

		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			message,
			context: this.context,
			metadata,
			error,
		};

		if (this.enableConsole) {
			this.writeToConsole(entry);
		}

		if (this.enableFile) {
			this.writeToFile(entry).catch(console.error);
		}
	}

	// متدهای اصلی لاگ‌گیری
	error(message: string, error?: Error, metadata?: Record<string, any>): void {
		this.log('error', message, metadata, error);
	}

	warn(message: string, metadata?: Record<string, any>): void {
		this.log('warn', message, metadata);
	}

	info(message: string, metadata?: Record<string, any>): void {
		this.log('info', message, metadata);
	}

	debug(message: string, metadata?: Record<string, any>): void {
		this.log('debug', message, metadata);
	}

	trace(message: string, metadata?: Record<string, any>): void {
		this.log('trace', message, metadata);
	}

	// ایجاد child logger با context جدید
	child(context: string): Logger {
		return new Logger({
			level: Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key as LogLevel] === this.level) as LogLevel,
			context: `${ this.context }:${ context }`,
			prettyPrint: this.prettyPrint,
			enableConsole: this.enableConsole,
			enableFile: this.enableFile,
			filePath: this.filePath,
		});
	}

	// متد برای لاگ‌گیری عملکرد توابع
	time<T>(operation: string, fn: () => T | Promise<T>, metadata?: Record<string, any>): T | Promise<T> {
		const start = Date.now();
		this.debug(`Starting: ${ operation }`, metadata);

		try {
			const result = fn();

			if (result instanceof Promise) {
				return result
					.then(value => {
						const duration = Date.now() - start;
						this.debug(`Completed: ${ operation } (${ duration }ms)`, {
							...metadata,
							duration,
						});
						return value;
					})
					.catch(error => {
						const duration = Date.now() - start;
						this.error(`Failed: ${ operation } (${ duration }ms)`, error, {
							...metadata,
							duration,
						});
						throw error;
					});
			} else {
				const duration = Date.now() - start;
				this.debug(`Completed: ${ operation } (${ duration }ms)`, {
					...metadata,
					duration,
				});
				return result;
			}
		} catch (error: any) {
			const duration = Date.now() - start;
			this.error(`Failed: ${ operation } (${ duration }ms)`, error, {
				...metadata,
				duration,
			});
			throw error;
		}
	}
}

// ایجاد logger پیش‌فرض
const defaultLogger = new Logger({
	level: (process.env.LOG_LEVEL as LogLevel) || 'info',
	context: 'app',
	prettyPrint: process.env.NODE_ENV !== 'production',
	enableConsole: true,
	enableFile: process.env.NODE_ENV === 'production',
	filePath: process.env.LOG_PATH || './logs/app.log',
});

// export توابع مستقیم برای استفاده آسان
export const logger = defaultLogger;

// ایجاد logger برای بخش‌های مختلف
export const createLogger = (context: string, options: Partial<LoggerOptions> = {}) => {
	return new Logger({
		level: options.level || (process.env.LOG_LEVEL as LogLevel) || 'info',
		context,
		prettyPrint: options.prettyPrint ?? process.env.NODE_ENV !== 'production',
		enableConsole: options.enableConsole ?? true,
		enableFile: options.enableFile ?? process.env.NODE_ENV === 'production',
		filePath: options.filePath || process.env.LOG_PATH || './logs/app.log',
	});
};

// loggerهای از پیش ساخته شده برای بخش‌های مختلف
export const databaseLogger = createLogger('database');
export const apiLogger = createLogger('api');
export const jobLogger = createLogger('jobs');
export const serviceLogger = createLogger('services');

export default logger;
