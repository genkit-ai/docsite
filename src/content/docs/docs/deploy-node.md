---
title: Deploy flows to any Node.js platform
---

<!--
TODO: Add Next docs too. Maybe we need a web-hosting page that deploy-node
and cloud-run links to, which links to express, next, and maybe cloud functions
-->

Genkit has built-in integrations that help you deploy your flows to
Cloud Functions for Firebase and Google Cloud Run, but you can also deploy your
flows to any platform that can serve an Express.js app, whether it’s a cloud
service or self-hosted.

This page, as an example, walks you through the process of deploying the default
sample flow.

## Before you begin

- Node.js 20+: Confirm that your environment is using Node.js version 20 or
  higher (`node --version`).
- You should be familiar with Genkit's concept of [flows](/docs/flows).

## 1. Set up your project

1. **Create a directory for the project:**

```bash
export GENKIT_PROJECT_HOME=~/tmp/genkit-express-project

mkdir -p $GENKIT_PROJECT_HOME

cd $GENKIT_PROJECT_HOME
```

1. **Initialize a Node.js project:**

```bash
npm init -y
```

1. **Install Genkit and necessary dependencies:**

```bash
npm install --save genkit @genkit-ai/googleai

npm install -D genkit-cli typescript tsx
```

## 2. Configure your Genkit app

1. **Set up a sample flow and server:**

In `src/index.ts`, define a sample flow and configure the flow server:

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { startFlowServer } from '@genkit-ai/express';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'),
});

const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = ai.generate('Say hello to ${input.name}');
    return text;
  },
);

startFlowServer({
  flows: [menuSuggestionFlow],
});
```

There are also some optional parameters for `startFlowServer` you can specify:

- `port`: the network port to listen on. If unspecified, the server listens on
  the port defined in the PORT environment variable, and if PORT is not set,
  defaults to 3400.
- `cors`: the flow server's
  [CORS policy](https://www.npmjs.com/package/cors#configuration-options).
  If you will be accessing these endpoints from a web application, you likely
  need to specify this.
- `pathPrefix`: an optional path prefix to add before your flow endpoints.
- `jsonParserOptions`: options to pass to Express's
  [JSON body parser](https://www.npmjs.com/package/body-parser#bodyparserjsonoptions)

1. **Set up model provider credentials:**

Configure the required environment variables for your model provider. This guide
uses the Gemini API from Google AI Studio as an example.

[Get an API key from Google AI Studio](https://makersuite.google.com/app/apikey)

After you’ve created an API key, set the `GEMINI_API_KEY` environment
variable to your key with the following command:

```bash
export GEMINI_API_KEY=<your API key>
```

Different providers for deployment will have different ways of securing your
API key in their environment. For security, ensure that your API key is not
publicly exposed.

## 3. Prepare your Node.js project for deployment

### Add start and build scripts to `package.json`

To deploy a Node.js project, define `start` and `build` scripts in
`package.json`. For a TypeScript project, these scripts will look like this:

```json
"scripts": {
  "start": "node --watch lib/index.js",
  "build": "tsc"
},
```

### Build and test locally

Run the build command, then start the server and test it locally to confirm it
works as expected.

```bash
npm run build

npm start
```

In another terminal window, test the endpoint:

```bash
curl -X POST "http://127.0.0.1:3400/menuSuggestionFlow" \
  -H "Content-Type: application/json" \
  -d '{"data": "banana"}'
```

## Optional: Start the Developer UI

You can use the Developer UI to test flows interactively during development:

```bash
npx genkit start -- npm run start
```

Navigate to `http://localhost:4000/flows` to
test your flows in the UI.

## 4. Deploy the project

Once your project is configured and tested locally, you can deploy to
any Node.js-compatible platform. Deployment steps vary by provider, but
generally, you configure the following settings:

| Setting                   | Value                                                            |
| ------------------------- | ---------------------------------------------------------------- |
| **Runtime**               | Node.js 20 or newer                                              |
| **Build command**         | `npm run build`                                                  |
| **Start command**         | `npm start`                                                      |
| **Environment variables** | Set `GEMINI_API_KEY=<your-api-key>` and other necessary secrets. |

The `start` command (`npm start`) should point to your compiled entry point,
typically `lib/index.js`. Be sure to add all necessary environment variables
for your deployment platform.

After deploying, you can use the provided service URL to invoke your flow as
an HTTPS endpoint.
