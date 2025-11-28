// Tebi.io S3-compatible integration for file upload/delete
// You need to install 'aws-sdk' or '@aws-sdk/client-s3' for S3 API support
// npm install @aws-sdk/client-s3

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const tebiConfig = {
  region: 'us-east-1', // Change to your Tebi region
  endpoint: 'https://s3.tebi.io', // Tebi S3 endpoint
  credentials: {
    accessKeyId: import.meta.env.VITE_TEBI_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_TEBI_SECRET_KEY,
  },
};

const s3 = new S3Client(tebiConfig);

export async function uploadFile(bucket, file, key) {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: file.type || 'application/octet-stream',
  };
  await s3.send(new PutObjectCommand(params));
}

export async function deleteFile(bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key,
  };
  await s3.send(new DeleteObjectCommand(params));
}

// Helper to get public URL for a file
export function getPublicUrl(bucket, key) {
  return `https://s3.tebi.io/${bucket}/${key}`;
}
