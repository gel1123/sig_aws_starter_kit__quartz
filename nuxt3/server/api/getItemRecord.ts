import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoDBDocumentClient } from "~~/repository/dynamoDBRepository";

export default defineEventHandler(async (e) => {
  const config = useRuntimeConfig();
  const query = await useQuery(e);
  const DDC = getDynamoDBDocumentClient({region: config.region});
  const record = await DDC.send(new GetCommand({
    TableName: config.dataTable,
    Key: {
      PK: "info",
      SK: query.itemID,
    }
  }));
  console.log({record});
  return {
    Item: {
      imagePath: record.Item?.imagePath,
      PK: record.Item?.PK,
      SK: record.Item?.SK,
    }
  };
});
