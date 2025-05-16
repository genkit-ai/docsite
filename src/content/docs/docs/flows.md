---
title: Defining AI workflows
---

The core of your app's AI features are generative model requests, but it's rare
that you can simply take user input, pass it to the model, and display the model
output back to the user. Usually, there are pre- and post-processing steps that
must accompany the model call. For example:

- Retrieving contextual information to send with the model call
- Retrieving the history of the user's current session, for example in a chat
  app
- Using one model to reformat the user input in a way that's suitable to pass
  to another model
- Evaluating the "safety" of a model's output before presenting it to the user
- Combining the output of several models

Every step of this workflow must work together for any AI-related task to
succeed.

In Genkit, you represent this tightly-linked logic using a construction called a
flow. Flows are written just like functions, using ordinary TypeScript code, but
they add additional capabilities intended to ease the development of AI
features:

- **Type safety**: Input and output schemas defined using Zod, which provides
  both static and runtime type checking
- **Integration with developer UI**: Debug flows independently of your
  application code using the developer UI. In the developer UI, you can run
  flows and view traces for each step of the flow.
- **Simplified deployment**: Deploy flows directly as web API endpoints, using
  Cloud Functions for Firebase or any platform that can host a web app.

Unlike similar features in other frameworks, Genkit's flows are lightweight and
unobtrusive, and don't force your app to conform to any specific abstraction.
All of the flow's logic is written in standard TypeScript, and code inside a
flow doesn't need to be flow-aware.

## Defining and calling flows

In its simplest form, a flow just wraps a function. The following example wraps
a function that calls `generate()`:

```typescript
export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
  },
  async (restaurantTheme) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Invent a menu item for a ${restaurantTheme} themed restaurant.`,
    });
    return text;
  }
);
```

Just by wrapping your `generate()` calls like this, you add some functionality:
doing so lets you run the flow from the Genkit CLI and from the developer UI,
and is a requirement for several of Genkit's features, including deployment and
observability (later sections discuss these topics).

### Input and output schemas

One of the most important advantages Genkit flows have over directly calling a
model API is type safety of both inputs and outputs. When defining flows, you
can define schemas for them using Zod, in much the same way as you define the
output schema of a `generate()` call; however, unlike with `generate()`, you can
also specify an input schema.

Here's a refinement of the last example, which defines a flow that takes a
string as input and outputs an object:

```typescript
import { z } from 'genkit';

const MenuItemSchema = z.object({
  dishname: z.string(),
  description: z.string(),
});

export const menuSuggestionFlowWithSchema = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: MenuItemSchema,
  },
  async (restaurantTheme) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Invent a menu item for a ${restaurantTheme} themed restaurant.`,
      output: { schema: MenuItemSchema },
    });
    if (output == null) {
      throw new Error("Response doesn't satisfy schema.");
    }
    return output;
  }
);
```

Note that the schema of a flow does not necessarily have to line up with the
schema of the `generate()` calls within the flow (in fact, a flow might not even
contain `generate()` calls). Here's a variation of the example that passes a
schema to `generate()`, but uses the structured output to format a simple
string, which the flow returns.

```typescript
export const menuSuggestionFlowMarkdown = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (restaurantTheme) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Invent a menu item for a ${restaurantTheme} themed restaurant.`,
      output: { schema: MenuItemSchema },
    });
    if (output == null) {
      throw new Error("Response doesn't satisfy schema.");
    }
    return `**${output.dishname}**: ${output.description}`;
  }
);
```

### Calling flows

Once you've defined a flow, you can call it from your Node.js code:

```typescript
const { text } = await menuSuggestionFlow('bistro');
```

The argument to the flow must conform to the input schema, if you defined one.

If you defined an output schema, the flow response will conform to it. For
example, if you set the output schema to `MenuItemSchema`, the flow output will
contain its properties:

```typescript
const { dishname, description } =
  await menuSuggestionFlowWithSchema('bistro');
```

## Streaming flows

Flows support streaming using an interface similar to `generate()`'s streaming
interface. Streaming is useful when your flow generates a large amount of
output, because you can present the output to the user as it's being generated,
which improves the perceived responsiveness of your app. As a familiar example,
chat-based LLM interfaces often stream their responses to the user as they are
generated.

Here's an example of a flow that supports streaming:

```typescript
export const menuSuggestionStreamingFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    streamSchema: z.string(),
    outputSchema: z.object({ theme: z.string(), menuItem: z.string() }),
  },
  async (restaurantTheme, { sendChunk }) => {
    const response = await ai.generateStream({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Invent a menu item for a ${restaurantTheme} themed restaurant.`,
    });

    for await (const chunk of response.stream) {
      // Here, you could process the chunk in some way before sending it to
      // the output stream via streamingCallback(). In this example, we output
      // the text of the chunk, unmodified.
      sendChunk(chunk.text);
    }

    return {
      theme: restaurantTheme,
      menuItem: (await response.response).text,
    };
  }
);
```

- The `streamSchema` option specifies the type of values your flow streams.
  This does not necessarily need to be the same type as the `outputSchema`,
  which is the type of the flow's complete output.
- The second parameter to your flow definition is called `sideChannel`. It
  provides features such as request context and the `sendChunk` callback.
  The `sendChunk` callback takes a single parameter, of
  the type specified by `streamSchema`. Whenever data becomes available within
  your flow, send the data to the output stream by calling this function.

In the above example, the values streamed by the flow are directly coupled to
the values streamed by the `generate()` call inside the flow. Although this is
often the case, it doesn't have to be: you can output values to the stream using
the callback as often as is useful for your flow.

### Calling streaming flows

Streaming flows are also callable, but they immediately return a response object
rather than a promise:

```typescript
const response = menuSuggestionStreamingFlow.stream('Danube');
```

The response object has a stream property, which you can use to iterate over the
streaming output of the flow as it's generated:

```typescript
for await (const chunk of response.stream) {
  console.log('chunk', chunk);
}
```

You can also get the complete output of the flow, as you can with a
non-streaming flow:

```typescript
const output = await response.output;
```

Note that the streaming output of a flow might not be the same type as the
complete output; the streaming output conforms to `streamSchema`, whereas the
complete output conforms to `outputSchema`.

## Running flows from the command line

You can run flows from the command line using the Genkit CLI tool:

```bash
genkit flow:run menuSuggestionFlow '"French"'
```

For streaming flows, you can print the streaming output to the console by adding
the `-s` flag:

```bash
genkit flow:run menuSuggestionFlow '"French"' -s
```

Running a flow from the command line is useful for testing a flow, or for
running flows that perform tasks needed on an ad hoc basis&mdash;for example, to
run a flow that ingests a document into your vector database.

## Debugging flows

One of the advantages of encapsulating AI logic within a flow is that you can
test and debug the flow independently from your app using the Genkit developer
UI.

To start the developer UI, run the following commands from your project
directory:

```bash
genkit start -- tsx --watch src/your-code.ts
```

From the **Run** tab of developer UI, you can run any of the flows defined in
your project:

![Genkit DevUI flows](../../../assets/devui-flows.png)

After you've run a flow, you can inspect a trace of the flow invocation by
either clicking **View trace** or looking on the **Inspect** tab.

In the trace viewer, you can see details about the execution of the entire flow,
as well as details for each of the individual steps within the flow. For
example, consider the following flow, which contains several generation
requests:

```typescript
const PrixFixeMenuSchema = z.object({
  starter: z.string(),
  soup: z.string(),
  main: z.string(),
  dessert: z.string(),
});

export const complexMenuSuggestionFlow = ai.defineFlow(
  {
    name: 'complexMenuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: PrixFixeMenuSchema,
  },
  async (theme: string): Promise<z.infer<typeof PrixFixeMenuSchema>> => {
    const chat = ai.chat({ model: googleAI.model('gemini-2.0-flash') });
    await chat.send('What makes a good prix fixe menu?');
    await chat.send(
      'What are some ingredients, seasonings, and cooking techniques that ' +
        `would work for a ${theme} themed menu?`
    );
    const { output } = await chat.send({
      prompt:
        `Based on our discussion, invent a prix fixe menu for a ${theme} ` +
        'themed restaurant.',
      output: {
        schema: PrixFixeMenuSchema,
      },
    });
    if (!output) {
      throw new Error('No data generated.');
    }
    return output;
  }
);
```

When you run this flow, the trace viewer shows you details about each generation
request including its output:

![Genkit DevUI flows](../../../assets/devui-inspect.png)

### Flow steps

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
import { run } from "genkit";

export const menuQuestionFlow = ai.defineFlow(
  {
    name: 'menuQuestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input: string): Promise<string> => {
    const menu = await ai.run(
      'retrieve-daily-menu',
      async (): Promise<string> => {
        // Retrieve today's menu. (This could be a database access or simply
        // fetching the menu from your website.)

        // ...

        return menu;
      }
    );
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      system: "Help the user answer questions about today's menu.",
      prompt: input,
      docs: [{ content: [{ text: menu }] }],
    });
    return text;
  }
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
  },
  async (restaurantTheme) => {
    // ...
  }
);

export const menuSuggestion = onCallGenkit(
  {
    secrets: [apiKey],
    authPolicy: hasClaim('email_verified'),
  },
  menuSuggestionFlow
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
  },
  async (restaurantTheme) => {
    // ...
  }
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
  -H "Content-Type: application/json"  -d '{"data": "banana"}'
```

If needed, you can customize the flows server to serve a specific list of flows,
as shown below. You can also specify a custom port (it will use the PORT
environment variable if set) or specify CORS settings.

```typescript
export const flowA = ai.defineFlow({ name: 'flowA' }, async (subject) => {
  // ...
});

export const flowB = ai.defineFlow({ name: 'flowB' }, async (subject) => {
  // ...
});

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
