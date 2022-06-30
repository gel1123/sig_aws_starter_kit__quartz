import nodeFetch from 'node-fetch';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoDBDocumentClient } from "~~/repository/dynamoDBRepository";
import { getS3Client } from "~~/repository/s3Repository";

/**
 * https://v3.nuxtjs.org/guide/features/server-routes/
 * 
 * #### curl例
 * ```
 * curl -H "Content-Type: application/json" -XPOST -d '{"message":"Hello World"}' http://localhost:3000/api/echo
 * ```
 * 
 * #### 注：
 * Content-Type: application/json は必須
 */
export default defineEventHandler(async (e) => {
  const body =  e.req.method === 'POST' ? await useBody(e) : undefined;
  const config = useRuntimeConfig();
  const region = config.region;
  const Bucket = config.bucket;
  const itemID = "test";
  const fileName = /* body.fileName */ "item001.imagefile";
  const Key = `items/${itemID}/${fileName}`;

  const dataUrl = body.dataUrl;
  const blob = await (await nodeFetch(dataUrl)).blob();
  const file = new File([blob], fileName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const S3C = getS3Client({region});
  const DDC = getDynamoDBDocumentClient({region});

  const TableName = config.dataTable;
  const PK = "info";
  const SK = itemID;
  const imagePath = `/${Key}`;
  const Item = {PK, SK, imagePath};

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

  let dynamoDbResult;
  try {
    const _dynamoDbResult = await DDC.send(new PutCommand({TableName, Item}));
    dynamoDbResult = _dynamoDbResult;
  } catch (e) {
    return {
      httpStatusCode: 500,
      errorMessage: "Error occurred when put item to S3.",
    };
  }

  if (dynamoDbResult.$metadata.httpStatusCode !== 200) {
    return {
      httpStatusCode: dynamoDbResult.$metadata.httpStatusCode,
      errorMessage: "Failed to put item to DynamoDB.",
    };
  }

  // DynamoDB操作の戻り値について：
  //   デフォルトでは戻り値なしであるため、dynamoDbResult.Attributesはここでは存在しない。
  //   また、ReturnValuesを指定したとしても、Put操作では「上書き前のレコード」を返す設定しか存在せず、
  //   新しく上書きした（追加した）レコードをレスポンスから取得する手段は存在しない。
  //   https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.ReturnValues

  
  return {
    httpStatusCode: 200,
    record: {...Item},
  };
});
