import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  DynamoDBClient
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.CREW_TABLE || "CrewTable";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION }),
  {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  }
);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const method = event.requestContext.http.method;
  const headers = { "content-type": "application/json" };

  try {
    if (method === "GET" && event.rawPath === "/crew/{role}/movies/{movieId}") {
      const role = event.pathParameters?.role;
      const movieId = event.pathParameters?.movieId;

      if (!role || !movieId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing role or movieId" }),
        };
      }

      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          movieId: Number(movieId),
          role: role,
        },
      });

      const result = await client.send(command);

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
