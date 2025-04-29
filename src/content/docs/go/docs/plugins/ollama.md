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
ollama pull gemma:2b # Example: pulling gemma 2b model
```

For development, you can run Ollama on your development machine. Deployed apps
usually run Ollama on a GPU-accelerated machine that is different from the one
hosting the app backend running Genkit.

## Configuration

To use this plugin, pass `ollama.Ollama` to `WithPlugins()` in the Genkit
initializer, specifying the address of your Ollama server:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/ollama"
)

func main() {
	ctx := context.Background()
	// Example initialization
	g, err := genkit.Init(ctx, genkit.WithPlugins(&ollama.Ollama{ServerAddress: "http://127.0.0.1:11434"}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}
	log.Println("Genkit initialized with Ollama plugin.")
	// ... rest of application logic ...
}
```

## Usage

To generate content, you first need to create a model definition based on the
model you installed and want to use. For example, if you installed Gemma 2b:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/ollama"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&ollama.Ollama{ServerAddress: "http://127.0.0.1:11434"}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	// Define the Ollama model you want to use
	model := ollama.DefineModel(g, // Pass the genkit instance 'g'
		ollama.ModelDefinition{
			Name: "gemma:2b", // Match the model name pulled via `ollama pull`
			Type: "generate", // Use "generate" for text completion, "chat" for chat models
		},
		// Provide ModelInfo about the model's capabilities
		&ai.ModelInfo{
			Label: "Ollama Gemma 2b", // User-friendly label
			Supports: &ai.ModelSupports{
				// Adjust these based on the specific Ollama model's capabilities
				Multiturn:  false, // Gemma 2b base model might not be chat-tuned
				SystemRole: false,
				Tools:      false,
				Media:      false,
			},
		},
	)
	if model == nil {
		log.Fatal("Failed to define Ollama model")
	}
	log.Println("Ollama model defined:", model.Name())

	// Now you can use the 'model' reference
	resp, err := genkit.Generate(ctx, g, ai.WithModel(model), ai.WithPrompt("Tell me a joke."))
	if err != nil {
		log.Fatalf("Generate failed: %v", err)
	}

	log.Println(resp.Text())
}

```

Then, you can use the model reference to send requests to your Ollama server:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/ollama"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&ollama.Ollama{ServerAddress: "http://127.0.0.1:11434"}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	// Assume 'model' is defined as in the previous example
	model := ollama.DefineModel(g,
		ollama.ModelDefinition{Name: "gemma:2b", Type: "generate"},
		&ai.ModelInfo{Supports: &ai.ModelSupports{}}, // Simplified ModelInfo for brevity
	)
	if model == nil {
		log.Fatal("Failed to define Ollama model")
	}

	resp, err := genkit.Generate(ctx, g, ai.WithModel(model), ai.WithPrompt("Tell me a joke."))
	if err != nil {
		log.Fatalf("Generate failed: %v", err) // Corrected error handling
	}

	log.Println(resp.Text())
}
```

See [Generating content](../models.md) for more information.
