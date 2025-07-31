---
title: OpenAI-Compatible Plugin
description: Learn how to configure and use Genkit OpenAI-comptiable plugin to access models through any OpenAI-compatible API.
---

The `@genkit-ai/compat-oai` package provides plugins for services that are compatible with the OpenAI API specification. This includes official OpenAI services as well as other model providers and local servers that expose an OpenAI-compatible endpoint.

This package contains four main exports:

- `openAICompatible`: A general-purpose plugin for any OpenAI-compatible service.
- [`openAI`](/docs/plugins/openai): A pre-configured plugin for OpenAI's own services (GPT models, DALL-E, etc.).
- [`xai`](/docs/plugins/xai): A pre-configured plugin for xAI (Grok) models.
- [`deepSeek`](/docs/plugins/deepseek): A pre-configured plugin for DeepSeek models.

## Installation

```bash
npm install @genkit-ai/compat-oai
```

## General-Purpose OpenAI-Compatible Plugin

You can use the `openAICompatible` plugin factory to connect to any service that exposes an OpenAI-compatible API. This is useful for custom or self-hosted models, such as those served via [Ollama](https://ollama.com/).

To use this plugin, import `openAICompatible` and specify it in your Genkit configuration. You must provide a unique `name` for each instance, and client options like `baseURL` and `apiKey`.

### Configuration

The `openAICompatible` plugin takes an options object with the following parameters:

-   `name`: (Required) A unique name for the plugin instance (e.g., `'ollama'`, `'my-custom-llm'`).
-   `apiKey`: The API key for the service. For local services, this can often be a placeholder string like `'ollama'`.
-   `baseURL`: The base URL of the OpenAI-compatible API endpoint (e.g., `'http://localhost:11434/v1'` for Ollama).
-   Other options from the OpenAI Node.js SDK's `ClientOptions` can also be included, such as `timeout` or `defaultHeaders`.

Here's an example of how to configure the plugin for a local Ollama instance:

```ts
import { genkit } from 'genkit';
import { openAICompatible } from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'localLlama',
      apiKey: 'ollama', // Required, but can be a placeholder for local servers
      baseURL: 'http://localhost:11434/v1', // Example for Ollama
    }),
  ],
});
```

### Usage

Once configured, you need to define a `modelRef` to interact with your custom model. A `modelRef` is a reference that tells Genkit how to use a specific model, including its name and any supported features.

The model name in the `modelRef` should be prefixed with the `name` you gave the plugin instance, followed by a `/` and the model ID from the service.

```ts
import { genkit, modelRef, z } from 'genkit';
import { openAICompatible } from '@genkit-ai/compat-oai';

// In your Genkit config...
const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'localLlama',
      apiKey: 'ollama',
      baseURL: 'http://localhost:11434/v1',
    }),
  ],
});

// Define a reference to your model
export const myLocalModel = modelRef({
  name: 'localLlama/llama3',
  // You can specify model-specific configuration here if needed.
  // For many custom models, Genkit's default capabilities are sufficient.
});

// Use the model in a flow
export const localLlamaFlow = ai.defineFlow(
  {
    name: 'localLlamaFlow',
    inputSchema: z.object({ subject: z.string() }),
    outputSchema: z.object({ joke: z.string() }),
  },
  async ({ subject }) => {
    const llmResponse = await ai.generate({
      model: myLocalModel,
      prompt: `Tell me a joke about ${subject}.`,
    });
    return { joke: llmResponse.text };
  }
);
```

In this example, `'localLlama/llama3'` tells Genkit to use the `llama3` model provided by the `localLlama` plugin instance.

### Passing Model Configuration

You can pass configuration options to the model in the `generate` call. The available options depend on the specific model you are using. 
Common options include `temperature`, `maxOutputTokens`, etc. These are passed through to the underlying service.

```ts
const llmResponse = await ai.generate({
  model: myLocalModel,
  prompt: 'Tell me a joke about a llama.',
  config: {
    temperature: 0.9,
  },
});
```
