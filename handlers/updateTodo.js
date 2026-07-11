const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../lib/dynamo");
const { response } = require("../lib/response");

const TABLE = process.env.TODOS_TABLE;
const DEMO_USER = "demo-user";

module.exports.handler = async (event) => {
  const { todoId } = event.pathParameters;
  const data = JSON.parse(event.body || "{}");

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId: DEMO_USER, todoId },
    UpdateExpression: "set title = :title, completed = :completed",
    ExpressionAttributeValues: {
      ":title": data.title,
      ":completed": data.completed,
    },
    ReturnValues: "ALL_NEW",
  }));

  return response(200, result.Attributes);
};