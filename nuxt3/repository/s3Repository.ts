import { S3Client } from '@aws-sdk/client-s3';

let memo = {} as { client?: S3Client};

export const getS3Client = ({region}: {region: string}) => {
  if (memo.client) return memo.client;

  const s3Client = new S3Client({
    region
  });
  memo.client = s3Client;
  return s3Client;
};
