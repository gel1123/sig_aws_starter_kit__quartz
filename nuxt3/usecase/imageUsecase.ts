import { PutObjectCommand } from '@aws-sdk/client-s3';
import { fromImage } from 'imtool';
import { ImageType } from 'imtool/lib/Utils';
import { getS3Client } from '~~/repository/s3Repository';

/**
 * 画像をリサイズする。
 * リサイズ結果は、HTML上にすぐ表示するためのDataUrl形式と、
 * ストレージに保存する用のBlob形式の双方で返却する。
 *
 * なお使用しているライブラリは、imtoolを使用している。
 * - https://github.com/mat-sz/imtool
 */
export const resize = async (file: ImageType) => {
  const tool = await fromImage(file);
  const thumbnail = tool.thumbnail(1000, true);
  const resizedDataUrl = await thumbnail.toDataURL();
  return { resizedDataUrl };
};

// export const uploadImageToS3 = async ({dataUrl}: {
//   dataUrl: string;
// }) => {
//   const config = useRuntimeConfig()
//   const region = config.public.region;
//   const Bucket = config.public.bucket;
//   const itemID = "test";
//   const fileName = /* body.fileName */ "item.imagefile";
//   const Key = `items/${itemID}/${fileName}`;

//   const blob = await (await fetch(dataUrl)).blob();
//   const file = new File([blob], fileName);
//   const arrayBuffer = await file.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);

//   const idToken = useCookie("id_token").value;
//   const identityPoolId = config.public.identityPoolId;
//   console.log("idToken:", `${idToken.substring(0, 10)}...`);
//   const frontEndOption = {identityPoolId, idToken}

//   const S3C = getS3Client({region, frontEndOption});
  
//   let s3Result;
//   try {
//     console.log("try put item to s3")
//     const _s3Result = await S3C.send(new PutObjectCommand({Bucket, Key, Body: buffer}));
//     console.log("s3 result:", _s3Result);
//     s3Result=_s3Result;
//   } catch (e) {
//     console.log("error:", e);
//     return {
//       httpStatusCode: 500,
//       errorMessage: "Error occurred when put item to S3.",
//     };
//   }

//   if (s3Result.$metadata.httpStatusCode !== 200) {
//     return {
//       httpStatusCode: s3Result.$metadata.httpStatusCode,
//       errorMessage: "Failed to put item to S3.",
//     };
//   }
  
//   return {
//     httpStatusCode: 200,
//   }
// }