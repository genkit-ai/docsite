---
title: Express plugin
description: The Genkit Express plugin provides utilities for conveniently exposing Genkit flows and actions via an Express HTTP server as REST APIs.
---

The Genkit Express plugin provides utilities for conveniently exposing Genkit flows and actions via an Express HTTP server as REST APIs. This allows you to integrate your Genkit applications with existing Express-based backends or deploy them to any platform that can serve an Express.js app.

## Installation

To use this plugin, install it in your project:

```bash
npm i @genkit-ai/express
```

## Usage

You can expose your Genkit flows and actions as REST API endpoints using the `expressHandler` function.

First, define your Genkit flow:

```typescript
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { expressHandler } from '@genkit-ai/express';
import express from 'express';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-1.5-flash'),
});

const simpleFlow = ai.defineFlow(
  {
    name: 'simpleFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input, { sendChunk }) => {
    const { text } = await ai.generate({
      model: ai.model('gemini-1.5-flash'),
      prompt: input,
      onChunk: (c) => sendChunk(c.text),
    });
    return text;
  },
);

const app = express();
app.use(express.json());

app.post('/simpleFlow', expressHandler(simpleFlow));

app.listen(8080, () => {
  console.log('Express server listening on port 8080');
});
```

### Accessing flows from the client

Flows and actions exposed using the `expressHandler` function can be accessed using the `genkit/beta/client` library:

```typescript
import { runFlow, streamFlow } from 'genkit/beta/client';

// Example: Running a flow
const result = await runFlow({
  url: `http://localhost:8080/simpleFlow`,
  input: 'say hello',
});
console.log(result); // hello

// Example: Streaming a flow
const streamResult = streamFlow({
  url: `http://localhost:8080/simpleFlow`,
  input: 'say hello',
});
for await (const chunk of streamResult.stream) {
  console.log(chunk);
}
console.log(await streamResult.output);
```

## Authentication

You can handle authentication for your Express endpoints using context providers with `expressHandler`. This allows you to implement custom authorization logic based on incoming request data.

```typescript
import { UserFacingError } from 'genkit';
import { ContextProvider, RequestData } from 'genkit/context';
import { expressHandler } from '@genkit-ai/express';
import express from 'express';

// Define a custom context provider for authentication
const authContext: ContextProvider<any> = (req: RequestData) => {
  if (req.headers['authorization'] !== 'open sesame') {
    throw new UserFacingError('PERMISSION_DENIED', 'not authorized');
  }
  return {
    auth: {
      user: 'Ali Baba',
    },
  };
};

// Example middleware for authentication (optional, can be integrated directly into context provider)
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.headers['authorization'] !== 'open sesame') {
    return res.status(403).send('Unauthorized');
  }
  next();
};

const app = express();
app.use(express.json());

// Expose the flow with authentication middleware and context provider
app.post(
  '/simpleFlow',
  authMiddleware, // Optional: Express middleware for early auth checks
  expressHandler(simpleFlow, { context: authContext })
);

app.listen(8080, () => {
  console.log('Express server with auth listening on port 8080');
});
```

When using authentication policies, you can pass headers with the client library:

```typescript
import { runFlow } from 'genkit/beta/client';

// set auth headers (when using auth policies)
const result = await runFlow({
  url: `http://localhost:8080/simpleFlow`,
  headers: {
    Authorization: 'open sesame',
  },
  input: 'say hello',
});

console.log(result); // hello
```

### Using `withContextProvider`

For more advanced authentication scenarios, you can use `withContextProvider` to wrap your flows with a `ContextProvider`. This allows you to inject custom context, such as authentication details, into your flows.

Here's an example of a custom context provider that checks for a specific header:

```typescript
import { ContextProvider, RequestData, UserFacingError } from 'genkit/context';
import { startFlowServer, withContextProvider } from '@genkit-ai/express';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-1.5-flash'),
});

// Define a custom context type
interface CustomAuthContext {
  auth?: {
    user: string;
    role: string;
  };
}

// Define a custom context provider
const customContextProvider: ContextProvider<CustomAuthContext> = async (req: RequestData) => {
  const customHeader = req.headers['x-custom-auth'];
  if (customHeader === 'my-secret-token') {
    return {
      auth: {
        user: 'authorized-user',
        role: 'admin',
      },
    };
  }
  throw new UserFacingError('UNAUTHENTICATED', 'Invalid or missing custom authentication header.');
};

export const protectedFlow = ai.defineFlow(
  {
    name: 'protectedFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input, { context }) => {
    // Access context.auth populated by the CustomContextProvider
    if (!context.auth || context.auth.role !== 'admin') {
      throw new Error('Unauthorized access: Admin role required.');
    }
    return `Hello, ${context.auth.user}! Your role is ${context.auth.role}. You said: ${input}`;
  }
);

// Secure the flow with the custom context provider
startFlowServer({
  flows: [withContextProvider(protectedFlow, customContextProvider)],
});
```

To call this secured flow from the client, include the custom header:

```typescript
import { runFlow } from 'genkit/beta/client';

const result = await runFlow({
  url: `http://localhost:8080/protectedFlow`,
  headers: {
    'X-Custom-Auth': 'my-secret-token', // Replace with your actual custom token
  },
  input: 'sensitive data',
});

console.log(result);
```

#### `apiKey` Context Provider

The `apiKey` context provider is a built-in `ContextProvider` that allows you to perform API key-based access checks. It can be used with `withContextProvider` to secure your flows.

To use it, you provide the expected API key. The `apiKey` provider will then check the `Authorization` header of incoming requests against the provided key. If it matches, it populates `context.auth` with `{ apiKey: 'api-key' }`.

:::caution
**Warning:** This type of API key authentication should only be used with trusted clients (e.g., server-to-server communication or internal applications). Since the API key is sent directly in the `Authorization` header, it can be easily intercepted if used in untrusted environments like client-side web applications. For public-facing applications, consider more robust authentication mechanisms like OAuth 2.0 or Firebase Authentication.
:::

```typescript
import { apiKey } from 'genkit/context';
import { startFlowServer, withContextProvider } from '@genkit-ai/express';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-1.5-flash'),
});

export const securedFlow = ai.defineFlow(
  {
    name: 'securedFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input, { context }) => {
    return 'this is protected by API Key check';
  }
);

// Secure the flow with an API key from environment variables
startFlowServer({
  flows: [withContextProvider(securedFlow, apiKey(process.env.MY_API_KEY))],
});
```

To call this secured flow from the client, include the API key in the `Authorization` header:

```typescript
import { runFlow } from 'genkit/beta/client';

const result = await runFlow({
  url: `http://localhost:8080/securedFlow`,
  headers: {
    Authorization: `${process.env.MY_API_KEY}`, // Replace with your actual API key
  },
  input: 'sensitive data',
});

console.log(result);
```

## Using `startFlowServer`

You can also use `startFlowServer` to quickly expose multiple flows and actions:

```typescript
import { startFlowServer } from '@genkit-ai/express';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-1.5-flash'),
});

export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (restaurantTheme) => {
    // ... your flow logic here
    return `Suggested menu for ${restaurantTheme}`;
  }
);

startFlowServer({
  flows: [menuSuggestionFlow],
});
```

You can also configure the server with options like `port` and `cors`:

```typescript
startFlowServer({
  flows: [menuSuggestionFlow],
  port: 4567,
  cors: {
    origin: '*',
  },
});
```

`startFlowServer` options:

```ts
export interface FlowServerOptions {
  /** List of flows to expose via the flow server. */
  flows: (Flow<any, any, any> | FlowWithContextProvider<any, any, any>)[];
  /** Port to run the server on. Defaults to env.PORT or 3400. */
  port?: number;
  /** CORS options for the server. */
  cors?: CorsOptions;
  /** HTTP method path prefix for the exposed flows. */
  pathPrefix?: string;
  /** JSON body parser options. */
  jsonParserOptions?: bodyParser.OptionsJson;
}
```
