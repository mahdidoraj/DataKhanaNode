// types/NotificationChannel.ts
export type NotificationChannel = 'sms' | 'email' | 'telegram' | 'slack';

export interface SendNotificationInput {
	userId: string;
	channel: NotificationChannel;
	recipient: string;   // شماره موبایل، ایمیل، chatId یا webhook url
	message: string;
	subject?: string;    // برای ایمیل
}
