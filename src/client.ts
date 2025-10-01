import { io } from 'socket.io-client';
import { downloadMedia } from './services/UploadFileToS3';

const SERVER_URL = 'http://localhost:3000';
const socket = io(SERVER_URL);

// دریافت جاب از سرور
socket.on('new_job', async (job) => {
	console.log(`📩 Received job #${ job.id }:`, job);

	// شبیه‌سازی دانلود یا انجام تسک
	await runJob(job);

	// اطلاع به سرور که کار انجام شد
	socket.emit('job_done', {jobId: job.id, status: 'done'});
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
				datum.media = await downloadMedia(datum.media);
				socket.emit('download_file', {data: datum, statusCode: 200, type: data.type});
			} catch (e) {
				socket.emit('download_file', {data: datum, statusCode: 400, error: e, type: data.type});
			}
		}
	} catch (e: any) {
		console.error(e.message);
	}
});

async function runJob(job: any) {
	console.log(`🚀 Running job #${ job.id }: ${ job.task }`);

	await new Promise(res => setTimeout(res, 2000)); // شبیه‌سازی زمان انجام کار
	console.log(`✅ Job #${ job.id } done!`);
}
