---
title: Ollama plugin
description: Learn how to configure and use the Genkit Ollama plugin for Go to interact with local LLMs like Gemma and Llama.
---

The Ollama plugin provides interfaces to any of the local LLMs supported by
[Ollama](https://ollama.com/).

## Prerequisites

This plugin requires that you first install and run the Ollama server. You can
follow the instructions on the [Download Ollama](https://ollama.com/download)
page.

Use the Ollama CLI to download the models you are interested in. For example:

```bash
ollama pull gemma3
```

For development, you can run Ollama on your development machine. Deployed apps
usually run Ollama on a GPU-accelerated machine that is different from the one
hosting the app backend running Genkit.

## Configuration

To use this plugin, pass `ollama.Ollama` to `WithPlugins()` in the Genkit
initializer, specifying the address of your Ollama server:

```go
import "github.com/firebase/genkit/go/plugins/ollama"
```

```go
g, err := genkit.Init(context.Background(), genkit.WithPlugins(&ollama.Ollama{ServerAddress: "http://127.0.0.1:11434"}))
```

## Usage

To generate content, you first need to create a model definition based on the
model you installed and want to use. For example, if you installed Gemma 2:

```go
model := ollama.DefineModel(
    ollama.ModelDefinition{
        Name: "gemma3",
        Type: "chat", // "chat" or "generate"
    },
    &ai.ModelInfo{
        Multiturn:  true,
        SystemRole: true,
        Tools:      false,
        Media:      false,
    },
)
```

Then, you can use the model reference to send requests to your Ollama server:

```go
resp, err := genkit.Generate(ctx, g, ai.WithModel(model), ai.WithPrompt("Tell me a joke."))
if err != nil {
    return err
}

log.Println(resp.Text())
```

See [Generating content](/go/docs/models) for more information.
