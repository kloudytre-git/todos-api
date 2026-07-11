const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../lib/dynamo");
const { response } = require("../lib/response");

const TABLE = process.env.TODOS_TABLE;
const DEMO_USER = "demo-user";

module.exports.handler = async (event) => {
  const { todoId } = event.pathParameters;

  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { userId: DEMO_USER, todoId },
  }));

  return response(200, { todoId, deleted: true });
};