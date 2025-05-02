import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const method = event.requestContext.http.method;
  const headers = { "content-type": "application/json" };

  try {
    const movieId = event.pathParameters?.movieId;
    const role = event.pathParameters?.role;
    const verbose = event.queryStringParameters?.verbose === "true";

    if (method === "GET" && role && movieId) {
      if (verbose) {
        const query = new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "movieId = :mid",
          ExpressionAttributeValues: {
            ":mid": Number(movieId),
          },
        });

        const result = await client.send(query);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.Items),
        };
      } else {
        const get = new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            movieId: Number(movieId),
            role: role,
          },
        });

        const result = await client.send(get);
        if (!result.Item) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Crew not found" }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.Item),
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
