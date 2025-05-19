---
title: Auth0 AI plugin
---

The Auth0 AI plugin (`@auth0/ai-genkit`) is an SDK for building secure AI-powered applications using [Auth0](https://www.auth0.ai/), [Okta FGA](https://docs.fga.dev/) and Genkit.

## Features

- **Authorization for RAG**: Securely filter documents using Okta FGA as a [retriever](https://js.langchain.com/docs/concepts/retrievers/) for RAG applications. This smart retriever performs efficient batch access control checks, ensuring users only see documents they have permission to access.

- **Tool Authorization with FGA**: Protect AI tool execution with fine-grained authorization policies through Okta FGA integration, controlling which users can invoke specific tools based on custom authorization rules.

- **Client Initiated Backchannel Authentication (CIBA)**: Implement secure, out-of-band user authorization for sensitive AI operations using the [CIBA standard](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html), enabling user confirmation without disrupting the main interaction flow.

- **Federated API Access**: Seamlessly connect to third-party services by leveraging Auth0's Tokens For APIs feature, allowing AI tools to access users' connected services (like Google, Microsoft, etc.) with proper authorization.

- **Device Authorization Flow**: Support headless and input-constrained environments with the [Device Authorization Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/device-authorization-flow), enabling secure user authentication without direct input capabilities.

## Installation

:::caution
`@auth0/ai-genkit` is currently **under heavy development**. We strictly follow [Semantic Versioning (SemVer)](https://semver.org/), meaning all **breaking changes will only occur in major versions**. However, please note that during this early phase, **major versions may be released frequently** as the API evolves. We recommend locking versions when using this in production.
:::

```bash
npm install @auth0/ai @auth0/ai-genkit
```

## Initialization

Initialize the SDK with your Auth0 credentials:

```javascript
import { Auth0AI, setAIContext } from "@auth0/ai-genkit";
import { genkit } from "genkit/beta";
import { googleAI } from "@genkit-ai/googleai";

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'),
});

// Initialize Auth0AI
const auth0AI = new Auth0AI({
  // Alternatively, you can use the `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET`
  // environment variables.
  auth0: {
    domain: "YOUR_AUTH0_DOMAIN",
    clientId: "YOUR_AUTH0_CLIENT_ID",
    clientSecret: "YOUR_AUTH0_CLIENT_SECRET",
  },

  // store: new MemoryStore(), // Optional: Use a custom store

  genkit: ai
});
```

## Calling APIs

The "Tokens for API" feature of Auth0 allows you to exchange refresh tokens for access tokens for third-party APIs. This is useful when you want to use a federated connection (like Google, Facebook, etc.) to authenticate users and then use the access token to call the API on behalf of the user.

First initialize the Federated Connection Authorizer as follows:

```javascript
const withGoogleAccess = auth0AI.withTokenForConnection({
  // An optional function to specify where to retrieve the token
  // This is the default:
  refreshToken: async (params) => {
    return context.refreshToken;
  },
  // The connection name:
  connection: "google-oauth2",
  // The scopes to request:
  scopes: ["https://www.googleapis.com/auth/calendar.freebusy"],
});
```

Then use the `withGoogleAccess` to wrap the tool and use `getAccessTokenForConnection` from the SDK to get the access token:

```javascript
import { getAccessTokenForConnection } from "@auth0/ai-genkit";
import { FederatedConnectionError } from "@auth0/ai/interrupts";
import { addHours } from "date-fns";
import { z } from "zod";

export const checkCalendarTool = ai.defineTool(
  ...withGoogleAccess({
    name: "check_user_calendar",
    description:
      "Check user availability on a given date time on their calendar",
    inputSchema: z.object({
      date: z.coerce.date(),
    }),
    outputSchema: z.object({
      available: z.boolean(),
    }),
  },
  async ({ date }) => {
    const accessToken = getAccessTokenForConnection();
    const body = JSON.stringify({
      timeMin: date,
      timeMax: addHours(date, 1),
      timeZone: "UTC",
      items: [{ id: "primary" }],
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new FederatedConnectionError(
          `Authorization required to access the Federated Connection`
        );
      }
      throw new Error(
        `Invalid response from Google Calendar API: ${
          response.status
        } - ${await response.text()}`
      );
    }
    const busyResp = await response.json();
    return { available: busyResp.calendars.primary.busy.length === 0 };
  }
));
```

## CIBA: Client-Initiated Backchannel Authentication

CIBA (Client-Initiated Backchannel Authentication) enables secure, user-in-the-loop authentication for sensitive operations. This flow allows you to request user authorization asynchronously and resume execution once authorization is granted.

```javascript
const buyStockAuthorizer = auth0AI.withAsyncUserConfirmation({
  // A callback to retrieve the userID from tool context.
  userID: (_params, config) => {
    return config.configurable?.user_id;
  },
  // The message the user will see on the notification
  bindingMessage: async ({ qty , ticker }) => {
    return `Confirm the purchase of ${qty} ${ticker}`;
  },
  // The scopes and audience to request
  audience: process.env["AUDIENCE"],
  scopes: ["stock:trade"]
});
```

Then wrap the tool as follows:

```javascript
import { z } from "zod";
import { getCIBACredentials } from "@auth0/ai-genkit";

export const buyTool = ai.defineTool(
  ...buyStockAuthorizer({
    name: "buy_stock",
    description: "Execute a stock purchase given stock ticker and quantity",
    inputSchema: z.object({
      tradeID: z
        .string()
        .uuid()
        .describe("The unique identifier for the trade provided by the user"),
      userID: z
        .string()
        .describe("The user ID of the user who created the conditional trade"),
      ticker: z.string().describe("The stock ticker to trade"),
      qty: z
        .number()
        .int()
        .positive()
        .describe("The quantity of shares to trade"),
    }),
    outputSchema: z.string(),
  },
  async ({ ticker, qty }) => {
    const { accessToken } = getCIBACredentials();
    fetch("http://yourapi.com/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ticker, qty }),
    });
    return `Purchased ${qty} shares of ${ticker}`;
  })
);
```

### CIBA with RAR (Rich Authorization Requests)

Auth0 supports RAR (Rich Authorization Requests) for CIBA. This allows you to provide additional authorization parameters to be displayed during the user confirmation request.

When defining the tool authorizer, you can specify the `authorizationDetails` parameter to include detailed information about the authorization being requested:

```javascript
const buyStockAuthorizer = auth0AI.withAsyncUserConfirmation({
  // A callback to retrieve the userID from tool context.
  userID: (_params, config) => {
    return config.configurable?.user_id;
  },
  // The message the user will see on the notification
  bindingMessage: async ({ qty , ticker }) => {
    return `Confirm the purchase of ${qty} ${ticker}`;
  },
  authorizationDetails: async ({ qty, ticker }) => {
    return [{ type: "trade_authorization", qty, ticker, action: "buy" }];
  },
  // The scopes and audience to request
  audience: process.env["AUDIENCE"],
  scopes: ["stock:trade"]
});
```

To use RAR with CIBA, you need to [set up authorization details](https://auth0.com/docs/get-started/apis/configure-rich-authorization-requests) in your Auth0 tenant. This includes defining the authorization request parameters and their types. Additionally, the [Guardian SDK](https://auth0.com/docs/secure/multi-factor-authentication/auth0-guardian) is required to handle these authorization details in your authorizer app.

For more information on setting up RAR with CIBA, refer to:
- [Configure Rich Authorization Requests (RAR)](https://auth0.com/docs/get-started/apis/configure-rich-authorization-requests)
- [User Authorization with CIBA](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-initiated-backchannel-authentication-flow/user-authorization-with-ciba)

## Device Flow Authorizer

The Device Flow Authorizer enables secure, user-in-the-loop authentication for devices or tools that cannot directly authenticate users. It uses the OAuth 2.0 Device Authorization Grant to request user authorization and resume execution once authorization is granted.

```javascript
import { auth0 } from "./auth0";

export const deviceFlowAuthorizer = auth0AI.withDeviceAuthorizationFlow({
  // The scopes and audience to request
  scopes: ["read:data", "write:data"],
  audience: "https://api.example.com",
});
```

Then wrap the tool as follows:

```javascript
import { z } from "zod";
import { getDeviceAuthorizerCredentials } from "@auth0/ai-genkit";

export const fetchData = ai.defineTool(
  ...deviceFlowAuthorizer({
    name: "fetch_data",
    description: "Fetch data from a secure API",
    inputSchema: z.object({
      resourceID: z.string().describe("The ID of the resource to fetch"),
    }),
    outputSchema: z.any(),
  },
  async ({ resourceID }) => {
    const credentials = getDeviceAuthorizerCredentials();
    const response = await fetch(`https://api.example.com/resource/${resourceID}`, {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.statusText}`);
    }

    return await response.json();
  })
);
```

## FGA

```javascript
import { Auth0AI } from "@auth0/ai-llamaindex";

const auth0AI = new Auth0AI.FGA({
  apiScheme,
  apiHost,
  storeId,
  credentials: {
    method: CredentialsMethod.ClientCredentials,
    config: {
      apiTokenIssuer,
      clientId,
      clientSecret,
    },
  },
});
// Alternatively you can use env variables: `FGA_API_SCHEME`, `FGA_API_HOST`, `FGA_STORE_ID`, `FGA_API_TOKEN_ISSUER`, `FGA_CLIENT_ID` and `FGA_CLIENT_SECRET`
```

Then initialize the tool wrapper:

```javascript
const authorizedTool = fgaAI.withFGA(
  {
    buildQuery: async ({ userID, doc }) => ({
      user: userID,
      object: doc,
      relation: "read",
    }),
  },
  myAITool
);

// Or create a wrapper to apply to tools later
const authorizer = fgaAI.withFGA({
  buildQuery: async ({ userID, doc }) => ({
    user: userID,
    object: doc,
    relation: "read",
  }),
});

const authorizedTool = authorizer(myAITool);
```

:::note
The parameters given to the `buildQuery` function are the same provided to the tool's `execute` function.
:::

## RAG with FGA

Auth0 AI can leverage OpenFGA to authorize RAG applications. The `FGARetriever` can be used to filter documents based on access control checks defined in Okta FGA. This retriever performs batch checks on retrieved documents, returning only the ones that pass the specified access criteria.

Create a Retriever instance using the `FGARetriever.create` method:

```javascript
// From examples/langchain/retrievers-with-fga
import { FGARetriever } from "@auth0/ai-genkit/RAG";
import { MemoryStore, RetrievalChain } from "./helpers/memory-store";
import { readDocuments } from "./helpers/read-documents";

async function main() {
  // UserID
  const user = "user1";
  const documents = await readDocuments();
  // 1. Call helper function to load LangChain MemoryStore
  const vectorStore = await MemoryStore.fromDocuments(documents);
  // 2. Call helper function to create a LangChain retrieval chain.
  const retrievalChain = await RetrievalChain.create({
    // 3. Decorate the retriever with the FGARetriever to check permissions.
    retriever: FGARetriever.create({
      retriever: vectorStore.asRetriever(),
      buildQuery: (doc) => ({
        user: `user:${user}`,
        object: `doc:${doc.metadata.id}`,
        relation: "viewer",
      }),
    }),
  });

  // 4. Execute the query
  const { answer } = await retrievalChain.query({
    query: "Show me forecast for ZEKO?",
  });

  console.log(answer);
}

main().catch(console.error);
```

## Handling Interrupts

Auth0 AI uses interrupts thoroughly and it will never block a Graph. Whenever an authorizer requires some user interaction the graph will throw a `ToolInterruptError` with data that allows the client the resumption of the flow.

Handle the interrupts as follows:

```javascript
import { AuthorizationPendingInterrupt } from '@auth0/ai/interrupts"

const tools = [ myProtectedTool ];

const response = await ai.generate({
  tools,
  prompt: "Transfer $1000 to account ABC123",
});

const interrupt = response.interrupts[0];

if (interrupt && AuthorizationPendingInterrupt.is(interrupt.metadata)) {
  //do something
  const tool = tools.find(t => t.name === interrupt.metadata.toolCall.toolName);
  tool.restart(
    interrupt,
    //resume data if needed
  );
}
```

:::note
Since Auth0 AI has persistence on the backend you typically don't need to reattach interrupt's information when resuming.
:::

## Learn More

For more information, feedback, or to report issues, visit the [Auth0 AI for Genkit GitHub repository](https://github.com/auth0-lab/auth0-ai-js/tree/main/packages/ai-genkit).
