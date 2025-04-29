---
title: Pinecone plugin
description: Learn how to configure and use the Genkit Pinecone plugin for Go to integrate with the Pinecone cloud vector database.
---

The Pinecone plugin provides indexer and retriever implementatons that use the
[Pinecone](https://www.pinecone.io/) cloud vector database.

## Configuration

To use this plugin, import the `pinecone` package and call `pinecone.Init()`:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/plugins/pinecone"
)

func main() {
	ctx := context.Background()
	// Example initialization
	err := pinecone.Init(ctx, &pinecone.Config{
		// APIKey can be set via PINECONE_API_KEY env var or here
		// APIKey: "YOUR_PINECONE_API_KEY",
	})
	if err != nil {
		log.Fatalf("Pinecone init failed: %v", err)
	}
	log.Println("Pinecone plugin initialized.")
	// ... rest of application logic ...
}

```

The plugin requires your Pinecone API key.
Configure the plugin to use your API key by doing one of the following:

- Set the `PINECONE_API_KEY` environment variable to your API key.

- Specify the API key when you initialize the plugin:

  ```go
  package main

  import (
  	"context"
  	"log"

  	"github.com/firebase/genkit/go/plugins/pinecone"
  )

  func main() {
  	ctx := context.Background()
  	// Example initialization with API key
  	err := pinecone.Init(ctx, &pinecone.Config{
  		APIKey: "YOUR_PINECONE_API_KEY", // Replace with your key or env var logic
  	})
  	if err != nil {
  		log.Fatalf("Pinecone init failed: %v", err)
  	}
  	log.Println("Pinecone plugin initialized with API key.")
  	// ... rest of application logic ...
  }
  ```

  However, don't embed your API key directly in code! Use this feature only
  in conjunction with a service like Cloud Secret Manager or similar.

## Usage

To add documents to a Pinecone index, first create an index definition that
specifies the name of the index and the embedding model you're using:

```go
// TODO: Include code from github.com/firebase/genkit/go/internal/doc-snippets/pinecone.go region_tag="defineindex"
```

You can also optionally specify the key that Pinecone uses for document data
(`_content`, by default).

Then, call the index's `Index()` method, passing it a list of the documents you
want to add:

```go
// TODO: Include code from github.com/firebase/genkit/go/internal/doc-snippets/pinecone.go region_tag="index"
```

Similarly, to retrieve documents from an index, first create a retriever
definition:

```go
// TODO: Include code from github.com/firebase/genkit/go/internal/doc-snippets/pinecone.go region_tag="defineretriever"
```

Then, call the retriever's `Retrieve()` method, passing it a text query:

```go
// TODO: Include code from github.com/firebase/genkit/go/internal/doc-snippets/pinecone.go region_tag="retrieve"
```

See the [Retrieval-augmented generation](../rag.md) page for a general
discussion on using indexers and retrievers for RAG.
