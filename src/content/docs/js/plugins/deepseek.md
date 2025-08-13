---
title: DeepSeek Plugin
description: Learn how to configure and use Genkit DeepSeek plugin to access DeepSeek models.
---

The `@genkit-ai/compat-oai` package includes a pre-configured plugin for [DeepSeek](https://www.deepseek.com/) models.

:::note
The DeepSeek plugin is built on top of the `openAICompatible` plugin. It is pre-configured for DeepSeek's API endpoints, so you don't need to provide a `baseURL`.
:::

## Installation

```bash
npm install @genkit-ai/compat-oai
```

## Configuration

To use this plugin, import `deepSeek` and specify it when you initialize Genkit.

```ts
import { genkit } from 'genkit';
import { deepSeek } from '@genkit-ai/compat-oai/deepseek';

export const ai = genkit({
  plugins: [deepSeek()],
});
```

You must provide an API key from DeepSeek. You can get an API key from your [DeepSeek account settings](https://platform.deepseek.com/).

Configure the plugin to use your API key by doing one of the following:

- Set the `DEEPSEEK_API_KEY` environment variable to your API key.
- Specify the API key when you initialize the plugin:

  ```ts
  deepSeek({ apiKey: yourKey });
  ```

As always, avoid embedding API keys directly in your code.

## Usage

Use the `deepSeek.model()` helper to reference a DeepSeek model.

```ts
import { genkit, z } from 'genkit';
import { deepSeek } from '@genkit-ai/compat-oai/deepseek';

const ai = genkit({
  plugins: [deepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })],
});

export const deepseekFlow = ai.defineFlow(
  {
    name: 'deepseekFlow',
    inputSchema: z.object({ subject: z.string() }),
    outputSchema: z.object({ information: z.string() }),
  },
  async ({ subject }) => {
    // Reference a model
    const deepseekChat = deepSeek.model('deepseek-chat');

    // Use it in a generate call
    const llmResponse = await ai.generate({
      model: deepseekChat,
      prompt: `Tell me something about ${subject}.`,
    });

    return { information: llmResponse.text };
  },
);
```

You can also pass model-specific configuration:

```ts
const llmResponse = await ai.generate({
  model: deepSeek.model('deepseek-chat'),
  prompt: 'Tell me something about deep learning.',
  config: {
    temperature: 0.8,
    maxTokens: 1024,
  },
});
```

## Advanced usage

### Passthrough configuration

You can pass configuration options that are not defined in the plugin's custom config schema. This
permits you to access new models and features without having to update your Genkit version.

```ts
import { genkit } from 'genkit';
import { deepSeek } from '@genkit-ai/compat-oai/deepSeek';

const ai = genkit({
  plugins: [deepSeek()],
});

const llmResponse = await ai.generate({
  prompt: `Tell me a cool story`,
  model: deepSeek.model('deepseek-new'), // hypothetical new model
  config: {
    new_feature_parameter: ... // hypothetical config needed for new model
  },
});
```

Genkit passes this configuration as-is to the DeepSeek API giving you access to the new model features.
Note that the field name and types are not validated by Genkit and should match the DeepSeek API
specification to work.
