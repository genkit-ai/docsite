---
title: Genkit Developer Tools
description: Explore Genkit's developer tools, including the Node.js CLI for command-line operations and the local web-based Developer UI for interactive testing and development.
---

Genkit provides two key developer tools:

- A Node.js CLI for command-line operations
- An optional local web app, called the Developer UI, that interfaces with your
  Genkit configuration for interactive testing and development

### Command Line Interface (CLI)

Install the CLI globally using:

```bash
npm install -g genkit-cli
```

The CLI supports various commands to facilitate working with Genkit projects:

- `genkit start -- <command to run your code>`: Start the developer UI and
  connect it to a running code process.
- `genkit flow:run <flowName>`: Run a specified flow. Your runtime must already
  be running in a separate terminal with the `GENKIT_ENV=dev` environment
  variable set.
- `genkit eval:flow <flowName>`: Evaluate a specific flow. Your runtime must
  already be running in a separate terminal with the `GENKIT_ENV=dev` environment
  variable set.

For a full list of commands, use:

```bash
genkit --help
```

### Genkit Developer UI

The Genkit Developer UI is a local web app that lets you interactively
work with models, flows, prompts, and other elements in your Genkit project.

The Developer UI is able to identify what Genkit components you have defined
in your code by attaching to a running code process.

To start the UI, run the following command:

```bash
genkit start -- <command to run your code>
```

The `<command to run your code>` will vary based on your project's setup and
the file you want to execute. Here are some examples:

```bash
# Running a typical development server
genkit start -- npm run dev

# Running a TypeScript file directly
genkit start -- npx tsx --watch src/index.ts

# Running a JavaScript file directly
genkit start -- node --watch src/index.js
```

Including the `--watch` option will enable the Developer UI to notice and
reflect saved changes to your code without needing to restart it.

After running the command, you will get an output like the following:

```bash
Telemetry API running on http://localhost:4033
Genkit Developer UI: http://localhost:4000
```

Open the local host address for the Genkit Developer UI in your browser to
view it. You can also open it in the VS Code simple browser to view it
alongside your code.

Alternatively, you can use add the `-o` option to the start command to
automatically open the Developer UI in your default browser tab.

```
genkit start -o -- <command to run your code>
```

![Genkit Developer UI](../../../assets/dev_ui/genkit_dev_ui_home.png)

The Developer UI has action runners for `flow`, `prompt`, `model`, `tool`,
`retriever`, `indexer`, `embedder` and `evaluator` based on the components
you have defined in your code.

Here's a quick gif tour with cats.

![Genkit Developer UI Overview](/genkit_developer_ui_overview.gif)

### Analytics

The Genkit CLI and Developer UI use cookies and similar technologies from Google
to deliver and enhance the quality of its services and to analyze usage.
[Learn more](https://policies.google.com/technologies/cookies).

To opt-out of analytics, you can run the following command:

```bash
genkit config set analyticsOptOut true
```

You can view the current setting by running:

```bash
genkit config get analyticsOptOut
```
