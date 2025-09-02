---
title: Pinecone plugin
description: Learn how to configure and use the Genkit Pinecone plugin for Go to integrate with the Pinecone cloud vector database.
---

The Pinecone plugin provides retriever implementatons that use the
[Pinecone](https://www.pinecone.io/) cloud vector database.

## Configuration

To use this plugin, import the `pinecone` package and call `pinecone.Init()`:

```go
import "github.com/firebase/genkit/go/plugins/pinecone"
```

```go
if err := (&pinecone.Pinecone{}).Init(ctx, g); err != nil {
	return err
}
```

The plugin requires your Pinecone API key.
Configure the plugin to use your API key by doing one of the following:

- Set the `PINECONE_API_KEY` environment variable to your API key.

- Specify the API key when you initialize the plugin:

  ```go
  if err := (&pinecone.Pinecone{APIKey: pineconeAPIKey}).Init(ctx, g); err != nil {
  return err
  }
  ```

  However, don't embed your API key directly in code! Use this feature only
  in conjunction with a service like Cloud Secret Manager or similar.

## Usage

Index your documents in pinecone. An example of indexing is provided within the Pinecone plugin as shown below. This functionality should be customized by the user according to their use case.

```go
err = pinecone.Index(ctx, docChunks, ds, "")
if err != nil {
	return err
}
```

To retrieve documents from an index, first create a retriever
definition:

```go
menuRetriever, err := pinecone.DefineRetriever(ctx, g, pinecone.Config{
	IndexID:  "menu_data",                                           // Your Pinecone index
	Embedder: googlegenai.GoogleAIEmbedder(g, "text-embedding-004"), // Embedding model of your choice
})
if err != nil {
	return err
}
```

Then, call the retriever's `Retrieve()` method, passing it a text query:

```go
resp, err := menuRetriever.Retrieve(ctx, &ai.RetrieverRequest{
	Query:   ai.DocumentFromText(userInput, nil),
	Options: nil,
})
if err != nil {
	return err
}
menuInfo := resp.Documents
```

See the [Retrieval-augmented generation](/go/docs/rag) page for a general
discussion on using retrievers for RAG.
