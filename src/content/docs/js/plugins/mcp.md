---
title: Model Context Protocol (MCP) plugin
description: The Genkit MCP plugin provides integration between Genkit and the Model Context Protocol (MCP).
---

The Genkit MCP plugin provides integration between Genkit and the [Model Context Protocol](https://modelcontextprotocol.io) (MCP). MCP is an open standard allowing developers to build "servers" which provide tools, resources, and prompts to clients. Genkit MCP allows Genkit developers to:
- Consume MCP tools, prompts, and resources as a client using `createMcpHost` or `createMcpClient`.
- Provide Genkit tools and prompts as an MCP server using `createMcpServer`.

## Installation

To get started, you'll need Genkit and the MCP plugin:

```bash
npm i genkit @genkit-ai/mcp
```

## MCP Host

To connect to one or more MCP servers, you use the `createMcpHost` function. This function returns a `GenkitMcpHost` instance that manages connections to the configured MCP servers.

```ts
import { googleAI } from '@genkit-ai/googleai';
import { createMcpHost } from '@genkit-ai/mcp';
import { genkit } from 'genkit';

const mcpHost = createMcpHost({
  name: 'myMcpClients', // A name for the host plugin itself
  mcpServers: {
    // Each key (e.g., 'fs', 'git') becomes a namespace for the server's tools.
    fs: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    },
    memory: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
});

const ai = genkit({
  plugins: [googleAI()],
});

(async () => {
  // Provide MCP tools to the model of your choice.
  const { text } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `Analyze all files in ${process.cwd()}.`,
    tools: await mcpHost.getActiveTools(ai),
    resources: await mcpHost.getActiveResources(ai),
  });

  console.log(text);

  await mcpHost.close();
})();
```

The `createMcpHost` function initializes a `GenkitMcpHost` instance, which handles the lifecycle and communication with the defined MCP servers.

### `createMcpHost()` Options

```ts
export interface McpHostOptions {
  /**
   * An optional client name for this MCP host. This name is advertised to MCP Servers
   * as the connecting client name. Defaults to 'genkit-mcp'.
   */
  name?: string;
  /**
   * An optional version for this MCP host. Primarily for
   * logging and identification within Genkit.
   * Defaults to '1.0.0'.
   */
  version?: string;
  /**
   * A record for configuring multiple MCP servers. Each server connection is
   * controlled by a `GenkitMcpClient` instance managed by `GenkitMcpHost`.
   * The key in the record is used as the identifier for the MCP server.
   */
  mcpServers?: Record<string, McpServerConfig>;
  /**
   * If true, tool responses from the MCP server will be returned in their raw
   * MCP format. Otherwise (default), they are processed and potentially
   * simplified for better compatibility with Genkit's typical data structures.
   */
  rawToolResponses?: boolean;
  /**
   * When provided, each connected MCP server will be sent the roots specified here.
   * Overridden by any specific roots sent in the `mcpServers` config for a given server.
   */
  roots?: Root[];
}

/**
 * Configuration for an individual MCP server. The interface should be familiar
 * and compatible with existing tool configurations e.g. Cursor or Claude
 * Desktop.
 *
 * In addition to stdio servers, remote servers are supported via URL and
 * custom/arbitary transports are supported as well.
 */
export type McpServerConfig = (
  | McpStdioServerConfig
  | McpStreamableHttpConfig
  | McpTransportServerConfig
) &
  McpServerControls;


export type McpStdioServerConfig = StdioServerParameters;

export type McpStreamableHttpConfig = {
  url: string;
} & Omit<StreamableHTTPClientTransportOptions, 'sessionId'>;

export type McpTransportServerConfig = {
  transport: Transport;
};

export interface McpServerControls {
  /** 
   * when true, the server will be stopped and its registered components will
   * not appear in lists/plugins/etc 
   */
  disabled?: boolean;
  /** MCP roots configuration. See: https://modelcontextprotocol.io/docs/concepts/roots */
  roots?: Root[];
}

// from '@modelcontextprotocol/sdk/client/stdio.js'
export type StdioServerParameters = {
  /**
   * The executable to run to start the server.
   */
  command: string;
  /**
   * Command line arguments to pass to the executable.
   */
  args?: string[];
  /**
   * The environment to use when spawning the process.
   *
   * If not specified, the result of getDefaultEnvironment() will be used.
   */
  env?: Record<string, string>;
  /**
   * How to handle stderr of the child process. This matches the semantics of Node's `child_process.spawn`.
   *
   * The default is "inherit", meaning messages to stderr will be printed to the parent process's stderr.
   */
  stderr?: IOType | Stream | number;
  /**
   * The working directory to use when spawning the process.
   *
   * If not specified, the current working directory will be inherited.
   */
  cwd?: string;
};

// from '@modelcontextprotocol/sdk/client/streamableHttp.js'
export type StreamableHTTPClientTransportOptions = {
  /**
   * An OAuth client provider to use for authentication.
   *
   * When an `authProvider` is specified and the connection is started:
   * 1. The connection is attempted with any existing access token from the `authProvider`.
   * 2. If the access token has expired, the `authProvider` is used to refresh the token.
   * 3. If token refresh fails or no access token exists, and auth is required, `OAuthClientProvider.redirectToAuthorization` is called, and an `UnauthorizedError` will be thrown from `connect`/`start`.
   *
   * After the user has finished authorizing via their user agent, and is redirected back to the MCP client application, call `StreamableHTTPClientTransport.finishAuth` with the authorization code before retrying the connection.
   *
   * If an `authProvider` is not provided, and auth is required, an `UnauthorizedError` will be thrown.
   *
   * `UnauthorizedError` might also be thrown when sending any message over the transport, indicating that the session has expired, and needs to be re-authed and reconnected.
   */
  authProvider?: OAuthClientProvider;
  /**
   * Customizes HTTP requests to the server.
   */
  requestInit?: RequestInit;
  /**
   * Custom fetch implementation used for all network requests.
   */
  fetch?: FetchLike;
  /**
   * Options to configure the reconnection behavior.
   */
  reconnectionOptions?: StreamableHTTPReconnectionOptions;
  /**
   * Session ID for the connection. This is used to identify the session on the server.
   * When not provided and connecting to a server that supports session IDs, the server will generate a new session ID.
   */
  sessionId?: string;
};
```

## MCP Client (Single Server)

For scenarios where you only need to connect to a single MCP server, or prefer to manage client instances individually, you can use `createMcpClient`.

```ts
import { googleAI } from '@genkit-ai/googleai';
import { createMcpClient } from '@genkit-ai/mcp';
import { genkit } from 'genkit';

const myFsClient = createMcpClient({
  name: 'myFileSystemClient', // A unique name for this client instance
  mcpServer: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
  },
  // rawToolResponses: true, // Optional: get raw MCP responses
});

// In your Genkit configuration:
const ai = genkit({
  plugins: [googleAI()],
});

(async () => {
  await myFsClient.ready();

  // Retrieve tools from this specific client
  const fsTools = await myFsClient.getActiveTools(ai);

  const { text } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'), // Replace with your model
    prompt: 'List files in ' + process.cwd(),
    tools: fsTools,
  });
  console.log(text);

  await myFsClient.disable();
})();
```

### `createMcpClient()` Options

The `createMcpClient` function takes an `McpClientOptions` object:
-   **`name`**: (required, string) A unique name for this client instance. This name will be used as the namespace for its tools and prompts.
-   **`version`**: (optional, string) Version for this client instance. Defaults to "1.0.0".
-   Additionally, it supports all options from `McpServerConfig` (e.g., `disabled`, `rawToolResponses`, and transport configurations), as detailed in the `createMcpHost` options section.

### Using MCP Actions (Tools, Prompts)

Both `GenkitMcpHost` (via `getActiveTools()`) and `GenkitMcpClient` (via `getActiveTools()`) discover available tools from their connected and enabled MCP server(s). These tools are standard Genkit `ToolAction` instances and can be provided to Genkit models.

MCP prompts can be fetched using `McpHost.getPrompt(serverName, promptName)` or `mcpClient.getPrompt(promptName)`. These return an `ExecutablePrompt`.

All MCP actions (tools, prompts, resources) are namespaced.
- For `createMcpHost`, the namespace is the key you provide for that server in the `mcpServers` configuration (e.g., `localFs/read_file`).
- For `createMcpClient`, the namespace is the `name` you provide in its options (e.g., `myFileSystemClient/list_resources`).

### Tool Responses

MCP tools return a `content` array as opposed to a structured response like most Genkit tools. The Genkit MCP plugin attempts to parse and coerce returned content:

1. If the content is text and valid JSON, it is parsed and returned as a JSON object.
2. If the content is text but not valid JSON, the raw text is returned.
3. If the content contains a single non-text part (e.g., an image), that part is returned directly.
4. If the content contains multiple or mixed parts (e.g., text and an image), the full content response array is returned.

## MCP Server

You can also expose all of the tools and prompts from a Genkit instance as an MCP server using the `createMcpServer` function.

```ts
import { googleAI } from '@genkit-ai/googleai';
import { createMcpServer } from '@genkit-ai/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { genkit, z } from 'genkit/beta';

const ai = genkit({
  plugins: [googleAI()],
});

ai.defineTool(
  {
    name: 'add',
    description: 'add two numbers together',
    inputSchema: z.object({ a: z.number(), b: z.number() }),
    outputSchema: z.number(),
  },
  async ({ a, b }) => {
    return a + b;
  }
);

ai.definePrompt(
  {
    name: 'happy',
    description: 'everybody together now',
    input: {
      schema: z.object({
        action: z.string().default('clap your hands').optional(),
      }),
    },
  },
  `If you're happy and you know it, {{action}}.`
);

ai.defineResource(
  {
    name: 'my resouces',
    uri: 'my://resource',
  },
  async () => {
    return {
      content: [
        {
          text: 'my resource',
        },
      ],
    };
  }
);

ai.defineResource(
  {
    name: 'file',
    template: 'file://{path}',
  },
  async ({ uri }) => {
    return {
      content: [
        {
          text: `file contents for ${uri}`,
        },
      ],
    };
  }
);

// Use createMcpServer
const server = createMcpServer(ai, {
  name: 'example_server',
  version: '0.0.1',
});
// Setup (async) then starts with stdio transport by default
server.setup().then(async () => {
  await server.start();
  const transport = new StdioServerTransport();
  await server!.server?.connect(transport);
});
```

The `createMcpServer` function returns a `GenkitMcpServer` instance. The `start()` method on this instance will start an MCP server (using the stdio transport by default) that exposes all registered Genkit tools and prompts. To start the server with a different MCP transport, you can pass the transport instance to the `start()` method (e.g., `server.start(customMcpTransport)`).

### `createMcpServer()` Options
- **`name`**: (required, string) The name you want to give your server for MCP inspection.
- **`version`**: (optional, string) The version your server will advertise to clients. Defaults to "1.0.0".

### Known Limitations

- MCP prompts are only able to take string parameters, so inputs to schemas must be objects with only string property values.
- MCP prompts only support `user` and `model` messages. `system` messages are not supported.
- MCP prompts only support a single "type" within a message so you can't mix media and text in the same message.

### Testing your MCP server

You can test your MCP server using the official inspector. For example, if your server code compiled into `dist/index.js`, you could run:

    npx @modelcontextprotocol/inspector dist/index.js

Once you start the inspector, you can list prompts and actions and test them out manually.
