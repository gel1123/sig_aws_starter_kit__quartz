import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let memo = {} as { client?: DynamoDBDocumentClient};

export const getDynamoDBDocumentClient = () => {
  if (memo.client) return memo.client;

  const config = useRuntimeConfig();
  const dbClient = new DynamoDBClient({
    region: config.region, //<= Lambda@Edgeとして動かすのでリージョンを明示
  });
  const _dynamoDBDocumentClient = DynamoDBDocumentClient.from(dbClient);
  memo.client = _dynamoDBDocumentClient;
  return _dynamoDBDocumentClient;
}