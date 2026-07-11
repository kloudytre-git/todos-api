# todo-api

A full-stack-ready **serverless REST API** for managing todos, built on AWS. It exposes simple CRUD endpoints backed by AWS Lambda, Amazon API Gateway, and Amazon DynamoDB, and is deployed and managed entirely as code with the [Serverless Framework](https://www.serverless.com/).

There are no servers to manage: the API scales automatically with traffic and costs nothing while idle.

---

## What it does

`todo-api` provides four HTTP endpoints to create, list, update, and delete todo items. Each request is handled by an individual Lambda function, routed through API Gateway, and persisted in a single DynamoDB table.

A todo item looks like this:

```json
{
  "userId": "demo-user",
  "todoId": "a1b2c3d4-5e6f-7890-abcd-ef1234567890",
  "title": "Learn DynamoDB",
  "completed": false,
  "createdAt": "2026-07-10T23:24:15.000Z"
}
```

> **Note:** This project currently hardcodes a single `demo-user` as the owner of every todo. There is no authentication yet — see [Roadmap](#roadmap). Adding Amazon Cognito is the recommended next step to give each signed-in user their own private list.

---

## Architecture

```
Client  ──►  API Gateway  ──►  AWS Lambda  ──►  DynamoDB
(HTTP)       (HTTP API)        (handlers)       (todo-api-dev)
```

- **API Gateway (HTTP API)** receives requests and routes each method/path to the correct Lambda.
- **AWS Lambda** runs one function per operation, containing the business logic.
- **DynamoDB** stores the items in a single table, keyed for efficient per-user reads.
- **IAM** grants each function least-privilege access to the table (only the four actions it needs).

---

## Tech stack

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Compute          | AWS Lambda (Node.js 20.x)                              |
| API              | Amazon API Gateway (HTTP API)                          |
| Database         | Amazon DynamoDB (on-demand / `PAY_PER_REQUEST`)        |
| Infrastructure   | Serverless Framework v4                                |
| AWS SDK          | AWS SDK for JavaScript v3 (`@aws-sdk/lib-dynamodb`)    |

---

## Project structure

```
todo-api/
├── serverless.yml          # Infrastructure as code: table, functions, routes, IAM, CORS
├── package.json
├── .gitignore
└── src/
    ├── handlers/
    │   ├── createTodo.js    # POST   /todos
    │   ├── getTodos.js      # GET    /todos
    │   ├── updateTodo.js    # PUT    /todos/{todoId}
    │   └── deleteTodo.js    # DELETE /todos/{todoId}
    └── lib/
        ├── dynamo.js        # Shared DynamoDB Document client (reused across invocations)
        └── response.js      # Shared HTTP response builder (JSON + CORS headers)
```

---

## Data model

The DynamoDB table uses a **composite primary key** so that all of a user's todos can be fetched with a single efficient `Query` (never a full-table `Scan`):

| Attribute   | Role                | Type   | Notes                                    |
| ----------- | ------------------- | ------ | ---------------------------------------- |
| `userId`    | Partition key (HASH)| String | Groups every todo by its owner           |
| `todoId`    | Sort key (RANGE)    | String | Unique per todo (generated UUID)         |

All other fields (`title`, `completed`, `createdAt`) are **schemaless** — DynamoDB stores them without any declaration. Only key attributes are defined in `serverless.yml`.

---

## API reference

Base URL after deploy looks like:
`https://<api-id>.execute-api.<region>.amazonaws.com`

### Create a todo

```
POST /todos
Content-Type: application/json

{ "title": "Learn DynamoDB" }
```

**201 Created** → returns the new todo (including its generated `todoId`).
**400 Bad Request** → `{ "error": "title is required" }` if `title` is missing.

### List todos

```
GET /todos
```

**200 OK** → returns an array of the current user's todos.

### Update a todo

```
PUT /todos/{todoId}
Content-Type: application/json

{ "title": "Learn DynamoDB", "completed": true }
```

**200 OK** → returns the updated todo (post-update state).

### Delete a todo

```
DELETE /todos/{todoId}
```

**200 OK** → `{ "todoId": "...", "deleted": true }`

---

## Prerequisites

Before running or deploying, you need:

1. **Node.js 20 or newer** — check with `node --version`.
2. **An AWS account** with credentials configured locally. The cleanest way is an IAM user with programmatic access:
   ```bash
   aws configure
   # provide Access Key, Secret Key, region (e.g. us-east-1), output: json
   ```
   Verify with:
   ```bash
   aws sts get-caller-identity
   ```
3. **Serverless Framework v4**, installed globally and authenticated:
   ```bash
   npm install -g serverless
   serverless login
   ```
   > Serverless Framework v4 requires a one-time sign-in (via Dashboard or a license key) even on the free tier. The CLI remains free for individual developers and small businesses; only organizations above $2M annual revenue need a paid subscription.

---

## Setup

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd todo-api
npm install
```

This installs the AWS SDK v3 packages the handlers use (`@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`).

---

## Deploy to AWS

Because this is a serverless application, the primary way to "run" it is to deploy it to your own AWS account (into an isolated `dev` stage):

```bash
serverless deploy
```

On success, Serverless prints the deployed endpoints near the top of the output:

```
endpoints:
  POST   - https://abc123xyz.execute-api.us-east-1.amazonaws.com/todos
  GET    - https://abc123xyz.execute-api.us-east-1.amazonaws.com/todos
  PUT    - https://abc123xyz.execute-api.us-east-1.amazonaws.com/todos/{todoId}
  DELETE - https://abc123xyz.execute-api.us-east-1.amazonaws.com/todos/{todoId}
```

Copy the base URL — you'll use it to test the API and to configure any frontend. If you lose it, run `serverless info` to reprint everything.

### Test the deployed API

```bash
# Save your base URL
export API="https://abc123xyz.execute-api.us-east-1.amazonaws.com"

# Create
curl -X POST "$API/todos" \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn DynamoDB"}'

# List
curl "$API/todos"

# Update (paste a real todoId from the create response)
curl -X PUT "$API/todos/PASTE_TODO_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn DynamoDB", "completed": true}'

# Delete
curl -X DELETE "$API/todos/PASTE_TODO_ID"
```

You can inspect stored items directly with:

```bash
aws dynamodb scan --table-name todo-api-dev
```

---

## Running locally (offline)

Serverless apps don't run as a traditional local server, but you can emulate API Gateway + Lambda on your machine with the **serverless-offline** plugin. Two options:

### Option A — offline compute, real DynamoDB (simplest)

Emulate the API locally while reading/writing your real deployed `todo-api-dev` table (requires AWS credentials and a prior `serverless deploy` so the table exists):

```bash
npm install --save-dev serverless-offline
```

Add the plugin to `serverless.yml`:

```yaml
plugins:
  - serverless-offline
```

Then start it:

```bash
serverless offline
```

The API is served at `http://localhost:3000`. Point your frontend's `VITE_API_URL` at that address for local development.

### Option B — fully offline (compute + database)

For a completely local setup with no AWS calls, also run [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) (via Docker or the `serverless-dynamodb` plugin) and configure the handlers' DynamoDB client to target `http://localhost:8000`. This is more involved but keeps everything on your machine.

---

## Configuration

| Setting        | Where              | Default            | Purpose                                    |
| -------------- | ------------------ | ------------------ | ------------------------------------------ |
| `TODOS_TABLE`  | `serverless.yml`   | `todo-api-<stage>` | DynamoDB table name, injected into Lambdas |
| `region`       | `serverless.yml`   | `us-east-1`        | AWS region for all resources               |
| `stage`        | `serverless.yml`   | `dev`              | Environment label (`dev`, `prod`, …)       |
| CORS origins   | `serverless.yml`   | `localhost:5173`   | Origins allowed to call the API            |

To deploy a separate production stage:

```bash
serverless deploy --stage prod
```

This creates an independent copy of the table and functions suffixed with `prod`.

> **CORS:** The allowed origins are configured under `provider.httpApi.cors` in `serverless.yml`. When you deploy a frontend to a real URL (e.g. a Netlify or CloudFront domain), add that URL to `allowedOrigins` and redeploy, or the browser will block requests from it.

---

## Useful commands

| Command                                      | Description                                        |
| -------------------------------------------- | -------------------------------------------------- |
| `serverless deploy`                          | Deploy the whole service                           |
| `serverless deploy function -f getTodos`     | Fast-redeploy a single function's code             |
| `serverless info`                            | Print stack info, including endpoint URLs          |
| `serverless logs -f getTodos`                | View a function's CloudWatch logs                  |
| `serverless logs -f getTodos --tail`         | Stream a function's logs live                      |
| `serverless remove`                          | **Tear down** all resources (deletes the table)    |

---

## Cost

With DynamoDB on-demand billing and Lambda's pay-per-invocation model, this API costs effectively **nothing while idle** and only a tiny amount per request under light use. When you're done experimenting, `serverless remove` deletes everything so nothing lingers.

---

## Roadmap

Planned / recommended improvements, roughly in order of impact:

- **Authentication with Amazon Cognito** — replace the hardcoded `demo-user` with the real identity of the signed-in user, giving each user a private list.
- **Input validation & error handling** — validate request bodies and wrap handlers in structured try/catch instead of bare `500`s.
- **CI/CD** — deploy automatically on `git push` via GitHub Actions.
- **Pagination** — support `Limit` / `LastEvaluatedKey` on the list endpoint for large lists.

---

## License

MIT (or your preferred license — update this section as needed).
