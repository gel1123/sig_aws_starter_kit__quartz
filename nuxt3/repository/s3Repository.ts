import { S3Client } from '@aws-sdk/client-s3';

let memo = {} as { client?: S3Client};

export const getS3Client = () => {
  if (memo.client) return memo.client;

  const config = useRuntimeConfig();
  const s3Client = new S3Client({
    region: config.region,
  });
  memo.client = s3Client;
  return s3Client;
};
