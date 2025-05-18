---
title: Writing Genkit plugins
---

Genkit's capabilities are designed to be extended by plugins. Genkit plugins are configurable modules
that can provide models, retrievers, indexers, trace stores, and more. You've already seen plugins in
action just by using Genkit:

```ts
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

const ai = genkit({
  plugins: [vertexAI({ projectId: 'my-project' })],
});
```

The Vertex AI plugin takes configuration (such as the user's Google Cloud
project ID) and registers a variety of new models, embedders, and more with the
Genkit registry. The registry powers Genkit's local UI for running and
inspecting models, prompts, and more as well as serves as a lookup service for
named actions at runtime.

## Creating a Plugin

To create a plugin you'll generally want to create a new NPM package:

```bash
mkdir genkitx-my-plugin

cd genkitx-my-plugin

npm init -y

npm i --save genkit

npm i --save-dev typescript

npx tsc --init
```

Then, define and export your plugin from your main entry point using the
`genkitPlugin` helper:

```ts
import { Genkit, z, modelActionMetadata } from 'genkit';
import { GenkitPlugin, genkitPlugin } from 'genkit/plugin';
import { ActionMetadata, ActionType } from 'genkit/registry';

interface MyPluginOptions {
  // add any plugin configuration here
}

export function myPlugin(options?: MyPluginOptions): GenkitPlugin {
  return genkitPlugin(
    'myPlugin',
    // Initializer function (required): Registers actions defined upfront.
    async (ai: Genkit) => {
      // Example: Define a model that's always available
      ai.defineModel({ name: 'myPlugin/always-available-model', ... });
      ai.defineEmbedder(/* ... */);
      // ... other upfront definitions
    },
    // Dynamic Action Resolver (optional): Defines actions on-demand.
    async (ai: Genkit, actionType: ActionType, actionName: string) => {
      // Called when an action (e.g., 'myPlugin/some-dynamic-model') is
      // requested but not found in the registry.
      if (actionType === 'model' && actionName === 'some-dynamic-model') {
        ai.defineModel({ name: `myPlugin/${actionName}`, ... });
      }
      // ... handle other dynamic actions
    },
    // List Actions function (optional): Lists all potential actions.
    async (): Promise<ActionMetadata[]> => {
      // Returns metadata for all actions the plugin *could* provide,
      // even if not yet defined dynamically. Used by Dev UI, etc.
      // Example: Fetch available models from an API
      const availableModels = await fetchMyModelsFromApi();
      return availableModels.map(model => modelActionMetadata({
        type: 'model',
        name: `myPlugin/${model.id}`,
        // ... other metadata
      }));
    }
  );
}
```

The `genkitPlugin` function accepts up to three arguments:

1.  **Plugin Name (string, required):** A unique identifier for your plugin (e.g., `'myPlugin'`).
2.  **Initializer Function (`async (ai: Genkit) => void`, required):** This function runs when Genkit starts. Use it to register actions (models, embedders, etc.) that should always be available using `ai.defineModel()`, `ai.defineEmbedder()`, etc.
3.  **Dynamic Action Resolver (`async (ai: Genkit, actionType: ActionType, actionName: string) => void`, optional):** This function is called when Genkit tries to access an action (by type and name) that hasn't been registered yet. It lets you define actions dynamically, just-in-time. For example, if a user requests `model: 'myPlugin/some-model'`, and it wasn't defined in the initializer, this function runs, giving you a chance to define it using `ai.defineModel()`. This is useful when a plugin supports many possible actions (like numerous models) and you don't want to register them all at startup.
4.  **List Actions Function (`async () => Promise<ActionMetadata[]>`, optional):** This function should return metadata for _all_ actions your plugin can potentially provide, including those that would be dynamically defined. This is primarily used by development tools like the Genkit Developer UI to populate lists of available models, embedders, etc., allowing users to discover and select them even if they haven't been explicitly defined yet. This function is generally _not_ called during normal flow execution.

### Plugin options guidance

In general, your plugin should take a single `options` argument that includes
any plugin-wide configuration necessary to function. For any plugin option that
requires a secret value, such as API keys, you should offer both an option and a
default environment variable to configure it:

```ts
import { GenkitError, Genkit, z } from 'genkit';
import { GenkitPlugin, genkitPlugin } from 'genkit/plugin';

interface MyPluginOptions {
  apiKey?: string;
}

export function myPlugin(options?: MyPluginOptions) {
  return genkitPlugin('myPlugin', async (ai: Genkit) => {
    if (!apiKey)
      throw new GenkitError({
        source: 'my-plugin',
        status: 'INVALID_ARGUMENT',
        message:
          'Must supply either `options.apiKey` or set `MY_PLUGIN_API_KEY` environment variable.',
      });

    ai.defineModel(...);
    ai.defineEmbedder(...)

    // ....
  });
};
```

## Building your plugin

A single plugin can activate many new things within Genkit. For example, the Vertex AI plugin activates several new models as well as an embedder.

### Model plugins

Genkit model plugins add one or more generative AI models to the Genkit registry. A model represents any generative
model that is capable of receiving a prompt as input and generating text, media, or data as output.
Generally, a model plugin will make one or more `defineModel` calls in its initialization function.

A custom model generally consists of three components:

1.  Metadata defining the model's capabilities.
2.  A configuration schema with any specific parameters supported by the model.
3.  A function that implements the model accepting `GenerateRequest` and
    returning `GenerateResponse`.

To build a model plugin, you'll need to use the `genkit/model` package:

At a high level, a model plugin might look something like this:

```ts
import { genkitPlugin, GenkitPlugin } from 'genkit/plugin';
import { GenerationCommonConfigSchema } from 'genkit/model';
import { simulateSystemPrompt } from 'genkit/model/middleware';
import { Genkit, GenkitError, z } from 'genkit';

export interface MyPluginOptions {
 // ...
}

export function myPlugin(options?: MyPluginOptions): GenkitPlugin {
  return genkitPlugin('my-plugin', async (ai: Genkit) => {
    ai.defineModel({
      // be sure to include your plugin as a provider prefix
      name: 'my-plugin/my-model',
      // label for your model as shown in Genkit Developer UI
      label: 'My Awesome Model',
      // optional list of supported versions of your model
      versions: ['my-model-001', 'my-model-001'],
      // model support attributes
      supports: {
        multiturn: true, // true if your model supports conversations
        media: true, // true if your model supports multimodal input
        tools: true, // true if your model supports tool/function calling
        systemRole: true, // true if your model supports the system role
        output: ['text', 'media', 'json'], // types of output your model supports
      },
      // Zod schema for your model's custom configuration
      configSchema: GenerationCommonConfigSchema.extend({
        safetySettings: z.object({...}),
      }),
      // list of middleware for your model to use
      use: [simulateSystemPrompt()]
    }, async request => {
      const myModelRequest = toMyModelRequest(request);
      const myModelResponse = await myModelApi(myModelRequest);
      return toGenerateResponse(myModelResponse);
    });
  });
};
```

#### Transforming Requests and Responses

The primary work of a Genkit model plugin is transforming the
`GenerateRequest` from Genkit's common format into a format that is recognized
and supported by your model's API, and then transforming the response from your
model into the `GenerateResponseData` format used by Genkit.

Sometimes, this may require massaging or manipulating data to work around model limitations. For example, if your model does not natively support a `system` message, you may need to transform a prompt's system message into a user/model message pair.

#### Action References (Models, Embedders, etc.)

While actions like models and embedders can always be referenced by their string name (e.g., `'myPlugin/my-model'`) after being defined (either upfront or dynamically), providing strongly-typed references offers better developer experience through improved type checking and IDE autocompletion.

The recommended pattern is to attach helper methods directly to your exported plugin function. These methods use reference builders like `modelRef` and `embedderRef` from Genkit core.

First, define the type for your plugin function including the helper methods:

```ts
import { GenkitPlugin } from 'genkit/plugin';
import { ModelReference, EmbedderReference, modelRef, embedderRef, z } from 'genkit';

// Define your model's specific config schema if it has one
const MyModelConfigSchema = z.object({
  customParam: z.string().optional(),
});

// Define the type for your plugin function
export type MyPlugin = {
  // The main plugin function signature
  (options?: MyPluginOptions): GenkitPlugin;

  // Helper method for creating model references
  model(
    name: string, // e.g., 'some-model-name'
    config?: z.infer<typeof MyModelConfigSchema>,
  ): ModelReference<typeof MyModelConfigSchema>;

  // Helper method for creating embedder references
  embedder(
    name: string, // e.g., 'my-embedder'
    config?: Record<string, any>, // Or a specific config schema
  ): EmbedderReference;

  // ... add helpers for other action types if needed
};
```

Then, implement the plugin function and attach the helper methods before exporting:

```ts
// (Previous imports and MyPluginOptions interface definition)
import { modelRef, embedderRef } from 'genkit/model'; // Ensure modelRef/embedderRef are imported

function myPluginFn(options?: MyPluginOptions): GenkitPlugin {
  return genkitPlugin(
    'myPlugin',
    async (ai: Genkit) => {
      // Initializer...
    },
    async (ai, actionType, actionName) => {
      // Dynamic resolver...
      // Example: Define model if requested dynamically
      if (actionType === 'model') {
        ai.defineModel(
          {
            name: `myPlugin/${actionName}`,
            // ... other model definition properties
            configSchema: MyModelConfigSchema, // Use the defined schema
          },
          async (request) => {
            /* ... model implementation ... */
          },
        );
      }
      // Handle other dynamic actions...
    },
    async () => {
      // List actions...
    },
  );
}

// Create the final export conforming to the MyPlugin type
export const myPlugin = myPluginFn as MyPlugin;

// Implement the helper methods
myPlugin.model = (
  name: string,
  config?: z.infer<typeof MyModelConfigSchema>,
): ModelReference<typeof MyModelConfigSchema> => {
  return modelRef({
    name: `myPlugin/${name}`, // Automatically prefixes the name
    configSchema: MyModelConfigSchema,
    config,
  });
};

myPlugin.embedder = (name: string, config?: Record<string, any>): EmbedderReference => {
  return embedderRef({
    name: `myPlugin/${name}`,
    config,
  });
};
```

Now, users can import your plugin and use the helper methods for type-safe action references:

```ts
import { genkit } from 'genkit';
import { myPlugin } from 'genkitx-my-plugin'; // Assuming your package name

const ai = genkit({
  plugins: [
    myPlugin({
      /* options */
    }),
  ],
});

async function run() {
  const { text } = await ai.generate({
    // Use the helper for a type-safe model reference
    model: myPlugin.model('some-model-name', { customParam: 'value' }),
    prompt: 'Tell me a story.',
  });
  console.log(text);

  const embeddings = await ai.embed({
    // Use the helper for a type-safe embedder reference
    embedder: myPlugin.embedder('my-embedder'),
    content: 'Embed this text.',
  });
  console.log(embeddings);
}

run();
```

This approach keeps the plugin definition clean while providing a convenient and type-safe way for users to reference the actions provided by your plugin. It works seamlessly with both statically and dynamically defined actions, as the references only contain metadata, not the implementation itself.

## Publishing a plugin

Genkit plugins can be published as normal NPM packages. To increase
discoverability and maximize consistency, your package should be named
`genkitx-{name}` to indicate it is a Genkit plugin and you should include as
many of the following `keywords` in your `package.json` as are relevant to your
plugin:

- `genkit-plugin`: always include this keyword in your package to indicate it is a Genkit plugin.
- `genkit-model`: include this keyword if your package defines any models.
- `genkit-retriever`: include this keyword if your package defines any retrievers.
- `genkit-indexer`: include this keyword if your package defines any indexers.
- `genkit-embedder`: include this keyword if your package defines any indexers.
- `genkit-telemetry`: include this keyword if your package defines a telemetry provider.
- `genkit-deploy`: include this keyword if your package includes helpers to deploy Genkit apps to cloud providers.
- `genkit-flow`: include this keyword if your package enhances Genkit flows.

A plugin that provided a retriever, embedder, and model might have a `package.json` that looks like:

```js
{
  "name": "genkitx-my-plugin",
  "keywords": ["genkit-plugin", "genkit-retriever", "genkit-embedder", "genkit-model"],
  // ... dependencies etc.
}
```
