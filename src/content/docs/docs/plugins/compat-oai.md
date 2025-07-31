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

- `name`: (Required) A unique name for the plugin instance (e.g., `'ollama'`, `'my-custom-llm'`).
- `apiKey`: The API key for the service. For local services, this can often be a placeholder string like `'ollama'`.
- `baseURL`: The base URL of the OpenAI-compatible API endpoint (e.g., `'http://localhost:11434/v1'` for Ollama).
- `initializer`: An optional async function that is executed when the plugin is initialized. This can be used to define models and other resources.
- `resolver`: An optional async function that is executed when Genkit looks up an action that is not initialized. This is useful for defining actions dynamically, just-in-time. Use a resolver if you do not want to register all possible action upon initialization.
- Other options from the OpenAI Node.js SDK's `ClientOptions` can also be included, such as `timeout` or `defaultHeaders`.

#### Using the `initializer`

Here's an example of how to configure the plugin for a local Ollama instance. This example defines a `modelRef` for `llama3` and registers it using the `initializer` function.

```ts
import { genkit } from 'genkit';
import {
  openAICompatible,
  compatOaiModelRef,
  defineCompatOpenAIModel,
  defineCompatOpenAIImageModel,
  defineCompatOpenAISpeechModel,
  defineCompatOpenAITranscriptionModel,
  defineCompatOpenAIEmbedder,
} from '@genkit-ai/compat-oai';

// Define a reference to your model.
export const llama3Ref = compatOaiModelRef({
  name: 'ollama-oai/llama3', // Should match `<pluginName>/<model-identifier>`
});

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'ollama-oai',
      apiKey: 'ollama', // Required, but can be a placeholder for local servers
      baseURL: 'http://localhost:11434/v1', // Example for Ollama
      // Initializer to register the models with the framework
      initializer: async (ai, client) => {
        // Register a text model
        defineCompatOpenAIModel({
          ai,
          name: llama3Ref.name,
          client,
          modelRef: llama3Ref,
        });

        // You can also define other types of models and embedders
        // For Image models
        defineCompatOpenAIImageModel({ ai, client, ... });
        // For Speech models
        defineCompatOpenAISpeechModel({ ai, client, ... });
        defineCompatOpenAITranscriptionModel({ ai, client, ... });
        // For embedders
        defineCompatOpenAIEmbedder({ ai, client, ... });
      },
    }),
  ],
});
```

#### Using the `resolver`

Here's an example of how to configure the plugin using the `resolver` function.

```ts
import { genkit } from 'genkit';
import {
  openAICompatible,
  defineCompatOpenAIModel,
  defineCompatOpenAIImageModel,
  compatOaiImageModelRef,
} from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'ollama-oai',
      apiKey: 'ollama', // Required, but can be a placeholder for local servers
      baseURL: 'http://localhost:11434/v1', // Example for Ollama
      resolver: async (ai, client, actionType, actionName) => {
        // Handling model actions
        if (actionType === 'model') {
          // Handling special types of models, (eg. image models)
          if (actionName.includes('custom-gen-image')) {
            defineCompatOpenAIImageModel({
              ai,
              name: `ollama-oai/${actionName}`,
              client,
              modelRef: compatOaiImageModelRef({
                name: `ollama-oai/${actionName}`,
              }),
            });
          } else {
            defineCompatOpenAIModel({ ... });
          }
        }
        // Handling embedder actions
        if (actionType === 'embedder') {
          // define embedder and so on
        }
      },
    }),
  ],
});
```

The `resolver` function is a powerful feature for dynamically defining actions just-in-time. Instead of pre-registering every possible model or tool at initialization, the `resolver` is invoked only when an action is looked up but not found. This is especially useful in scenarios where the available tools or models are not known in advance, or when you want to avoid the overhead of initializing a large number of actions at startup. For instance, you could use a resolver to dynamically query a model registry and define the corresponding Genkit action on the fly.

You can also define both an `initializer` and a `resolver` in your plugin configuration. The `initializer` will run once at startup to register your core actions, while the `resolver` will handle any dynamic, on-demand action lookups.

### Usage

Once the plugin is configured and the models are defined, you can use them in your flows.

```ts
// Use the model in a flow
export const localLlamaFlow = ai.defineFlow(
  {
    name: 'localLlamaFlow',
    inputSchema: z.object({ subject: z.string() }),
    outputSchema: z.object({ joke: z.string() }),
  },
  async ({ subject }) => {
    const llmResponse = await ai.generate({
      model: llama3Ref, // or, 'ollama-oai/llama3'
      prompt: `Tell me a joke about ${subject}.`,
    });
    return { joke: llmResponse.text };
  }
);
```

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
