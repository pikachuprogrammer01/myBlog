const OSS = require('ali-oss');

let client = null;
let configured = null;

function isConfigured() {
  if (configured !== null) return configured;
  configured = !!(
    process.env.OSS_REGION &&
    process.env.OSS_ACCESS_KEY_ID &&
    process.env.OSS_ACCESS_KEY_SECRET &&
    process.env.OSS_BUCKET
  );
  if (!configured) {
    console.log('[OSS] 未配置环境变量，图片将保留原始链接');
  }
  return configured;
}

function getClient() {
  if (!isConfigured()) return null;
  if (client) return client;
  client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
  });
  return client;
}

/**
 * 上传图片 Buffer 到 OSS
 * @param {string} folder - OSS 目录，如 'blog/images'
 * @param {Buffer} buffer - 图片二进制数据
 * @param {string} contentType - MIME 类型
 * @param {string} originalName - 原始文件名（用于提取扩展名）
 * @returns {Promise<string|null>} OSS URL 或 null
 */
async function uploadImage(folder, buffer, contentType, originalName) {
  const oss = getClient();
  if (!oss) return null;

  const ext = (originalName || '').split('.').pop()?.toLowerCase() || 'png';
  // Normalize extension
  const validExts = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif', webp: 'webp', svg: 'svg', bmp: 'bmp' };
  const safeExt = validExts[ext] || 'png';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const objectName = `${folder}/${timestamp}_${random}.${safeExt}`;

  try {
    const result = await oss.put(objectName, buffer, {
      headers: { 'Content-Type': contentType || `image/${safeExt}` },
    });

    // 优先使用自定义域名，否则用默认 URL
    const customDomain = process.env.OSS_CUSTOM_DOMAIN;
    if (customDomain) {
      const domain = customDomain.replace(/\/+$/, '');
      return `${domain}/${objectName}`;
    }
    return result.url;
  } catch (error) {
    console.error('[OSS] 上传失败:', error.message);
    return null;
  }
}

/**
 * 下载远程图片并上传到 OSS，返回 OSS URL
 * @param {string} imageUrl - 远程图片 URL
 * @param {string} folder - OSS 目录
 * @returns {Promise<string|null>} OSS URL 或 null（失败时返回 null，保留原始 URL）
 */
async function mirrorImage(imageUrl, folder = 'blog/images') {
  if (!isConfigured()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(imageUrl, { signal: controller.signal });
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/png';

    // 从 URL 提取文件名
    let filename = 'image.png';
    try {
      const urlPath = new URL(imageUrl).pathname;
      const segments = urlPath.split('/');
      const last = segments[segments.length - 1];
      if (last && last.includes('.')) filename = last;
    } catch {}

    return await uploadImage(folder, buffer, contentType, filename);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { isConfigured, uploadImage, mirrorImage };
