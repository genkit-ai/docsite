---
title: OpenAI-Compatible Plugins
---

The `@genkit-ai/compat-oai` package provides plugins for services that are compatible with the OpenAI API specification. This includes official OpenAI services as well as other model providers and local servers that expose an OpenAI-compatible endpoint.

This package contains four main exports:

- `openAICompatible`: A general-purpose plugin for any OpenAI-compatible service.
- `openAI`: A pre-configured plugin for OpenAI's own services (GPT models, DALL-E, etc.).
- `deepSeek`: A pre-configured plugin for DeepSeek models.
- `xai`: A pre-configured plugin for xAI (Grok) models.

## Installation

```bash
npm install @genkit-ai/compat-oai
```

## General-Purpose OpenAI-Compatible Plugin

You can use the `openAICompatible` plugin factory to connect to any service that exposes an OpenAI-compatible API. This is useful for custom or self-hosted models, such as those served via [Ollama](https://ollama.com/).

To use this plugin, import `openAICompatible` and specify it in your Genkit configuration. You must provide a unique `name` for each instance, and client options like `baseURL` and `apiKey`.

```ts
import { genkit } from 'genkit';
import { openAICompatible } from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'localLlama',
      apiKey: 'ollama', // Or specific key if required by local server
      baseURL: 'http://localhost:11434/v1', // Example for Ollama
    }),
  ],
});
```

### Usage

Once configured, you can define references to your custom models and use them in Genkit.

```ts
import { genkit, modelRef } from 'genkit';
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
  // You can specify model-specific configuration here
});

// Use the model in a flow
const llmResponse = await ai.generate({
  model: myLocalModel,
  prompt: 'Tell me a joke about a llama.',
});
```

## OpenAI Plugin

This package includes a pre-configured plugin for official OpenAI models.

### Configuration

To use this plugin, import `openAI` and specify it when you initialize Genkit:

```ts
import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

export const ai = genkit({
  plugins: [openAI()],
});
```

The plugin requires an API key for the OpenAI API. You can get one from the [OpenAI Platform](https://platform.openai.com/api-keys).

Configure the plugin to use your API key by doing one of the following:

- Set the `OPENAI_API_KEY` environment variable to your API key.
- Specify the API key when you initialize the plugin:

  ```ts
  openAI({ apiKey: yourKey });
  ```

  However, don't embed your API key directly in code! Use this feature only in
  conjunction with a service like Google Cloud Secret Manager or similar.

### Usage

The plugin provides helpers to reference supported models and embedders.

#### Chat Models

```ts
import { genkit, z } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

const ai = genkit({
  plugins: [openAI()],
});

export const jokeFlow = ai.defineFlow(
  {
    name: 'jokeFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const llmResponse = await ai.generate({
      prompt: `tell me a joke about ${subject}`,
      model: openAI.model('gpt-4.1'),
    });
    return llmResponse.text;
  },
);
```

#### Image Generation Models

```ts
import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

const ai = genkit({
  plugins: [openAI()],
});

// Reference an image generation model
const dalle3 = openAI.model('dall-e-3');

// Use it to generate an image
const imageResponse = await ai.generate({
  model: dalle3,
  prompt: 'A photorealistic image of a cat programming a computer.',
  config: {
    size: '1024x1024',
  },
});
```

#### Text Embedding Models

```ts
import { genkit, z } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

const ai = genkit({
  plugins: [openAI()],
});

export const embedFlow = ai.defineFlow(
  {
    name: 'embedFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (text) => {
    const embedding = await ai.embed({
      embedder: openAI.embedder('text-embedding-ada-002'),
      content: text,
    });

    return JSON.stringify(embedding);
  },
);
```

#### Web Search

Some OpenAI models support web search. You can enable it in the `config` block:

```ts
import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

const ai = genkit({
  plugins: [openAI()],
});

const llmResponse = await ai.generate({
  prompt: `What was a positive news story from today?`,
  model: openAI.model('gpt-4o-search-preview'),
  config: {
    web_search_options: {},
  },
});
```

#### Audio Transcription and Speech Models

The OpenAI plugin also supports audio models for transcription (speech-to-text) and speech generation (text-to-speech).

```ts
import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';
import * as fs from 'fs';

const ai = genkit({
  plugins: [openAI()],
});

// Transcription (Speech-to-Text)
const whisper = openAI.model('whisper-1');
const audioFile = fs.readFileSync('path/to/your/audio.mp3');
const transcription = await ai.generate({
  model: whisper,
  prompt: [{ media: { contentType: 'audio/mp3', url: `data:audio/mp3;base64,${audioFile.toString('base64')}` } }],
});
console.log(transcription.text());

// Speech Generation (Text-to-Speech)
const tts = openAI.model('tts-1');
const speechResponse = await ai.generate({
  model: tts,
  prompt: 'Hello, world! This is a test of text-to-speech.',
  config: {
    voice: 'alloy',
  },
});

const audioData = speechResponse.media();
fs.writeFileSync('output.mp3', Buffer.from(audioData.url.split(',')[1], 'base64'));
```

## DeepSeek Plugin

The package also includes a pre-configured plugin for [DeepSeek](https://www.deepseek.com/) models.

### Configuration

To use this plugin, import `deepSeek` and specify it when you initialize Genkit:

```ts
import { genkit } from 'genkit';
import { deepSeek } from '@genkit-ai/compat-oai/deepseek';

export const ai = genkit({
  plugins: [deepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })],
});
```

The plugin requires an API key from DeepSeek, which you can get from the [DeepSeek website](https://platform.deepseek.com/api_keys).

The recommended way to provide the key is through an environment variable (e.g., `DEEPSEEK_API_KEY`) and pass it to the plugin during initialization, as shown in the example.

As always, avoid embedding keys directly in code. Use a secret manager or environment variables.

:::note
The DeepSeek plugin is built using the `openAICompatible` plugin and consequently defaults to using the `OPENAI_API_KEY` environment variable. If you are using a dedicated DeepSeek API key, you must provide it during initialization to override this default.
:::

### Usage

Use the `deepSeek.model` helper to reference a DeepSeek model.

```ts
import { genkit } from 'genkit';
import { deepSeek } from '@genkit-ai/compat-oai/deepseek';

const ai = genkit({
  plugins: [deepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })],
});

// Reference a model
const deepseekChat = deepSeek.model('deepseek-chat');

// Use it in a generate call
const llmResponse = await ai.generate({
  model: deepseekChat,
  prompt: 'Tell me something about deep learning.',
});
```

## xAI (Grok) Plugin

The package also includes a pre-configured plugin for [xAI (Grok)](https://x.ai/) models.

### Configuration

To use this plugin, import `xAI` and specify it when you initialize Genkit:

```ts
import { genkit } from 'genkit';
import { xAI } from '@genkit-ai/compat-oai/xai';

export const ai = genkit({
  plugins: [xAI({ apiKey: process.env.XAI_API_KEY })],
});
```

The plugin requires an API key from xAI, which you can get from your [xAI account settings](https://x.ai/account/api-keys).

The recommended way to provide the key is through an environment variable (e.g., `XAI_API_KEY`) and pass it to the plugin during initialization, as shown in the example.

As always, avoid embedding keys directly in code. Use a secret manager or environment variables.

:::note
The xAI plugin is built using the `openAICompatible` plugin and consequently defaults to using the `OPENAI_API_KEY` environment variable. If you are using a dedicated xAI API key, you must provide it during initialization to override this default.
:::

### Usage

Use the `xAI.model` helper to reference a Grok model. This example shows how to stream the model's response.

```ts
import { genkit, z } from 'genkit';
import { xAI } from '@genkit-ai/compat-oai/xai';

const ai = genkit({
  plugins: [xAI({ apiKey: process.env.XAI_API_KEY })],
});

export const modelWrapFlow = ai.defineFlow(
  {
    name: 'modelWrapFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
    streamSchema: z.string(),
  },
  async (subject, { sendChunk }) => {
    const { stream, response } = ai.generateStream({
      model: xAI.model('grok-3'),
      prompt: `tell me a fun fact about ${subject}`,
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    const { text } = await response;

    return text;
  },
);
```
