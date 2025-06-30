---
title: Defining AI workflows
---

AI applications rarely involve just a single model call. Most real-world AI features require a series of coordinated steps: retrieving context, processing user input, calling models, validating outputs, and combining results from multiple sources.

Genkit **flows** provide a structured way to define these multi-step AI workflows. Think of flows as enhanced functions that wrap your AI logic with additional development, debugging, and deployment capabilities.

## Why are Genkit flows?

Genkit flows are lightweight wrappers around your AI logic that provide the following benefits:

- **Type safety**: Input and output validation using [Zod](https://zod.dev/) schemas
- **Development tools**: Debug and test flows using the Developer UI
- **Easy deployment**: Expose flows directly as web API endpoints
- **Observability**: Automatically trace each step of a flow for inspection and debugging

## Setup

All examples assume the following Genkit setup:

```typescript
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
});
```

## Creating your first flow

Define a flow by providing a name, input and output schemas, and a core async function:

```ts
export const menuSuggestionTextFlow = ai.defineFlow(
  {
    name: 'menuSuggestionTextFlow',
    inputSchema: z.object({ theme: z.string() }),
    outputSchema: z.object({ menuItem: z.string() }),
  },
  async ({ theme }) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Invent a menu item for a ${theme} themed restaurant.`,
    });
    return { menuItem: text };
  }
);
```

Wrapping a function in a flow allows you to test and inspect it with the Genkit CLI or Developer UI, and deploy it as an API endpoint.

## Working with schemas

Zod schemas are central to how flows provide type safety and validation. They offer two key benefits:

- **Type safety**: Full TypeScript inference with IDE autocomplete and compile-time error checking
- **Runtime validation**: Catches invalid inputs and ensures outputs match expectations

### Schema best practices

Always wrap schemas in `z.object()`, even for simple datatypes. This approach provides:

- Labeled fields for better autocomplete and Developer UI experience
- Flexibility to add fields later without breaking changes
- Improved code readability and structure

### Structured output example

Here's how to work with more complex, structured data:

```ts
const MenuItemSchema = z.object({
  dishName: z.string(),
  description: z.string(),
}); 

export const menuSuggestionObjectFlow = ai.defineFlow(
  {
    name: 'menuSuggestionObjectFlow',
    inputSchema: z.object({ theme: z.string() }),
    outputSchema: MenuItemSchema,
  },
  async ({ theme }) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Invent a menu item for a ${theme} themed restaurant.`,
      output: { schema: MenuItemSchema },
    });

    if (!output) {
      throw new Error("Failed to generate valid menu item");
    }

    return output;
  }
);
```

### Transforming output

Flow schemas don't need to match internal model calls exactly. You can reshape the output for display or downstream use:

```ts
export const formattedMenuFlow = ai.defineFlow(
  {
    name: 'formattedMenuFlow',
    inputSchema: z.object({ theme: z.string() }),
    outputSchema: z.object({ formattedMenuItem: z.string() }),
  },
  async ({ theme }) => {
    // Generate structured data internally
    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Invent a menu item for a ${theme} themed restaurant.`,
      output: { schema: MenuItemSchema },
    });
    
    if (!output) {
      throw new Error("Failed to generate menu item");
    }
    
    // Transform and format for output
    return { 
      formattedMenuItem: `**${output.dishName}**: ${output.description}`
    };
  },
);
```

## Calling flows

Call flows like any async function:

```ts
const result = await menuSuggestionTextFlow({ theme: 'bistro' });
console.log(result.menuItem);
```

When using a structured output:

```ts
const { dishName, description } = await menuSuggestionObjectFlow({ theme: 'bistro' });
```

TypeScript will enforce schema validation and assist with autocomplete.

## Streaming flows

For a more responsive user experience, streaming flows let you display partial results as they become available:

```ts
export const streamingMenuFlow = ai.defineFlow(
  {
    name: 'streamingMenuFlow',
    inputSchema: z.object({ theme: z.string() }),
    streamSchema: z.object({ menuItemChunk: z.string() }),
    outputSchema: z.object({ menuItem: z.string() }),
  },
  async ({ theme }, { sendChunk }) => {
    const { stream, response } = ai.generateStream({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Invent a menu item for a ${theme} themed restaurant.`,
    });

    for await (const chunk of stream) {
      sendChunk({ menuItemChunk: chunk.text });
    }

    const { text: menuItem } = await response;
    return { menuItem };
  }
);
```

**Key concepts for streaming:**
- `streamSchema`: Defines the type of individual chunks sent during streaming
- `outputSchema`: Defines the type of the final complete result
- `sendChunk()`: Callback to send data to the output stream as it becomes available

### Consuming streaming flows

```typescript
// Start streaming
const response = streamingMenuFlow.stream({ theme: 'Italian' });

// Process chunks as they arrive
for await (const chunk of response.stream) {
  console.log('Menu item part:', chunk.menuItemChunk);
}

// Get the final complete result
const finalResult = await response.output;
console.log('Final menu item:', finalResult.menuItem);
```

## Observability

One of the key benefits flows provide is observability for multi-step workflows. If a flow run includes multiple generation steps, tool invocations, and even subflows, the traces for each step will be nested under the parent flow's trace.

All Genkit components are traceable with OpenTelemetry instrumentation. Traces for Genkit flows can be inspected locally for debugging

## Testing in the Developer UI

The Developer UI is a local tool for testing and inspecting Genkit flows with a visual interface. It's one of the key advantages of using flows, allowing you to test and debug your AI logic independently from your main application.

### Start the Developer UI

Run the following command from your project directory:

```bash
genkit start -- npx tsx --watch src/your-code.ts
```

This starts your app and launches the Developer UI at http://localhost:4000 by default.

:::note
The command after `--` should run the file that defines or imports your Genkit flows. You can use `tsx`, `node`, or other commands based on your setup.
:::

### Run and inspect flows

In the Developer UI:

1. Select your flow from the list of available flows
2. Enter sample input in JSON format
3. Click **Run**

After running a flow, you'll see the generated output along with a visual trace of the execution process for debugging and optimization. Click **View trace** or click any steps in the trace column for closer inspection.

<video
  controls
  preload="metadata"
  muted
  width="100%"
  style="max-width: 800px; display: block; margin: 2rem auto 0; border: none;"
  poster="/videos/devui-flow-runner-poster.png"
>
  <source src="/videos/devui-flow-runner.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

### Flow 

In the last example, you saw that each `generate()` call showed up as a separate
step in the trace viewer. Each of Genkit's fundamental actions show up as
separate steps of a flow:

- `generate()`
- `Chat.send()`
- `embed()`
- `index()`
- `retrieve()`

If you want to include code other than the above in your traces, you can do so
by wrapping the code in a `run()` call. You might do this for calls to
third-party libraries that are not Genkit-aware, or for any critical section of
code.

For example, here's a flow with two steps: the first step retrieves a menu using
some unspecified method, and the second step includes the menu as context for a
`generate()` call.

```ts
export const menuQuestionFlow = ai.defineFlow(
  {
    name: 'menuQuestionFlow',
    inputSchema: z.object({ question: z.string() }),
    outputSchema: z.object({ answer: z.string() }),
  },
  async ({ question }): Promise<{ answer: string }> => {
    const menu = await ai.run('retrieve-daily-menu', async (): Promise<string> => {
      // Retrieve today's menu. (This could be a database access or simply
      // fetching the menu from your website.)

      // ...

      return menu;
    });
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      system: "Help the user answer questions about today's menu.",
      prompt: question,
      docs: [{ content: [{ text: menu }] }],
    });
    return { answer: text };
  },
);
```

Because the retrieval step is wrapped in a `run()` call, it's included as a step
in the trace viewer:

![Genkit DevUI flows](../../../assets/devui-runstep.png)

## Deploying flows

You can deploy your flows directly as web API endpoints, ready for you to call
from your app clients. Deployment is discussed in detail on several other pages,
but this section gives brief overviews of your deployment options.

### Cloud Functions for Firebase

To deploy flows with Cloud Functions for Firebase, use the `onCallGenkit`
feature of `firebase-functions/https`. `onCallGenkit` wraps your flow in a
callable function. You may set an auth policy and configure App Check.

```typescript
import { hasClaim, onCallGenkit } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';

const apiKey = defineSecret('GOOGLE_AI_API_KEY');

const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.object({ theme: z.string() }),
    outputSchema: z.object({ menuItem: z.string() }),
  },
  async ({ theme }) => {
    // ...
    return { menuItem: "Generated menu item would go here" };
  },
);

export const menuSuggestion = onCallGenkit(
  {
    secrets: [apiKey],
    authPolicy: hasClaim('email_verified'),
  },
  menuSuggestionFlow,
);
```

For more information, see the following pages:

- [Deploy with Firebase](/docs/firebase)
- [Authorization and integrity](/docs/auth#authorize-using-cloud-functions-for-firebase)
- [Firebase plugin](/docs/plugins/firebase)

### Express.js

To deploy flows using any Node.js hosting platform, such as Cloud Run, define
your flows using `defineFlow()` and then call `startFlowServer()`:

```typescript
import { startFlowServer } from '@genkit-ai/express';

export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.object({ theme: z.string() }),
    outputSchema: z.object({ result: z.string() }),
  },
  async ({ theme }) => {
    // ...
  },
);

startFlowServer({
  flows: [menuSuggestionFlow],
});
```

By default, `startFlowServer` will serve all the flows defined in your codebase
as HTTP endpoints (for example, `http://localhost:3400/menuSuggestionFlow`). You
can call a flow with a POST request as follows:

```bash
curl -X POST "http://localhost:3400/menuSuggestionFlow" \
  -H "Content-Type: application/json"  -d '{"data": {"theme": "banana"}}'
```

If needed, you can customize the flows server to serve a specific list of flows,
as shown below. You can also specify a custom port (it will use the PORT
environment variable if set) or specify CORS settings.

```typescript
export const flowA = ai.defineFlow(
  { 
    name: 'flowA',
    inputSchema: z.object({ subject: z.string() }),
    outputSchema: z.object({ response: z.string() }),
  }, 
  async ({ subject }) => {
    // ...
    return { response: "Generated response would go here" };
  }
);

export const flowB = ai.defineFlow(
  { 
    name: 'flowB',
    inputSchema: z.object({ subject: z.string() }),
    outputSchema: z.object({ response: z.string() }),
  }, 
  async ({ subject }) => {
    // ...
    return { response: "Generated response would go here" };
  }
);

startFlowServer({
  flows: [flowB],
  port: 4567,
  cors: {
    origin: '*',
  },
});
```

For information on deploying to specific platforms, see
[Deploy with Cloud Run](/docs/cloud-run) and
[Deploy flows to any Node.js platform](/docs/deploy-node).
