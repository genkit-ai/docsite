---
title: OpenAI Plugin
description: Learn how to configure and use Genkit OpenAI plugin to access various models and embedders from OpenAI.
---

The `@genkit-ai/compat-oai` package includes a pre-configured plugin for official [OpenAI models](https://platform.openai.com/docs/models).

:::note
The OpenAI plugin is built on top of the `openAICompatible` plugin. It is pre-configured for OpenAI's API endpoints.
:::

## Installation

```bash
npm install @genkit-ai/compat-oai
```

## Configuration

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

## Usage

The plugin provides helpers to reference supported models and embedders.

### Chat Models

You can reference chat models like `gpt-4o` and `gpt-4-turbo` using the `openAI.model()` helper.

```ts
import { genkit, z } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

const ai = genkit({
  plugins: [openAI()],
});

export const jokeFlow = ai.defineFlow(
  {
    name: 'jokeFlow',
    inputSchema: z.object({ subject: z.string() }),
    outputSchema: z.object({ joke: z.string() }),
  },
  async ({ subject }) => {
    const llmResponse = await ai.generate({
      prompt: `tell me a joke about ${subject}`,
      model: openAI.model('gpt-4o'),
    });
    return { joke: llmResponse.text };
  },
);
```

You can also pass model-specific configuration:

```ts
const llmResponse = await ai.generate({
  prompt: `tell me a joke about ${subject}`,
  model: openAI.model('gpt-4o'),
  config: {
    temperature: 0.7,
  },
});
```

### Image Generation Models

The plugin supports image generation models like DALL-E 3.

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
    style: 'vivid',
  },
});

const imageUrl = imageResponse.media()?.url;
```

### Text Embedding Models

You can use text embedding models to create vector embeddings from text.

```ts
import { genkit, z } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

const ai = genkit({
  plugins: [openAI()],
});

export const embedFlow = ai.defineFlow(
  {
    name: 'embedFlow',
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.object({ embedding: z.string() }),
  },
  async ({ text }) => {
    const embedding = await ai.embed({
      embedder: openAI.embedder('text-embedding-ada-002'),
      content: text,
    });

    return { embedding: JSON.stringify(embedding) };
  },
);
```

### Audio Transcription and Speech Models

The OpenAI plugin also supports audio models for transcription (speech-to-text) and speech generation (text-to-speech).

#### Transcription (Speech-to-Text)

Use models like `whisper-1` to transcribe audio files.

```ts
import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';
import * as fs from 'fs';

const ai = genkit({
  plugins: [openAI()],
});

const whisper = openAI.model('whisper-1');
const audioFile = fs.readFileSync('path/to/your/audio.mp3');

const transcription = await ai.generate({
  model: whisper,
  prompt: [
    {
      media: {
        contentType: 'audio/mp3',
        url: `data:audio/mp3;base64,${audioFile.toString('base64')}`,
      },
    },
  ],
});

console.log(transcription.text());
```

#### Speech Generation (Text-to-Speech)

Use models like `tts-1` to generate speech from text.

```ts
import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';
import * as fs from 'fs';

const ai = genkit({
  plugins: [openAI()],
});

const tts = openAI.model('tts-1');
const speechResponse = await ai.generate({
  model: tts,
  prompt: 'Hello, world! This is a test of text-to-speech.',
  config: {
    voice: 'alloy',
  },
});

const audioData = speechResponse.media();
if (audioData) {
  fs.writeFileSync('output.mp3', Buffer.from(audioData.url.split(',')[1], 'base64'));
}
```

## Advanced usage

### Passthrough configuration

You can pass configuration options that are not defined in the plugin's custom configuration schema. This
permits you to access new models and features without having to update your Genkit version.

```ts
import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

const ai = genkit({
  plugins: [openAI()],
});

const llmResponse = await ai.generate({
  prompt: `Tell me a cool story`,
  model: openAI.model('gpt-4-new'), // hypothetical new model
  config: {
    seed: 123,
    new_feature_parameter: ... // hypothetical config needed for new model
  },
});
```

Genkit passes this config as-is to the OpenAI API giving you access to the new model features.
Note that the field name and types are not validated by Genkit and should match the OpenAI API
specification to work.

### Web-search built-in tool

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
