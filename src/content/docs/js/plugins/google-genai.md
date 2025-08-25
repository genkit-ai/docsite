---
title: Google Genai plugin
description: This document describes the Google Genai plugin for Genkit, providing interfaces to Google's models, including embedding, text-to-speech, image generation, video generation, and music generation.
---

The Google GenAI plugin provides a unified interface to connect with Google's generative AI models, offering access through both the **Gemini Developer API** and **Vertex AI**. It is a replacement for the previous `googleAI` and `vertexAI` plugins.

## Installation

```bash
npm i --save @genkit-ai/google-genai
```

## Configuration

This unified plugin exports two main initializers:

- `googleAI`: Allows access to models via the Gemini Developer API using API key authentication.
- `vertexAI`: Allows access to models via Google Cloud Vertex AI. Authentication can be done via Google Cloud Application Default Credentials (ADC) or a simpler API Key for Express Mode.

You can configure one or both in your Genkit setup depending on your needs.

### Using the Gemini Developer API (`googleAI`)

Ideal for quick prototyping and access to models available in Google AI Studio.

**Authentication:** Requires a Google AI API Key, which you can get from [Google AI Studio](https://aistudio.google.com/apikey). You can provide this key by setting the `GEMINI_API_KEY` or `GOOGLE_API_KEY` environment variables, or by passing it in the plugin configuration.

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [
    googleAI(),
    // Or with an explicit API key:
    // googleAI({ apiKey: 'your-api-key' }),
  ],
});
```

### Using Vertex AI (`vertexAI`)

Suitable for applications leveraging Google Cloud's AI infrastructure.

**Authentication Methods:**

-   **Application Default Credentials (ADC):** The standard method for most Vertex AI use cases, especially in production. It uses the credentials from the environment (e.g., service account on GCP, user credentials from `gcloud auth application-default login` locally). This method requires a Google Cloud Project with billing enabled and the Vertex AI API enabled.
-   **Vertex AI Express Mode:** A streamlined way to try out many Vertex AI features using just an API key, without needing to set up billing or full project configurations. This is ideal for quick experimentation and has generous free tier quotas. [Learn More about Express Mode](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview).

```typescript
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [
    // Using Application Default Credentials (Recommended for full features)
    vertexAI({ location: 'us-central1' }), // Regional endpoint
    // vertexAI({ location: 'global' }),      // Global endpoint

    // OR

    // Using Vertex AI Express Mode (Easy to start, some limitations)
    // Get an API key from the Vertex AI Studio Express Mode setup.
    // vertexAI({ apiKey: process.env.VERTEX_EXPRESS_API_KEY }),
  ],
});
```

*Note: When using Express Mode, you do not provide `projectId` and `location` in the plugin config.*

### Using Both Google AI and Vertex AI

You can configure both plugins if you need to access models or features from both services.

```typescript
import { genkit } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [
    googleAI(),
    vertexAI({location: 'us-central1'}),
  ],
});
```

## Usage Examples

Access models and embedders through the configured plugin instance (`googleAI` or `vertexAI`).

### Text Generation (Gemini)

**With `googleAI`:**
```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI()],
});

const response = await ai.generate({
  model: googleAI.model('gemini-2.5-flash'),
  prompt: 'Tell me something interesting about Google AI.',
});

console.log(response.text());
```

**With `vertexAI`:**
```typescript
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [vertexAI({location: 'global'})],
});

const response = await ai.generate({
  model: vertexAI.model('gemini-2.5-pro'),
  prompt: 'Explain Vertex AI in simple terms.',
});

console.log(response.text());
```

### Text Embedding

**With `googleAI`:**
```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI()],
});

const embeddings = await ai.embed({
  embedder: googleAI.embedder('text-embedding-004'),
  content: 'Embed this text.',
});
```

**With `vertexAI`:**
```typescript
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [vertexAI()],
});

const embeddings = await ai.embed({
  embedder: vertexAI.embedder('text-embedding-005'),
  content: 'Embed this text.',
});
```

### Image Generation (Imagen)

**With `googleAI`:**
```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [googleAI()],
});

const response = await ai.generate({
  model: googleAI.model('imagen-3.0-generate-002'),
  prompt: 'A beautiful watercolor painting of a castle in the mountains.',
});

const generatedImage = response.media();
```

**With `vertexAI`:**
```typescript
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [vertexAI()],
});

const response = await ai.generate({
  model: vertexAI.model('imagen-3.0-generate-002'),
  prompt: 'A beautiful watercolor painting of a castle in the mountains.',
});

const generatedImage = response.media();
```

## Key Differences

-   **`googleAI`**: Easier setup for smaller projects, great for prototyping with Google AI Studio. Uses API keys.
-   **`vertexAI`**: Enterprise-ready, integrates with Google Cloud IAM and other Vertex AI services. Offers a broader range of models and features like fine-tuning, and more robust governance. Vertex AI Express Mode provides a low-friction entry point using an API key.

Choose the interface based on your project's scale, infrastructure, and feature requirements.

## Gemini API Features

The following features are available through the `googleAI` plugin.

### Gemini Files API

You can use files uploaded to the Gemini Files API with Genkit:

```ts
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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

### Video Generation (Veo) Models

The Google Generative AI plugin provides access to video generation capabilities through the Veo models. These models can generate videos from text prompts or manipulate existing images to create dynamic video content.

#### Basic Usage: Text-to-Video Generation

To generate a video from a text prompt using the Veo model:

```ts
import { googleAI } from '@genkit-ai/google-genai';
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

Veo 3 uses the exact same API, just make sure you only use supported config options (see below).

To use the Veo 3 model, reference `veo-3.0-generate-preview`:

```ts
let { operation } = await ai.generate({
  model: googleAI.model('veo-3.0-generate-preview'),
  prompt: 'A cinematic shot of a an old car driving down a deserted road at sunset.',
});
```

#### Video Generation from Photo Reference

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

#### Configuration Options

The Veo models support various configuration options.

##### Veo Model Parameters

Full list of options can be found at https://ai.google.dev/gemini-api/docs/video#veo-model-parameters

- `negativePrompt`: Text string that describes anything you want to discourage the model from generating
- `aspectRatio`: Changes the aspect ratio of the generated video.
  - `"16:9"`: Supported in Veo 3 and Veo 2.
  - `"9:16"`: Supported in Veo 2 only (defaults to "16:9").
- `personGeneration`: Allow the model to generate videos of people. The following values are supported:
  - **Text-to-video generation**:
    - `"allow_all"`: Generate videos that include adults and children. Currently the only available `personGeneration` value for Veo 3.
    - `"dont_allow"`: Veo 2 only. Don't allow the inclusion of people or faces.
    - `"allow_adult"`: Veo 2 only. Generate videos that include adults, but not children.
  - **Image-to-video generation**: Veo 2 only
    - `"dont_allow"`: Don't allow the inclusion of people or faces.
    - `"allow_adult"`: Generate videos that include adults, but not children.
- `numberOfVideos`: Output videos requested
  - `1`: Supported in Veo 3 and Veo 2
  - `2`: Supported in Veo 2 only.
- `durationSeconds`: Veo 2 only. Length of each output video in seconds, between 5 and 8. Not configurable for Veo 3, default setting is 8 seconds.
- `enhancePrompt`: Veo 2 only. Enable or disable the prompt rewriter. Enabled by default. Not configurable for Veo 3, default prompt enhancer is always on.

### Text-to-Speech (TTS) Models

The Google Genai plugin provides access to text-to-speech capabilities through Gemini TTS models. These models can convert text into natural-sounding speech for various applications.

#### Basic Usage

To generate audio using a TTS model:

```ts
import { googleAI } from '@genkit-ai/google-genai';
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
// The googleAI plugin returns raw PCM data, which we convert to WAV format.
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

#### Multi-speaker Audio Generation

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

#### Configuration Options

The Gemini TTS models support various configuration options:

##### Voice Selection

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

##### Speech Emphasis

You can use markdown-style formatting in your prompt to add emphasis:

- Bold text (`**like this**`) for stronger emphasis
- Italic text (`*like this*`) for moderate emphasis

Example:

```ts
prompt: 'Genkit is an **amazing** Gen AI *library*!'
```

##### Advanced Speech Parameters

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

## Vertex AI Features

The following features are available through the `vertexAI` plugin.

### Grounding

This plugin also supports grounding Gemini text responses using [Google Search](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/ground-gemini#web-ground-gemini) or [your own data](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/ground-gemini#private-ground-gemini).

Important: Vertex AI charges a fee for grounding requests in addition to the cost of making LLM requests. See the [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) page and be sure you understand grounding request pricing before you use this feature.

Example:

```ts
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })],
});

await ai.generate({
  model: vertexAI.model('gemini-2.5-flash'),
  prompt: '...',
  config: {
    googleSearchRetrieval: {
      disableAttribution: true,
    }
    vertexRetrieval: {
      datastore: {
        projectId: 'your-cloud-project',
        location: 'us-central1',
        collection: 'your-collection',
      },
      disableAttribution: true,
    }
  }
})
```