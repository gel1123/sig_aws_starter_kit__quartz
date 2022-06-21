import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let memo = {} as { client?: DynamoDBDocumentClient};

export const getDynamoDBDocumentClient = ({region}: {region: string}) => {
  if (memo.client) return memo.client;

  const dbClient = new DynamoDBClient({
    // Lambda@Edgeとして動かすのでリージョンを明示
    region
  });
  const _dynamoDBDocumentClient = DynamoDBDocumentClient.from(dbClient, {
    marshallOptions: {
      removeUndefinedValues: true
    }
  });
  memo.client = _dynamoDBDocumentClient;
  return _dynamoDBDocumentClient;
}