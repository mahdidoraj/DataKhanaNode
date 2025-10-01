// src/utils/retry.ts
/**
 * تابع retry با exponential backoff برای تلاش مجدد در صورت خطا
 */

export interface RetryOptions {
	maxAttempts?: number;
	initialDelay?: number;
	maxDelay?: number;
	backoffFactor?: number;
	shouldRetry?: (error: any, attempt: number) => boolean;
	onRetry?: (error: any, attempt: number, delay: number) => void;
}

const defaultRetryOptions: Required<RetryOptions> = {
	maxAttempts: 3,
	initialDelay: 1000,
	maxDelay: 30000,
	backoffFactor: 2,
	shouldRetry: (error: any) => true,
	onRetry: (error: any, attempt: number, delay: number) => {
	},
};

/**
 * تابع retry با exponential backoff
 */
export const retryWithBackoff = async <T>(
	operation: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> => {
	const {
		maxAttempts,
		initialDelay,
		maxDelay,
		backoffFactor,
		shouldRetry,
		onRetry,
	} = {...defaultRetryOptions, ...options};

	let lastError: any;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			// بررسی آیا باید مجدداً تلاش کرد
			if (!shouldRetry(error, attempt) || attempt === maxAttempts) {
				break;
			}

			// محاسبه تاخیر با exponential backoff
			const delay = Math.min(
				initialDelay * Math.pow(backoffFactor, attempt - 1),
				maxDelay,
			);

			// فراخوانی callback در صورت وجود
			onRetry(error, attempt, delay);

			// انتظار قبل از تلاش مجدد
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw lastError;
};

/**
 * تابع retry ساده بدون backoff
 */
export const retry = async <T>(
	operation: () => Promise<T>,
	maxAttempts: number = 3,
	delayMs: number = 1000,
): Promise<T> => {
	return retryWithBackoff(operation, {
		maxAttempts,
		initialDelay: delayMs,
		backoffFactor: 1, // بدون افزایش تاخیر
		maxDelay: delayMs,
	});
};

/**
 * تابع برای ایجاد یک retry کننده اختصاصی با تنظیمات ثابت
 */
export const createRetry = (options: RetryOptions) => {
	return <T>(operation: () => Promise<T>): Promise<T> => {
		return retryWithBackoff(operation, options);
	};
};

// نمونه‌هایی از retry کننده‌های پیش‌فرض
export const networkRetry = createRetry({
	maxAttempts: 5,
	initialDelay: 1000,
	backoffFactor: 2,
	maxDelay: 10000,
	shouldRetry: (error: any) => {
		// فقط برای خطاهای شبکه تلاش مجدد کنیم
		return error.code === 'ECONNRESET' ||
			error.code === 'ETIMEDOUT' ||
			error.code === 'ECONNREFUSED' ||
			error.response?.status >= 500;
	},
});

export const databaseRetry = createRetry({
	maxAttempts: 3,
	initialDelay: 500,
	backoffFactor: 2,
	maxDelay: 5000,
	shouldRetry: (error: any) => {
		// برای خطاهای اتصال دیتابیس تلاش مجدد کنیم
		return error.name?.includes('Sequelize') ||
			error.code === 'ECONNREFUSED';
	},
});
