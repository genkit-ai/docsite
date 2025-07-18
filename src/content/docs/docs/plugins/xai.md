---
title: xAI Plugin
description: Learn how to configure and use Genkit xAI plugin to access xAI (Grok) models.
---

The `@genkit-ai/compat-oai` package includes a pre-configured plugin for [xAI (Grok)](https://x.ai/) models.
The `xAI` plugin provides access to the `grok` family of models, including `grok-image` for image generation.

:::note
The xAI plugin is built on top of the `openAICompatible` plugin. It is pre-configured for xAI's API endpoints.
:::

## Installation

```bash
npm install @genkit-ai/compat-oai
```

## Configuration

To use this plugin, import `xAI` and specify it when you initialize Genkit:

```ts
import { genkit } from 'genkit';
import { xAI } from '@genkit-ai/compat-oai/xai';

export const ai = genkit({
  plugins: [xAI()],
});
```

You must provide an API key from xAI. You can get an API key from your [xAI account settings](https://console.x.ai/).

Configure the plugin to use your API key by doing one of the following:

- Set the `XAI_API_KEY` environment variable to your API key.
- Specify the API key when you initialize the plugin:

  ```ts
  xAI({ apiKey: yourKey });
  ```

As always, avoid embedding API keys directly in your code.

## Usage

Use the `xAI.model()` helper to reference a Grok model.

```ts
import { genkit, z } from 'genkit';
import { xAI } from '@genkit-ai/compat-oai/xai';

const ai = genkit({
  plugins: [xAI({ apiKey: process.env.XAI_API_KEY })],
});

export const grokFlow = ai.defineFlow(
  {
    name: 'grokFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const llmResponse = await ai.generate({
      model: xAI.model('grok-3-mini'),
      prompt: `tell me a fun fact about ${subject}`,
    });
    return llmResponse.text();
  },
);
```

## Advanced usage

### Passthrough configuration

You can pass configuration options that are not defined in the plugin's custom configuration schema. This
permits you to access new models and features without having to update your Genkit version.

```ts
import { genkit } from 'genkit';
import { xAI } from '@genkit-ai/compat-oai/xAI';

const ai = genkit({
  plugins: [xAI()],
});

const llmResponse = await ai.generate({
  prompt: `Tell me a cool story`,
  model: xAI.model('grok-new'), // hypothetical new model
  config: {
    new_feature_parameter: ... // hypothetical config needed for new model
  },
});
```

Genkit passes this configuration as-is to the xAI API giving you access to the new model features.
Note that the field name and types are not validated by Genkit and should match the xAI API
specification to work.
