const { randomUUID } = require("crypto");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../lib/dynamo");
const { response } = require("../lib/response");

const TABLE = process.env.TODOS_TABLE;
const DEMO_USER = "demo-user";

module.exports.handler = async (event) => {
  const data = JSON.parse(event.body || "{}");

  if (!data.title) {
    return response(400, { error: "title is required" });
  }

  const todo = {
    userId: DEMO_USER,
    todoId: randomUUID(),
    title: data.title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: todo,
  }));

  return response(201, todo);
};