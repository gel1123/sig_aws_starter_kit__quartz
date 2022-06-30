import { PutObjectCommand } from '@aws-sdk/client-s3';
import { fromImage } from 'imtool';
import { getS3Client } from '~~/repository/s3Repository';
import { getCredentials } from '~~/service/auth/getCredentials';

/**
 * 画像をリサイズする。
 * リサイズ結果は、HTML上にすぐ表示するためのDataUrl形式と、
 * ストレージに保存する用のBlob形式の双方で返却する。
 *
 * なお使用しているライブラリは、imtoolを使用している。
 * - https://github.com/mat-sz/imtool
 */
export const resize = async (file: File) => {
  const tool = await fromImage(file);
  const thumbnail = tool.thumbnail(1000, true);
  const resizedDataUrl = await thumbnail.toDataURL();
  const resizedFile = await thumbnail.toFile(file.name);
  return { resizedDataUrl, resizedFile };
};

/**
 * Cognito ID Pool から「一時的な認証情報」を取得した上で、
 * S3に画像をアップロードし、その後DynamoDBの画像のパスを含むレコードを保存する
 */
export const uploadImageToS3 = async ({file, itemId, fileName}: {
  file: File;
  itemId: string;
  fileName: string;
}) => {

  const idToken = useCookie("id_token").value;
  const cognitoCredentials = await getCredentials(idToken);

  const config = useRuntimeConfig()
  const region = config.public.region;
  const Bucket = config.public.bucket;
  const Key = `items/${itemId}/${fileName}`;

  // なお同様の処理をバックエンドで行うなら、bodyにdataURLを詰めて、fetch => Blob => File という変換手続きが必要になる。
  // const blob = await (await fetch(dataUrl)).blob();
  // const file = new File([blob], fileName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const S3C = getS3Client({region, cognitoCredentials});
  
  let s3Result;
  try {
    console.log("try put item to s3")
    const _s3Result = await S3C.send(new PutObjectCommand({Bucket, Key, Body: buffer}));
    console.log("s3 result:", _s3Result);
    s3Result=_s3Result;
  } catch (e) {
    console.log("error:", e);
    return {
      httpStatusCode: 500,
      errorMessage: "Error occurred when put item to S3.",
    };
  }

  if (s3Result.$metadata.httpStatusCode !== 200) {
    return {
      httpStatusCode: s3Result.$metadata.httpStatusCode,
      errorMessage: "Failed to put item to S3.",
    };
  }
  
  return {
    httpStatusCode: 200,
    imagePath: `/${Key}`,
  }
}
