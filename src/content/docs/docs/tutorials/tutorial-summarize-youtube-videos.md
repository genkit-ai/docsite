---
title: Summarize YouTube videos
description: Learn how to build a conversational application that allows users to summarize YouTube videos and chat about their contents using natural language.
---

This tutorial demonstrates how to build a conversational application that
allows users to summarize YouTube videos and chat about their contents using
natural language.

1. [Set up your project](#1-set-up-your-project)
2. [Import the required dependencies](#2-import-the-required-dependencies)
3. [Configure Genkit and the default model](#3-configure-genkit-and-the-default-model)
4. [Get the video URL from the command line](#4-parse-the-command-line-and-get-the-video-url)
5. [Set up the prompt](#5-set-up-the-prompt)
6. [Generate the response](#6-generate-the-response)
7. [Run the app](#7-run-the-app)

## Prerequisites

Before starting work, you should have these prerequisites set up:

- [Node.js v20+](https://nodejs.org/en/download)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## Implementation Steps

After setting up your dependencies, you can build the project.

### 1. Set up your project

1. Create a directory structure and a file to hold
   your source code.

   ```bash
   mkdir -p summarize-a-video/src && \
   cd summarize-a-video && \
   touch src/index.ts
   ```

2. Initialize a new TypeScript project.

   ```bash
   npm init -y
   ```

3. Install the following Genkit dependencies to use Genkit in your project:

   ```bash
   npm install genkit @genkit-ai/googleai
   ```

   - `genkit` provides Genkit core capabilities.
   - `@genkit-ai/googleai` provides access to the Google AI Gemini models.

4. Get and configure your model API key

   To use the Gemini API, which this tutorial uses, you must first
   configure an API key. If you don't already have one,
   [create a key](https://makersuite.google.com/app/apikey) in Google AI Studio.

   The Gemini API provides a generous free-of-charge tier and does not require a
   credit card to get started.

   After creating your API key, set the `GEMINI_API_KEY` environment
   variable to your key with the following command:

   ```bash
   export GEMINI_API_KEY=<your API key>
   ```

:::note
Although this tutorial uses the Gemini API from AI Studio, Genkit
supports a wide variety of model providers, including:

- [Gemini from Vertex AI.](/docs/plugins/vertex-ai#generative-ai-models)
- Anthropic's Claude 3 models and Llama 3.1 through the
  [Vertex AI Model Garden](/docs/plugins/vertex-ai#anthropic-claude-3-on-vertex-ai-model-garden),
  as well as community plugins.
- Open source models through
  [Ollama](/docs/plugins/ollama).
- [Community-supported providers](/docs/models#models-supported-by-genkit) such as OpenAI and Cohere.
:::

### 2. Import the required dependencies

In the `index.ts` file that you created, add the
following lines to import the dependencies required for this project:

```typescript
import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
```

- The first line imports the `googleAI` plugin from the `@genkit-ai/googleai` package, enabling access to
  Google's Gemini models.

### 3. Configure Genkit and the default model

Add the following lines to configure Genkit and set Gemini 2.0 Flash as the
default model.

```typescript
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'),
});
```

You can then add a skeleton for the code and error-handling.

```typescript
(async () => {
  try {
    // Step 1: get command line arguments
    // Step 2: construct prompt
    // Step 3: process video
  } catch (error) {
    console.error('Error processing video:', error);
  }
})(); // <-- don't forget the trailing parentheses to call the function!
```

### 4. Parse the command line and get the video URL

Add code to read the URL of the video that was passed in from the command line.

```typescript
// Step 1: get command line arguments
const videoURL = process.argv[2];
if (!videoURL) {
  console.error('Please provide a video URL as a command line argument.');
  process.exit(1);
}
```

### 5. Set up the prompt

Add code to set up the prompt:

```typescript
// Step 2: construct prompt
const prompt = process.argv[3] || 'Please summarize the following video:';
```

- This `const` declaration defines a default prompt if the user doesn't
  pass in one of their own from the command line.

### 6. Generate the response

Add the following code to pass a multimodal prompt to the model:

```typescript
// Step 3: process video
const { text } = await ai.generate({
  prompt: [{ text: prompt }, { media: { url: videoURL, contentType: 'video/mp4' } }],
});
console.log(text);
```

This code snippet calls the `ai.generate` method to send a multimodal prompt to
the model. The prompt consists of two parts:

- `{ text: prompt }`: This is the text prompt that you defined earlier.
- `{ media: { url: videoURL, contentType: "video/mp4" } }`: This is the URL of
  the video that you provided as a command-line argument. The `contentType`
  is set to `video/mp4` to indicate that the URL points to an MP4 video file.

The `ai.generate` method returns an object containing the generated text, which
is then logged to the console.

### 7. Run the app

To run the app, open the terminal in the root
folder of your project, then run the following command:

```bash
npx tsx src/index.ts https://www.youtube.com/watch\?v\=YUgXJkNqH9Q
```

After a moment, a summary of the video you provided appears.

You can pass in other prompts as well. For example:

```bash
npx tsx src/index.ts https://www.youtube.com/watch\?v\=YUgXJkNqH9Q "Transcribe this video"
```

:::note
If you get an error message saying "no matches found", you
might need to wrap the video URL in quotes.
:::
