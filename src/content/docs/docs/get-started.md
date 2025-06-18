---
title: Get started with Genkit JS
---

This guide shows you how to get started with Genkit in a Node.js app.

## Prerequisites

This guide assumes that you're familiar with building applications with Node.js.

To complete this quickstart, make sure that your development environment meets
the following requirements:

- Node.js v20+
- npm

## Install Genkit dependencies

Install the following Genkit dependencies to use Genkit in your project:

- `genkit` provides Genkit core capabilities.
- `@genkit-ai/googleai` provides access to the Google AI Gemini models.

```bash
npm install genkit @genkit-ai/googleai
```

## Configure your model API key

For this guide, we’ll show you how to use the Gemini API which provides a
generous free tier and does not require a credit card to get started. To use the
Gemini API, you'll need an API key. If you don't already have one, create a key
in Google AI Studio.

[Get an API key from Google AI Studio](https://makersuite.google.com/app/apikey).

After you’ve created an API key, set the `GEMINI_API_KEY` environment variable to your key:

```sh
export GEMINI_API_KEY=<your API key>
```

:::note
While this tutorial uses the Gemini API from AI Studio, Genkit supports a wide variety of model providers including Gemini from Vertex AI, Anthropic’s Claude 3 models and Llama 3.1 through the Vertex AI Model Garden, open source models through Ollama, and several other community-supported providers like OpenAI and Cohere. See [Models supported by Genkit](/docs/models#models-supported-by-genkit) for details.
:::

## Make your first request

Get started with Genkit in just a few lines of simple code.

```ts
// import the Genkit and Google AI plugin libraries
import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// configure a Genkit instance
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'), // set default model
});

async function main() {
  // make a generation request
  const { text } = await ai.generate('Hello, Gemini!');
  console.log(text);
}

main();
```

## Next steps

Now that you’re set up to make model requests with Genkit, learn how to use more
Genkit capabilities to build your AI-powered apps and workflows. To get started
with additional Genkit capabilities, see the following guides:

- [Developer tools](/docs/devtools): Learn how to set up and use
  Genkit’s CLI and developer UI to help you locally test and debug your app.
- [Generating content](/docs/models): Learn how to use Genkit’s unified
  generation API to generate text and structured data from any supported
  model.
- [Creating flows](/docs/flows): Learn how to use special Genkit
  functions, called flows, that provide end-to-end observability for workflows
  and rich debugging from Genkit tooling.
- [Managing prompts](/docs/dotprompt): Learn how Genkit helps you manage
  your prompts and configuration together as code.
- [Integrating in an app](https://developers.google.com/solutions/learn/agentic-barista):
  Walk through a deployed example of multiple Genkit flows powering a web app.
