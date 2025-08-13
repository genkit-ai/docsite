---
title: MCP Toolbox for Databases
description: This document introduces the MCP Toolbox for Databases, an open-source MCP server designed for enterprise-grade database tool development, and explains its integration with Genkit applications.
---

[MCP Toolbox for Databases](https://github.com/googleapis/genai-toolbox) is an open source MCP server for databases. It was designed with enterprise-grade and production-quality in mind. It enables you to develop tools easier, faster, and more securely by handling the complexities such as connection pooling, authentication, and more.

Toolbox Tools can be seemlessly integrated with Genkit applications. For more
information on [getting
started](https://googleapis.github.io/genai-toolbox/getting-started/) or
[configuring](https://googleapis.github.io/genai-toolbox/getting-started/configure/)
Toolbox, see the
[documentation](https://googleapis.github.io/genai-toolbox/getting-started/introduction/).

![architecture](./assets/mcp_db_toolbox.png)

### Configure and deploy

Toolbox is an open source server that you deploy and manage yourself. For more
instructions on deploying and configuring, see the official Toolbox
documentation:

* [Installing the Server](https://googleapis.github.io/genai-toolbox/getting-started/introduction/#installing-the-server)
* [Configuring Toolbox](https://googleapis.github.io/genai-toolbox/getting-started/configure/)

### Install client SDK

Genkit relies on the `@toolbox-sdk/core` node package to use Toolbox. Install the
package before getting started:

```shell
npm install @toolbox-sdk/core
```

### Loading Toolbox Tools

Once you’re Toolbox server is configured and up and running, you can load tools
from your server using ADK:

```javascript
import {ToolboxClient} from '@toolbox-sdk/core';
import { genkit, z } from 'genkit';

const ai = genkit({
   plugins: [googleAI()],
   model: googleAI.model('gemini-1.5-pro'),
});

// Replace with your Toolbox Server URL
const URL = 'https://127.0.0.1:5000';

let client = ToolboxClient(URL);
toolboxTools = await client.loadToolset('toolsetName');

const getGenkitTool = (toolboxTool) => ai.defineTool({
   name: toolboxTool.getName(),
   description: toolboxTool.getDescription(),
   inputSchema: toolboxTool.getParams(),
},
toolboxTool,
);

const tools = toolboxTools.map(getGenkitTool);

await ai.generate({
   prompt: 'Ask some question.',
   tools: tools,
});
```

### Advanced Toolbox Features

Toolbox has a variety of features to make developing Gen AI tools for databases.
For more information, read more about the following features:

* [Authenticated Parameters](https://googleapis.github.io/genai-toolbox/resources/tools/#authenticated-parameters): bind tool inputs to values from OIDC tokens automatically, making it easy to run sensitive queries without potentially leaking data
* [Authorized Invocations:](https://googleapis.github.io/genai-toolbox/resources/tools/#authorized-invocations)  restrict access to use a tool based on the users Auth token
* [OpenTelemetry](https://googleapis.github.io/genai-toolbox/how-to/export_telemetry/): get metrics and tracing from Toolbox with OpenTelemetry
