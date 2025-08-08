---
title: OpenAI-Compatible API plugin
description: Learn how to use the Genkit OpenAI-Compatible plugin for Go to access OpenAI, Anthropic, and other OpenAI-compatible APIs.
---

The OpenAI-Compatible API plugin (`compat_oai`) provides a unified interface for accessing multiple AI providers that implement OpenAI's API specification. This includes OpenAI, Anthropic, and other compatible services.

## Overview

The `compat_oai` package serves as a foundation for building plugins that work with OpenAI-compatible APIs. It includes:

- **Base Implementation**: Common functionality for OpenAI-compatible APIs
- **OpenAI Plugin**: Direct access to OpenAI's models and embeddings
- **Anthropic Plugin**: Access to Claude models through OpenAI-compatible endpoints
- **Extensible Framework**: Build custom plugins for other compatible providers

## Prerequisites

Depending on which provider you use, you'll need:

- **OpenAI**: API key from [OpenAI API Keys page](https://platform.openai.com/api-keys)
- **Anthropic**: API key from [Anthropic Console](https://console.anthropic.com/)
- **Other providers**: API keys from the respective services

## OpenAI Provider

### Configuration

```go
import "github.com/firebase/genkit/go/plugins/compat_oai/openai"
```

```go
g, err := genkit.Init(context.Background(), genkit.WithPlugins(&openai.OpenAI{
    APIKey: "YOUR_OPENAI_API_KEY", // or set OPENAI_API_KEY env var
}))
```

### Supported Models

#### Latest Models
- **gpt-5** - Latest GPT-5 with multimodal support
- **gpt-5-mini** - Faster, cost-effective GPT-5 variant
- **gpt-5-nano** - Ultra-efficient GPT-5 variant

#### Production Models
- **gpt-4.1** - Latest GPT-4.1 with multimodal support
- **gpt-4.1-mini** - Faster, cost-effective GPT-4.1 variant
- **gpt-4.1-nano** - Ultra-efficient GPT-4.1 variant
- **gpt-4o** - Advanced GPT-4 with vision and tool support
- **gpt-4o-mini** - Fast and cost-effective GPT-4o variant

#### Reasoning Models
- **o3-mini** - Latest compact reasoning model
- **o1** - Advanced reasoning model for complex problems
- **o1-mini** - Compact reasoning model
- **o1-preview** - Preview reasoning model

#### Legacy Models
- **gpt-4** - Original GPT-4 model
- **gpt-4-turbo** - High-performance GPT-4 with large context window
- **gpt-3.5-turbo** - Fast and efficient language model

### Embedding Models
- **text-embedding-3-large** - Most capable embedding model
- **text-embedding-3-small** - Fast and efficient embedding model  
- **text-embedding-ada-002** - Legacy embedding model

### OpenAI Usage Example

```go
import (
    "github.com/firebase/genkit/go/plugins/compat_oai/openai"
    "github.com/firebase/genkit/go/plugins/compat_oai"
)

// Initialize OpenAI plugin
oai := &openai.OpenAI{APIKey: "YOUR_API_KEY"}
g, err := genkit.Init(ctx, genkit.WithPlugins(oai))

// Use GPT-4o for general tasks
model := oai.Model(g, "gpt-4o")
resp, err := genkit.Generate(ctx, g, 
    ai.WithModel(model), 
    ai.WithPrompt("Explain quantum computing."),
)

// Use embeddings
embedder := oai.Embedder(g, "text-embedding-3-large")
embeds, err := ai.Embed(ctx, embedder, ai.WithDocs("Hello, world!"))
```

## Anthropic Provider

### Configuration

```go
import "github.com/firebase/genkit/go/plugins/compat_oai/anthropic"
```

```go
g, err := genkit.Init(context.Background(), genkit.WithPlugins(&anthropic.Anthropic{
    Opts: []option.RequestOption{
        option.WithAPIKey("YOUR_ANTHROPIC_API_KEY"),
    },
}))
```

### Supported Models

- **claude-3-7-sonnet-20250219** - Latest Claude 3.7 Sonnet with advanced capabilities
- **claude-3-5-haiku-20241022** - Fast and efficient Claude 3.5 Haiku
- **claude-3-5-sonnet-20240620** - Balanced Claude 3.5 Sonnet
- **claude-3-opus-20240229** - Most capable Claude 3 model
- **claude-3-haiku-20240307** - Fastest Claude 3 model

### Anthropic Usage Example

```go
import (
    "github.com/firebase/genkit/go/plugins/compat_oai/anthropic"
    "github.com/openai/openai-go/option"
)

// Initialize Anthropic plugin
claude := &anthropic.Anthropic{
    Opts: []option.RequestOption{
        option.WithAPIKey("YOUR_ANTHROPIC_API_KEY"),
    },
}
g, err := genkit.Init(ctx, genkit.WithPlugins(claude))

// Use Claude for tasks requiring reasoning
model := claude.Model(g, "claude-3-7-sonnet-20250219")
resp, err := genkit.Generate(ctx, g,
    ai.WithModel(model),
    ai.WithPrompt("Analyze this complex problem step by step."),
)
```

## Using Multiple Providers

You can use both providers in the same application:

```go
import (
    "github.com/firebase/genkit/go/plugins/compat_oai/openai"
    "github.com/firebase/genkit/go/plugins/compat_oai/anthropic"
)

oai := &openai.OpenAI{APIKey: "YOUR_OPENAI_KEY"}
claude := &anthropic.Anthropic{
    Opts: []option.RequestOption{
        option.WithAPIKey("YOUR_ANTHROPIC_KEY"),
    },
}

g, err := genkit.Init(ctx, genkit.WithPlugins(oai, claude))

// Use OpenAI for embeddings and tool-heavy tasks
openaiModel := oai.Model(g, "gpt-4o")
embedder := oai.Embedder(g, "text-embedding-3-large")

// Use Anthropic for reasoning and analysis
claudeModel := claude.Model(g, "claude-3-7-sonnet-20250219")
```

## Advanced Features

### Tool Calling

OpenAI models support tool calling:

```go
// Define a tool
weatherTool := genkit.DefineTool(g, "get_weather", "Get current weather",
    func(ctx *ai.ToolContext, input struct{City string}) (string, error) {
        return fmt.Sprintf("It's sunny in %s", input.City), nil
    })

// Use with GPT models (tools not supported on Claude via OpenAI API)
model := oai.Model(g, "gpt-4o")
resp, err := genkit.Generate(ctx, g,
    ai.WithModel(model),
    ai.WithPrompt("What's the weather like in San Francisco?"),
    ai.WithTools(weatherTool),
)
```

### Multimodal Support

Both providers support vision capabilities:

```go
// Works with GPT-4o and Claude models
resp, err := genkit.Generate(ctx, g,
    ai.WithModel(model),
    ai.WithMessages([]*ai.Message{
        ai.NewUserMessage(
            ai.WithTextPart("What do you see in this image?"),
            ai.WithMediaPart("image/jpeg", imageData),
        ),
    }),
)
```

### Streaming

Both providers support streaming responses:

```go
resp, err := genkit.Generate(ctx, g,
    ai.WithModel(model),
    ai.WithPrompt("Write a long explanation."),
    ai.WithStreaming(func(ctx context.Context, chunk *ai.ModelResponseChunk) error {
        for _, content := range chunk.Content {
            fmt.Print(content.Text)
        }
        return nil
    }),
)
```

## Configuration

### Common Configuration

Both providers support OpenAI-compatible configuration:

```go
import "github.com/firebase/genkit/go/plugins/compat_oai"

config := &compat_oai.OpenAIConfig{
    Temperature:     0.7,
    MaxOutputTokens: 1000,
    TopP:            0.9,
    StopSequences:   []string{"END"},
}

resp, err := genkit.Generate(ctx, g,
    ai.WithModel(model),
    ai.WithPrompt("Your prompt here"),
    ai.WithConfig(config),
)
```

### Advanced Options

```go
import "github.com/openai/openai-go/option"

// Custom base URL for OpenAI-compatible services
opts := []option.RequestOption{
    option.WithAPIKey("YOUR_API_KEY"),
    option.WithBaseURL("https://your-custom-endpoint.com/v1"),
    option.WithOrganization("your-org-id"),
    option.WithHeader("Custom-Header", "value"),
}
```

