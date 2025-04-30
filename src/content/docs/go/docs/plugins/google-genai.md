---
title: Google Generative AI plugin
description: Learn how to configure and use the Genkit Google Generative AI plugin for Go to access Gemini models via the Gemini API or Vertex AI API.
---

The Google Generative AI plugin provides interfaces to Google's Gemini models
through either the [Gemini API](https://ai.google.dev/docs/gemini_api_overview)
or the [Vertex AI API](https://cloud.google.com/vertex-ai/generative-ai/docs/).

## Configuration

The configuration depends on which provider you choose:

### Google AI

To use this plugin, import the `googlegenai` package and pass
`googlegenai.GoogleAI` to `WithPlugins()` in the Genkit initializer:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	// Example initialization
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}
	log.Println("Genkit initialized with GoogleAI plugin.")
	// ... rest of application logic ...
}
```

The plugin requires an API key for the Gemini API, which you can get from
[Google AI Studio](https://aistudio.google.com/app/apikey).

Configure the plugin to use your API key by doing one of the following:

- Set the `GEMINI_API_KEY` environment variable to your API key.

- Specify the API key when you initialize the plugin:

  ```go
  package main

  import (
  	"context"
  	"log"

  	"github.com/firebase/genkit/go/genkit"
  	"github.com/firebase/genkit/go/plugins/googlegenai"
  )

  func main() {
  	ctx := context.Background()
  	// Example initialization with API key
  	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{APIKey: "YOUR_API_KEY"})) // Replace with your key or env var logic
  	if err != nil {
  		log.Fatalf("Genkit init failed: %v", err)
  	}
  	log.Println("Genkit initialized with GoogleAI plugin (API Key provided).")
  	// ... rest of application logic ...
  }
  ```

  However, don't embed your API key directly in code! Use this feature only
  in conjunction with a service like Cloud Secret Manager or similar.

### Vertex AI

To use this plugin, import the `googlegenai` package and pass
`googlegenai.VertexAI` to `WithPlugins()` in the Genkit initializer:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	// Example initialization
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.VertexAI{}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}
	log.Println("Genkit initialized with VertexAI plugin.")
	// ... rest of application logic ...
}

```

The plugin requires you to specify your Google Cloud project ID, the
[region](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations)
to which you want to make Vertex API requests, and your Google Cloud project
credentials.

- By default, `googlegenai.VertexAI` gets your Google Cloud project ID from the
  `GOOGLE_CLOUD_PROJECT` environment variable.

  You can also pass this value directly:

  ```go
  package main

  import (
  	"context"
  	"log"

  	"github.com/firebase/genkit/go/genkit"
  	"github.com/firebase/genkit/go/plugins/googlegenai"
  )

  func main() {
  	ctx := context.Background()
  	// Example initialization with Project ID
  	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.VertexAI{ProjectID: "my-project-id"}))
  	if err != nil {
  		log.Fatalf("Genkit init failed: %v", err)
  	}
  	log.Println("Genkit initialized with VertexAI plugin (ProjectID provided).")
  	// ... rest of application logic ...
  }
  ```

- By default, `googlegenai.VertexAI` gets the Vertex AI API location from the
  `GOOGLE_CLOUD_LOCATION` environment variable.

  You can also pass this value directly:

  ```go
  package main

  import (
  	"context"
  	"log"

  	"github.com/firebase/genkit/go/genkit"
  	"github.com/firebase/genkit/go/plugins/googlegenai"
  )

  func main() {
  	ctx := context.Background()
  	// Example initialization with Location
  	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.VertexAI{Location: "us-central1"}))
  	if err != nil {
  		log.Fatalf("Genkit init failed: %v", err)
  	}
  	log.Println("Genkit initialized with VertexAI plugin (Location provided).")
  	// ... rest of application logic ...
  }
  ```

- To provide API credentials, you need to set up Google Cloud Application
  Default Credentials.

  1.  To specify your credentials:

      - If you're running your flow from a Google Cloud environment (Cloud
        Functions, Cloud Run, and so on), this is set automatically.

      - On your local dev environment, do this by running:

        ```bash
        gcloud auth application-default login
        ```

      - For other environments, see the [Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc)
        docs.

  2.  In addition, make sure the account is granted the Vertex AI User IAM role
      (`roles/aiplatform.user`). See the Vertex AI [access control](https://cloud.google.com/vertex-ai/generative-ai/docs/access-control)
      docs.

## Usage

### Generative models

To get a reference to a supported model, specify its identifier to
either `googlegenai.GoogleAIModel` or `googlegenai.VertexAIModel`:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	model := googlegenai.GoogleAIModel(g, "gemini-1.5-flash") // Updated model name
	if model == nil {
		log.Fatal("Model gemini-1.5-flash not found for GoogleAI")
	}
	log.Println("Model reference obtained:", model.Name())
	// Use the model...
}
```

Alternatively, you may create a `ModelRef` which pairs the model name with its
config:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	modelRef := googlegenai.GoogleAIModelRef("gemini-1.5-flash", &googlegenai.GeminiConfig{ // Updated model name
		Temperature:     0.5,
		MaxOutputTokens: 500,
		// Other configuration...
	})

	resp, err := genkit.Generate(ctx, g, ai.WithModel(modelRef), ai.WithPrompt("Tell me a joke."))
	if err != nil {
		log.Fatalf("Generate failed: %v", err)
	}

	log.Println(resp.Text())
}
```

The following models are supported: `gemini-1.5-pro`, `gemini-1.5-flash`,
`gemini-1.0-pro`, and other experimental models. Check the Google AI and Vertex AI documentation for the latest list.

Model references have a `Generate()` method that calls the Google API:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	modelRef := googlegenai.GoogleAIModelRef("gemini-1.5-flash", nil) // Config can be nil for defaults

	resp, err := genkit.Generate(ctx, g, ai.WithModel(modelRef), ai.WithPrompt("Tell me a joke."))
	if err != nil {
		log.Fatalf("Generate failed: %v", err) // Corrected error handling
	}

	log.Println(resp.Text())
}
```

See [Generating content with AI models](../models.md) for more information.

### Embedding models

To get a reference to a supported embedding model, specify its identifier to
either `googlegenai.GoogleAIEmbedder` or `googlegenai.VertexAIEmbedder`:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	embeddingModel := googlegenai.GoogleAIEmbedder(g, "text-embedding-004")
	if embeddingModel == nil {
		log.Fatal("Embedder text-embedding-004 not found for GoogleAI")
	}
	log.Println("Embedder reference obtained:", embeddingModel.Name())

	// Example usage
	userInput := "This is the text to embed."
	resp, err := ai.Embed(ctx, embeddingModel, ai.WithText(userInput))
	if err != nil {
		log.Fatalf("Embedding failed: %v", err)
	}
	log.Printf("Generated %d embeddings.\n", len(resp.Embeddings))
}
```

The following models are supported:

-   **Google AI**

    `text-embedding-004` and `embedding-001`

-   **Vertex AI**

    `textembedding-gecko@003`, `textembedding-gecko@002`,
    `textembedding-gecko@001`, `text-embedding-004`,
    `textembedding-gecko-multilingual@001`, `text-multilingual-embedding-002`,
    and `multimodalembedding`

Embedder references have an `Embed()` method that calls the Google AI API:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}
	embeddingModel := googlegenai.GoogleAIEmbedder(g, "text-embedding-004")
	if embeddingModel == nil {
		log.Fatal("Embedder not found")
	}

	userInput := "Embed this text."
	resp, err := ai.Embed(ctx, embeddingModel, ai.WithText(userInput))
	if err != nil {
		log.Fatalf("Embedding failed: %v", err) // Corrected error handling
	}
	log.Printf("Generated %d embeddings.\n", len(resp.Embeddings))
}
```

You can also pass an Embedder to an indexer's `Index()` method and a retriever's
`Retrieve()` method:

```go
// Assuming myIndexer and myRetriever are defined elsewhere
// and docsToIndex and userInput are available

// Indexing example (conceptual)
// if err := ai.Index(ctx, myIndexer, ai.WithDocs(docsToIndex...)); err != nil {
//	  log.Fatalf("Indexing failed: %v", err) // Corrected error handling
// }

// Retrieval example (conceptual)
// resp, err := ai.Retrieve(ctx, myRetriever, ai.WithText(userInput)) // Use ai.WithText for query
// if err != nil {
//	  log.Fatalf("Retrieval failed: %v", err) // Corrected error handling
// }
```

See [Retrieval-augmented generation (RAG)](../rag.md) for more information.
