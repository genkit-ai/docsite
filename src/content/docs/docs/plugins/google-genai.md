---
title: Google Generative AI plugin
---

The Google Generative AI plugin provides interfaces to Google's Gemini models
through the [Gemini API](https://ai.google.dev/docs/gemini_api_overview).

## Installation

```bash
npm install @genkit-ai/googleai
```

## Configuration

To use this plugin, specify it when you initialize Genkit:

```ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
});
```

The plugin requires an API key for the Gemini API, which you can get from
[Google AI Studio](https://aistudio.google.com/app/apikey).

Configure the plugin to use your API key by doing one of the following:

- Set the `GEMINI_API_KEY` environment variable to your API key.
- Specify the API key when you initialize the plugin:

  ```ts
  googleAI({ apiKey: yourKey });
  ```

  However, don't embed your API key directly in code! Use this feature only in
  conjunction with a service like Cloud Secret Manager or similar.

## Usage

The recommended way to reference models is through the helper function provided by the plugin:

```ts
import { googleAI } from '@genkit-ai/googleai';

// Referencing models
const model = googleAI.model('gemini-2.5-flash');
const modelPro = googleAI.model('gemini-2.5-flash-lite');

// Referencing embedders
const embedder = googleAI.embedder('text-embedding-004');
```

You can use these references to specify which model `generate()` uses:

```ts
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'), // Set default model
});

const llmResponse = await ai.generate('Tell me a joke.');
```

or use embedders (ex. `text-embedding-004`) with `embed` or retrievers:

```ts
const ai = genkit({
  plugins: [googleAI()],
});

const embeddings = await ai.embed({
  embedder: googleAI.embedder('text-embedding-004'),
  content: input,
});
```

## Gemini Files API

You can use files uploaded to the Gemini Files API with Genkit:

```ts
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
});

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const uploadResult = await fileManager.uploadFile('path/to/file.jpg', {
  mimeType: 'image/jpeg',
  displayName: 'Your Image',
});

const response = await ai.generate({
  model: googleAI.model('gemini-2.5-flash'),
  prompt: [
    { text: 'Describe this image:' },
    {
      media: {
        contentType: uploadResult.file.mimeType,
        url: uploadResult.file.uri,
      },
    },
  ],
});
```

## Fine-tuned models

You can use models fine-tuned with the Google Gemini API. Follow the
instructions from the
[Gemini API](https://ai.google.dev/gemini-api/docs/model-tuning/tutorial?lang=python)
or fine-tune a model using
[AI Studio](https://aistudio.corp.google.com/app/tune).

The tuning process uses a base model—for example, Gemini 2.0 Flash—and your
provided examples to create a new tuned model. Remember the base model you
used, and copy the new model's ID.

When calling the tuned model in Genkit, use the base model as the `model`
parameter, and pass the tuned model's ID as part of the `config` block. For
example, if you used Gemini 2.0 Flash as the base model, and got the model ID
`tunedModels/my-example-model-apbm8oqbvuv2` you can call it with:

```ts
const ai = genkit({
  plugins: [googleAI()],
});

const llmResponse = await ai.generate({
  prompt: `Suggest an item for the menu of fish themed restruant`,
  model: googleAI.model('tunedModels/my-example-model-apbm8oqbvuv2'),
});
```

## Text-to-Speech (TTS) Models

The Google Generative AI plugin provides access to text-to-speech capabilities through the Gemini TTS models. These models can convert text into natural-sounding speech for various applications such as voice assistants, accessibility features, or interactive content.

### Basic Usage

To generate audio using the Gemini TTS model:

```ts
import { googleAI } from '@genkit-ai/googleai';
import { writeFile } from 'node:fs/promises';
import wav from 'wav'; // npm install wav && npm install -D @types/wav

const ai = genkit({
  plugins: [googleAI()],
});

const { media } = await ai.generate({
  model: googleAI.model('gemini-2.5-flash-preview-tts'),
  config: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Algenib' },
      },
    },
  },
  prompt: 'Say that Genkit is an amazing Gen AI library',
});

if (!media) {
  throw new Error('no media returned');
}
const audioBuffer = Buffer.from(
  media.url.substring(media.url.indexOf(',') + 1),
  'base64'
);
await writeFile('output.wav', await toWav(audioBuffer));

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    // This code depends on `wav` npm library.
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
```

### Multi-speaker Audio Generation

You can generate audio with multiple speakers, each with their own voice:

```ts
const response = await ai.generate({
  model: googleAI.model('gemini-2.5-flash-preview-tts'),
  config: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          {
            speaker: 'Speaker1',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
          {
            speaker: 'Speaker2',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Achernar' },
            },
          },
        ],
      },
    },
  },
  prompt: `Here's the dialog:
    Speaker1: "Genkit is an amazing Gen AI library!"
    Speaker2: "I thought it was a framework."`,
});
```

When using multi-speaker configuration, the model automatically detects speaker labels in the text (like "Speaker1:" and "Speaker2:") and applies the corresponding voice to each speaker's lines.

### Configuration Options

The Gemini TTS models support various configuration options:

#### Voice Selection

You can choose from different pre-built voices with unique characteristics:

```ts
speechConfig: {
  voiceConfig: {
    prebuiltVoiceConfig: {
      voiceName: 'Algenib' // Other options: 'Achernar', 'Ankaa', etc.
    },
  },
}
```

#### Speech Emphasis

You can use markdown-style formatting in your prompt to add emphasis:

- Bold text (`**like this**`) for stronger emphasis
- Italic text (`*like this*`) for moderate emphasis

Example:

```ts
prompt: 'Genkit is an **amazing** Gen AI *library*!'
```

#### Advanced Speech Parameters

For more control over the generated speech:

```ts
speechConfig: {
  voiceConfig: {
    prebuiltVoiceConfig: {
      voiceName: 'Algenib',
      speakingRate: 1.0,  // Range: 0.25 to 4.0, default is 1.0
      pitch: 0.0,         // Range: -20.0 to 20.0, default is 0.0
      volumeGainDb: 0.0,  // Range: -96.0 to 16.0, default is 0.0
    },
  },
}
```

- `speakingRate`: Controls the speed of speech (higher values = faster speech)
- `pitch`: Adjusts the pitch of the voice (higher values = higher pitch)
- `volumeGainDb`: Controls the volume (higher values = louder)

For more detailed information about the Gemini TTS models and their configuration options, see the [Google AI Speech Generation documentation](https://ai.google.dev/gemini-api/docs/speech-generation).

## Video Generation (Veo) Models

The Google Generative AI plugin provides access to video generation capabilities through the Veo models. These models can generate videos from text prompts or manipulate existing images to create dynamic video content.

### Basic Usage: Text-to-Video Generation

To generate a video from a text prompt using the Veo model:

```ts
import { googleAI } from '@genkit-ai/googleai';
import * as fs from 'fs';
import { Readable } from 'stream';
import { MediaPart } from 'genkit';
import { genkit } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
});

ai.defineFlow('text-to-video-veo', async () => {
  let { operation } = await ai.generate({
    model: googleAI.model('veo-2.0-generate-001'),
    prompt: 'A majestic dragon soaring over a mystical forest at dawn.',
    config: {
      durationSeconds: 5,
      aspectRatio: '16:9',
    },
  });

  if (!operation) {
    throw new Error('Expected the model to return an operation');
  }

  // Wait until the operation completes.
  while (!operation.done) {
    operation = await ai.checkOperation(operation);
    // Sleep for 5 seconds before checking again.
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  if (operation.error) {
    throw new Error('failed to generate video: ' + operation.error.message);
  }

  const video = operation.output?.message?.content.find((p) => !!p.media);
  if (!video) {
    throw new Error('Failed to find the generated video');
  }
  await downloadVideo(video, 'output.mp4');
});

async function downloadVideo(video: MediaPart, path: string) {
  const fetch = (await import('node-fetch')).default;
  // Add API key before fetching the video.
  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
  );
  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Failed to fetch video');
  }

  Readable.from(videoDownloadResponse.body).pipe(fs.createWriteStream(path));
}
```

### Video Generation from Photo Reference

To use a photo as reference for the video using the Veo model (e.g. to make a static photo move), you can provide an image as part of the prompt.

```ts
const startingImage = fs.readFileSync('photo.jpg', { encoding: 'base64' });

let { operation } = await ai.generate({
  model: googleAI.model('veo-2.0-generate-001'),
  prompt: [
    {
      text: 'make the subject in the photo move',
    },
    {
      media: {
        contentType: 'image/jpeg',
        url: `data:image/jpeg;base64,${startingImage}`,
      },
    },
  ],
  config: {
    durationSeconds: 5,
    aspectRatio: '9:16',
    personGeneration: 'allow_adult',
  },
});
```

### Configuration Options

The Veo models support various configuration options.

#### Veo Model Parameters

Full list of options can be found at https://ai.google.dev/gemini-api/docs/video#veo-model-parameters

- `negativePrompt`: Text string that describes anything you want to discourage the model from generating.
- `aspectRatio`: Changes the aspect ratio of the generated video. Supported values are "16:9" and "9:16". The default is "16:9".
- `personGeneration`: Allow the model to generate videos of people. The following values are supported:
  - **Text-to-video generation**:
    - `"dont_allow"`: Don't allow the inclusion of people or faces.
    - `"allow_adult"`: Generate videos that include adults, but not children.
    - `"allow_all"`: Generate videos that include adults and children.
  - **Image-to-video generation**:
    - `"dont_allow"`: Don't allow the inclusion of people or faces.
    - `"allow_adult"`: Generate videos that include adults, but not children. (See Limitations)
- `numberOfVideos`: Output videos requested, either 1 or 2.
- `durationSeconds`: Length of each output video in seconds, between 5 and 8.
- `enhance_prompt`: Enable or disable the prompt rewriter. Enabled by default.

## Context Caching

The Google Generative AI plugin supports **context caching**, which allows models to reuse previously cached content to optimize performance and reduce latency for repetitive tasks. This feature is especially useful for conversational flows or scenarios where the model references a large body of text consistently across multiple requests.

### How to Use Context Caching

To enable context caching, ensure your model supports it. For example, `gemini-2.5-flash` and `gemini-1.5-pro` are models that support context caching.

You can define a caching mechanism in your application like this:

```ts
const ai = genkit({
  plugins: [googleAI()],
});

const llmResponse = await ai.generate({
  messages: [
    {
      role: 'user',
      content: [{ text: 'Here is the relevant text from War and Peace.' }],
    },
    {
      role: 'model',
      content: [
        {
          text: `Based on War and Peace, here is some analysis of Pierre Bezukhov's character.`,
        },
      ],
      metadata: {
        cache: {
          ttlSeconds: 300, // Cache this message for 5 minutes
        },
      },
    },
  ],
  model: googleAI.model('gemini-2.5-flash-001'),
  prompt: `Describe Pierre's transformation throughout the novel`,
});
```

In this setup:

- **`messages`**: Allows you to pass conversation history.
- **`metadata.cache.ttlSeconds`**: Specifies the time-to-live (TTL) for caching a specific response.

### Example: Leveraging Large Texts with Context

For applications referencing long documents, such as _War and Peace_ or _Lord of the Rings_, you can structure your queries to reuse cached contexts:

```ts
const fs = require('fs/promises');

const textContent = await fs.readFile('path/to/war_and_peace.txt', 'utf-8');

const llmResponse = await ai.generate({
  messages: [
    {
      role: 'user',
      content: [{ text: textContent }], // Include the large text as context
    },
    {
      role: 'model',
      content: [
        {
          text: 'This analysis is based on the provided text from War and Peace.',
        },
      ],
      metadata: {
        cache: {
          ttlSeconds: 300, // Cache the response to avoid reloading the full text
        },
      },
    },
  ],
  model: googleAI.model('gemini-2.5-flash-001'),
  prompt: 'Analyze the relationship between Pierre and Natasha.',
});
```

### Caching other modes of content

The Gemini models are multi-modal, and other modes of content are allowed to be cached as well.

For example, to cache a long piece of video content, you must first upload using the file manager from the Google AI SDK:

```ts
import { GoogleAIFileManager } from '@google/generative-ai/server';
```

```ts
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Upload video to Google AI using the Gemini Files API
const uploadResult = await fileManager.uploadFile(videoFilePath, {
  mimeType: 'video/mp4', // Adjust according to the video format
  displayName: 'Uploaded Video for Analysis',
});

const fileUri = uploadResult.file.uri;
```

Now you may configure the cache in your calls to `ai.generate`:

```ts
const analyzeVideoResponse = await ai.generate({
  messages: [
    {
      role: 'user',
      content: [
        {
          media: {
            url: fileUri, // Use the uploaded file URL
            contentType: 'video/mp4',
          },
        },
      ],
    },
    {
      role: 'model',
      content: [
        {
          text: 'This video seems to contain several key moments. I will analyze it now and prepare to answer your questions.',
        },
      ],
      // Everything up to (including) this message will be cached.
      metadata: {
        cache: true,
      },
    },
  ],
  model: googleAI.model('gemini-2.5-flash-001'),
  prompt: query,
});
```

### Supported Models for Context Caching

Only specific models, such as `gemini-2.5-flash` and `gemini-1.5-pro`, support context caching. If an unsupported model is used, an error will be raised, indicating that caching cannot be applied.

### Further Reading

See more information regarding context caching on Google AI in their [documentation](https://ai.google.dev/gemini-api/docs/caching?lang=node).

