import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { requestServiceDownload } from './requestService';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

dotenv.config();

export const s3Client = new S3Client({
	endpoint: process.env.S3_ENDPOINT || '', // آدرس MinIO
	region: process.env.S3_REGION || '',              // ثابت بذار
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY || '',    // همون MINIO_ROOT_USER
		secretAccessKey: process.env.S3_SECRET_KEY || '', // همون MINIO_ROOT_PASSWORD
	},
	forcePathStyle: true,              // مهم برای MinIO
});

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const MAX_DIM = 500;
const IMAGE_QUALITY = 80; // webp quality
const VIDEO_BITRATE = '800k'; // تنظیم بیت‌ریت برای webm

// تشخیص نوع فایل دقیق‌تر
function mimeFromContentType(ct: string | undefined) {
	if (!ct) return 'application/octet-stream';
	return ct.split(';')[0].trim();
}

async function processImageBuffer(buffer: Buffer, mime: string) {
	// sharp metadata
	const img = sharp(buffer, { animated: false });
	const meta = await img.metadata();
	let transformer = sharp(buffer);

	const needResize = (meta.width && meta.width > MAX_DIM) || (meta.height && meta.height > MAX_DIM);

	if (needResize) transformer = transformer.resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside' });

	// همیشه تبدیل به webp (حذف EXIF اختیاری)
	const outBuffer = await transformer.webp({
		quality: IMAGE_QUALITY,
		effort: 6,
		alphaQuality: 80,
	}).toBuffer();

	return { buffer: outBuffer, contentType: 'image/webp', ext: '.webp' };
}

async function processVideoBuffer(buffer: Buffer, originalExt = '.mp4') {
	// write temp input and output files
	const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'media-'));
	const inPath = path.join(tmpDir, `in${originalExt}`);
	const outPath = path.join(tmpDir, `out.webm`);

	await fs.promises.writeFile(inPath, buffer);

	// probe to get dimensions (safeguard)
	let probeInfo: any = null;
	try {
		probeInfo = await new Promise((res, rej) => {
			ffmpeg.ffprobe(inPath, (err, info) => {
				if (err) return rej(err);
				res(info);
			});
		});
	} catch (e) {
		// ignore probe error, continue
	}

	// determine scale param: only scale if larger than MAX_DIM
	let scaleFilter = null;
	try {
		const videoStream = probeInfo?.streams?.find((s: any) => s.codec_type === 'video');
		const w = videoStream?.width;
		const h = videoStream?.height;
		if (w && h && (w > MAX_DIM || h > MAX_DIM)) {
			// scale while preserving aspect ratio
			scaleFilter = `scale='if(gt(a,1),${MAX_DIM},-2)':'if(lt(a,1),${MAX_DIM},-2)'`;
			// Explanation: if aspect ratio >1 (wider), set width=MAX_DIM, else set height=MAX_DIM.
		}
	} catch (e) {
		scaleFilter = null;
	}

	await new Promise((resolve, reject) => {
		let cmd = ffmpeg(inPath)
			.outputOptions([
				'-c:v libvpx-vp9', // VP9 بهتر فشرده‌سازی (در صورت نیاز میشه به vp8 تغییر داد)
				'-b:v ' + VIDEO_BITRATE,
				'-crf 32', // کیفیت/فشرده‌سازی
				'-c:a libopus',
			])
			.format('webm')
			.on('end', resolve)
			.on('error', (err) => reject(err));

		if (scaleFilter) cmd = cmd.videoFilters(scaleFilter);

		cmd.save(outPath);
	});

	const outBuffer = await fs.promises.readFile(outPath);

	// cleanup
	try {
		await fs.promises.unlink(inPath);
		await fs.promises.unlink(outPath);
		await fs.promises.rmdir(tmpDir);
	} catch (e) {
		// silent
	}

	return { buffer: outBuffer, contentType: 'video/webm', ext: '.webm' };
}

function isImageMime(mime: string) {
	return mime.startsWith('image/');
}
function isVideoMime(mime: string) {
	return mime.startsWith('video/');
}

function extensionFromMime(mime: string) {
	if (!mime) return '.bin';
	if (mime === 'image/png') return '.png';
	if (mime === 'image/jpeg') return '.jpg';
	if (mime === 'image/gif') return '.gif';
	if (mime === 'image/webp') return '.webp';
	if (mime === 'video/mp4') return '.mp4';
	if (mime === 'video/quicktime') return '.mov';
	return '.bin';
}

export async function downloadAndUploadToS3(fileUrl: string) {
	try {
		// 1) دانلود (همون کاری که قبلاً می‌کردی)
		const response: any = await requestServiceDownload(true, 'get', fileUrl);
		const fileBuffer = Buffer.from(response.data);
		const contentTypeHeader = mimeFromContentType(response.headers['content-type'] || undefined);
		const guessedExt = extensionFromMime(contentTypeHeader) || path.extname(fileUrl) || '.bin';

		// 2) پردازش (تصویر یا ویدیو)
		let processed: { buffer: Buffer; contentType: string; ext: string } | null = null;

		if (isImageMime(contentTypeHeader)) {
			try {
				processed = await processImageBuffer(fileBuffer, contentTypeHeader);
			} catch (e) {
				// fallback: آپلود اصلی بدون تبدیل اگر پردازش خطا داد
				console.warn('image processing failed, uploading original:', e);
			}
		} else if (isVideoMime(contentTypeHeader)) {
			try {
				processed = await processVideoBuffer(fileBuffer, guessedExt);
			} catch (e) {
				console.warn('video processing failed, uploading original:', e);
			}
		} else {
			// نه تصویر و نه ویدیو: سعی کن تشخیص از extension کن؛ اگر extension مربوط به عکس/ویدیو است پردازش کن
			const ext = path.extname(fileUrl).toLowerCase();
			if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
				try { processed = await processImageBuffer(fileBuffer, contentTypeHeader); } catch (e) { console.warn(e); }
			} else if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
				try { processed = await processVideoBuffer(fileBuffer, ext); } catch (e) { console.warn(e); }
			}
		}

		// اگر پردازش موفق نبود، از فایل اصلی استفاده کن
		const finalBuffer = processed ? processed.buffer : fileBuffer;
		const finalContentType = processed ? processed.contentType : (contentTypeHeader || 'application/octet-stream');
		const finalExt = processed ? processed.ext : (path.extname(fileUrl) || '.bin');

		const objectKey = '/media/' + new Date().getFullYear().toString() + '/' + new Date().getMonth().toString() + '/' + uuidv4() + finalExt;
		const bucket = 'datakhana';
		const expiresIn = 60 * 60 * 24 * 48 * 1000;
		const expiresAt = new Date(new Date().getTime() + expiresIn);

		// 3) آپلود به S3 / MinIO
		const uploadParams = {
			Bucket: bucket,
			Key: objectKey,
			Body: finalBuffer,
			ContentType: finalContentType,
			ContentLength: finalBuffer.length,
		};

		await s3Client.send(new PutObjectCommand(uploadParams));

		// presigned url
		const cmd = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
		const signedUrl = await getSignedUrl(s3Client, cmd);

		return {
			bucket,
			objectKey,
			expiresIn,
			expiresAt,
		};
	} catch (error: any) {
		console.error('خطا در دانلود یا آپلود فایل:', error?.message || error);
		if (error.response) {
			console.error('Status:', error.response.status);
			console.error('Data:', error.response.data);
		}
		throw new Error(`دانلود یا آپلود فایل ناموفق بود: ${error?.message || 'unknown'}`);
	}
}

export async function generatePresignedUrl(bucket: string, key: string, fileData: any, expiresInSeconds = 3600) {
	// اگر fileData شامل buffer باشد (مثل فایل آپلود شده با multer)
	if (fileData.buffer) {
		const uploadParams = {
			Bucket: bucket,
			Key: key,
			Body: fileData.buffer, // استفاده از buffer مستقیم
			ContentType: fileData.mimetype, // استفاده از mimetype
			ContentLength: fileData.size, // اضافه کردن طول محتوا
		};

		await s3Client.send(new PutObjectCommand(uploadParams));
		const cmd = new GetObjectCommand({Bucket: bucket, Key: key});
		const url = await getSignedUrl(s3Client, cmd);
		return url;
	}
	// اگر یک stream واقعی باشد
	else if (typeof fileData.pipe === 'function') {
		const chunks = [];
		for await (const chunk of fileData) {
			chunks.push(chunk);
		}
		const buffer = Buffer.concat(chunks);

		const uploadParams = {
			Bucket: bucket,
			Key: key,
			Body: buffer,
			ContentType: 'application/octet-stream',
		};

		await s3Client.send(new PutObjectCommand(uploadParams));

		const cmd = new GetObjectCommand({Bucket: bucket, Key: key});
		const url = await getSignedUrl(s3Client, cmd, {expiresIn: expiresInSeconds});
		return url;
	}
	// اگر قبلاً یک buffer باشد
	else if (Buffer.isBuffer(fileData)) {
		const uploadParams = {
			Bucket: bucket,
			Key: key,
			Body: fileData,
			ContentType: 'application/octet-stream',
		};

		await s3Client.send(new PutObjectCommand(uploadParams));

		const cmd = new GetObjectCommand({Bucket: bucket, Key: key});
		const url = await getSignedUrl(s3Client, cmd, {expiresIn: expiresInSeconds});
		return url;
	} else {
		throw new Error('نوع فایل نامعتبر است');
	}
}

export async function getFileLinkUploaded(bucket: string, key: string) {
	// اگر fileData شامل buffer باشد (مثل فایل آپلود شده با multer)
	const cmd = new GetObjectCommand({Bucket: bucket, Key: key});
	const url = await getSignedUrl(s3Client, cmd);
	return url;

}

// export async function downloadAndUploadToS3(fileUrl: string) {
// 	try {
// 		// مرحله ۱: دانلود فایل از لینک
// 		const response: any = await requestServiceDownload(true, 'get', fileUrl);
// 		// مرحله ۲: تبدیل داده به Buffer
// 		const fileBuffer = Buffer.from(response.data);
//
// 		// تشخیص نوع فایل از header یا extension
// 		const contentType = response.headers['content-type'] ||
// 			getContentTypeFromExtension(fileUrl) ||
// 			'application/octet-stream';
//
// 		const objectKey = '/media/' + new Date().getFullYear().toString() + '/' + new Date().getMonth().toString() + '/' + uuidv4() + '.webp';
// 		let bucket = 'datakhana';
// 		let expiresIn = 60 * 60 * 24 * 48 * 1000;
// 		const expiresAt = new Date(new Date().getTime() + expiresIn);
//
// 		// مرحله ۳: آپلود به S3
// 		const uploadParams = {
// 			Bucket: bucket,
// 			Key: objectKey,
// 			Body: fileBuffer,
// 			ContentType: contentType,
// 			ContentLength: fileBuffer.length,
// 		};
//
// 		await s3Client.send(new PutObjectCommand(uploadParams));
//
// 		// مرحله ۴:生成 presigned URL
// 		const cmd = new GetObjectCommand({Bucket: bucket, Key: objectKey});
// 		const signedUrl = await getSignedUrl(s3Client, cmd);
//
// 		return {
// 			bucket,
// 			objectKey,
// 			expiresIn,
// 			expiresAt,
// 		};
//
// 	} catch (error: any) {
// 		console.error('خطا در دانلود یا آپلود فایل:', error.message);
//
// 		if (error.response) {
// 			console.error('Status:', error.response.status);
// 			console.error('Data:', error.response.data);
// 		}
//
// 		throw new Error(`دانلود یا آپلود فایل ناموفق بود: ${ error.message }`);
// 	}
// }

export async function downloadMedia(fileUrl: string) {
	try {
		let downloaded = await downloadAndUploadToS3(fileUrl);
		return downloaded;
		// return `https://backpanel.datakhana.com/d/${ data.id }`;
	} catch (error: any) {
		console.error('خطا در دانلود یا آپلود فایل:', error.message, fileUrl);

		if (error.response) {
			console.error('Status:', error.response.status);
			console.error('Data:', error.response.data);
		}

		return fileUrl;
	}
}

// تابع کمکی برای تشخیص content type از extension فایل
function getContentTypeFromExtension(url: string): string {
	const extension: any = url.split('.').pop()?.toLowerCase();

	const contentTypes: any = {
		'png': 'image/png',
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'gif': 'image/gif',
		'webp': 'image/webp',
		'svg': 'image/svg+xml',
		'pdf': 'application/pdf',
		'zip': 'application/zip',
		'mp4': 'video/mp4',
		'mp3': 'audio/mpeg',
		'txt': 'text/plain',
		'html': 'text/html',
		'css': 'text/css',
		'js': 'application/javascript',
		'json': 'application/json',
	};

	return contentTypes[extension] || 'application/octet-stream';
}

// تابع برای دریافت اطلاعات فایل بدون دانلود کامل
export async function getFileInfo(url: string) {
	try {
		const response = await axios.head(url);
		return {
			contentType: response.headers['content-type'],
			contentLength: response.headers['content-length'],
			lastModified: response.headers['last-modified'],
		};
	} catch (error: any) {
		console.warn('نتوانستیم اطلاعات فایل را دریافت کنیم:', error.message);
		return null;
	}
}
