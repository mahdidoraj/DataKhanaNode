import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
const socket = io(SERVER_URL);
let jobList: string[] = [];
let completedJobs: string[] = [];
let lastReceivedTime: number = 0;
let processingTimeout: NodeJS.Timeout | null = null;

// دریافت جاب از سرور
socket.on('new_jobs', async (jobs) => {
	console.log(`📩 Received ${ jobs.length } jobs from server`);

	// ذخیره لیست Job داخلی
	jobList = jobs.slice(); // clone

	// ذخیره زمان آخرین دریافت Job
	lastReceivedTime = Date.now();

	// اگر پردازش قبلی در جریان است، تایمر را ریست کن
	if (processingTimeout) clearTimeout(processingTimeout);

	// شروع پردازش Jobها بعد از X دقیقه (مثلاً 2 دقیقه = 120000ms)
	processingTimeout = setTimeout(() => {
		processJobs();
	}, 10000);
});
socket.on('ping_server', () => {
	console.log(`📩 Received ping from server`);
	socket.emit('pong');
});
socket.on('download_file', async (data) => {
	try {
		console.log(`📩 Received ping from server`, data.data);
		for (let datum of data.data) {
			try {
				// datum.media = await downloadMedia(datum.media);
				socket.emit('download_file', {data: datum, statusCode: 200, type: data.type});
			} catch (e) {
				socket.emit('download_file', {data: datum, statusCode: 400, error: e, type: data.type});
			}
		}
	} catch (e: any) {
		console.error(e.message);
	}
});

async function processJobs() {
	console.log(`🚀 Starting job processing... Total: ${ jobList.length }`);

	while (jobList.length > 0) {
		// یکی از ابتدا
		const jobStart = jobList.shift();
		if (jobStart) await runJob(jobStart);

		// یکی از انتها
		const jobEnd = jobList.pop();
		if (jobEnd) await runJob(jobEnd);
	}

	console.log('🎉 All jobs completed!');
	console.log('✅ Completed jobs:', completedJobs);
}

async function runJob(job: string) {
	console.log(`🚀 Running job: ${ job }`);

	// شبیه‌سازی دانلود یا پردازش با تاخیر تصادفی کوتاه
	await new Promise((res) => setTimeout(res, 100));

	// ثبت Job تکمیل شده
	completedJobs.push(job);

	// گزارش به سرور که Job انجام شد
	socket.emit('job_done', {job});
}
