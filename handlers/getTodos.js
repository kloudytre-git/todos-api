const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../lib/dynamo");
const { response } = require("../lib/response");

const TABLE = process.env.TODOS_TABLE;
const DEMO_USER = "demo-user";

module.exports.handler = async () => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": DEMO_USER,
    },
  }));

  return response(200, result.Items);
};