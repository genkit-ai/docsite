---
title: Retrieval-augmented generation (RAG)
description: Learn how to build Retrieval-Augmented Generation (RAG) flows in Genkit Go using indexers, embedders, and retrievers.
---

Genkit provides abstractions that help you build retrieval-augmented generation
(RAG) flows, as well as plugins that provide integrations with related tools.

## What is RAG?

Retrieval-augmented generation is a technique used to incorporate external
sources of information into an LLM’s responses. It's important to be able to do
so because, while LLMs are typically trained on a broad body of
material, practical use of LLMs often requires specific domain knowledge (for
example, you might want to use an LLM to answer customers' questions about your
company’s products).

One solution is to fine-tune the model using more specific data. However, this
can be expensive both in terms of compute cost and in terms of the effort needed
to prepare adequate training data.

In contrast, RAG works by incorporating external data sources into a prompt at
the time it's passed to the model. For example, you could imagine the prompt,
"What is Bart's relationship to Lisa?" might be expanded ("augmented") by
prepending some relevant information, resulting in the prompt, "Homer and
Marge's children are named Bart, Lisa, and Maggie. What is Bart's relationship
to Lisa?"

This approach has several advantages:

- It can be more cost effective because you don't have to retrain the model.
- You can continuously update your data source and the LLM can immediately make
  use of the updated information.
- You now have the potential to cite references in your LLM's responses.

On the other hand, using RAG naturally means longer prompts, and some LLM API
services charge for each input token you send. Ultimately, you must evaluate the
cost tradeoffs for your applications.

RAG is a very broad area and there are many different techniques used to achieve
the best quality RAG. The core Genkit framework offers two main abstractions to
help you do RAG:

- Embedders: transforms documents into a vector representation
- Retrievers: retrieve documents from an "index", given a query.

These definitions are broad on purpose because Genkit is un-opinionated about
what an "index" is or how exactly documents are retrieved from it. Genkit only
provides a `Document` format and everything else is defined by the retriever or
indexer implementation provider.

### Embedders

An embedder is a function that takes content (text, images, audio, etc.) and
creates a numeric vector that encodes the semantic meaning of the original
content. As mentioned above, embedders are leveraged as part of the process of
indexing. However, they can also be used independently to create embeddings
without an index.

### Retrievers

A retriever is a concept that encapsulates logic related to any kind of document
retrieval. The most popular retrieval cases typically include retrieval from
vector stores. However, in Genkit a retriever can be any function that returns
data.

To create a retriever, you can use one of the provided implementations or
create your own.

## Supported retrievers, and embedders

Genkit provides retriever support through its plugin system. The
following plugins are officially supported:

- [Pinecone](/go/docs/plugins/pinecone) cloud vector database

In addition, Genkit supports the following vector stores through predefined
code templates, which you can customize for your database configuration and
schema:

- PostgreSQL with [`pgvector`](/go/docs/plugins/pgvector)

Embedding model support is provided through the following plugins:

| Plugin                                                | Models         |
| ----------------------------------------------------- | -------------- |
| [Google Generative AI](/go/docs/plugins/google-genai) | Text embedding |

## Defining a RAG Flow

The following examples show how you could ingest a collection of restaurant menu
PDF documents into a vector database and retrieve them for use in a flow that
determines what food items are available.
_Note_: Although retriever functions are defined using Genkit, users are expected to add their own functionality to index the documents.

### Install dependencies

In this example, we will use the `textsplitter` library from `langchaingo` and
the `ledongthuc/pdf` PDF parsing Library:

```bash
go get github.com/tmc/langchaingo/textsplitter
go get github.com/ledongthuc/pdf
```

#### Create chunking config

This example uses the `textsplitter` library which provides a simple text
splitter to break up documents into segments that can be vectorized.

The following definition configures the chunking function to return document
segments of 200 characters, with an overlap between chunks of 20 characters.

```go
splitter := textsplitter.NewRecursiveCharacter(
    textsplitter.WithChunkSize(200),
    textsplitter.WithChunkOverlap(20),
)
```

More chunking options for this library can be found in the
[`langchaingo` documentation](https://pkg.go.dev/github.com/tmc/langchaingo/textsplitter#Option).

#### Define your indexer flow

```go
genkit.DefineFlow(
    g, "indexMenu",
    func(ctx context.Context, path string) (any, error) {
        // Extract plain text from the PDF. Wrap the logic in Run so it
        // appears as a step in your traces.
        pdfText, err := genkit.Run(ctx, "extract", func() (string, error) {
            return readPDF(path)
        })
        if err != nil {
            return nil, err
        }

        // Split the text into chunks. Wrap the logic in Run so it appears as a
        // step in your traces.
        docs, err := genkit.Run(ctx, "chunk", func() ([]*ai.Document, error) {
            chunks, err := splitter.SplitText(pdfText)
            if err != nil {
                return nil, err
            }

            var docs []*ai.Document
            for _, chunk := range chunks {
                docs = append(docs, ai.DocumentFromText(chunk, nil))
            }
            return docs, nil
        })
        if err != nil {
            return nil, err
        }

        // Add chunks to the index using custom index function
    },
)
```

```go
// Helper function to extract plain text from a PDF. Excerpted from
// https://github.com/ledongthuc/pdf
func readPDF(path string) (string, error) {
    f, r, err := pdf.Open(path)
    if f != nil {
        defer f.Close()
    }
    if err != nil {
        return "", err
    }

    reader, err := r.GetPlainText()
    if err != nil {
        return "", err
    }

    bytes, err := io.ReadAll(reader)
    if err != nil {
        return "", err
    }

    return string(bytes), nil
}
```

#### Run the indexer flow

```bash
genkit flow:run indexMenu "'menu.pdf'"
```

After running the `indexMenu` flow, the vector database will be seeded with
documents and ready to be used in Genkit flows with retrieval steps.

### Define a flow with retrieval

The following example shows how you might use a retriever in a RAG flow. This
example uses Genkit's file-based vector retriever, which you should not use in production.

```go
ctx := context.Background()

g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.VertexAI{}))
if err != nil {
    log.Fatal(err)
}

if err = localvec.Init(); err != nil {
    log.Fatal(err)
}

model := googlegenai.VertexAIModel(g, "gemini-1.5-flash")

_, menuPdfRetriever, err := localvec.DefineRetriever(
    g, "menuQA", localvec.Config{Embedder: googlegenai.VertexAIEmbedder(g, "text-embedding-004")},
)
if err != nil {
    log.Fatal(err)
}

genkit.DefineFlow(
  g, "menuQA",
  func(ctx context.Context, question string) (string, error) {
    // Retrieve text relevant to the user's question.
    resp, err := ai.Retrieve(ctx, menuPdfRetriever, ai.WithTextDocs(question))


    if err != nil {
        return "", err
    }

    // Call Generate, including the menu information in your prompt.
    return genkit.GenerateText(ctx, g,
        ai.WithModelName("googleai/gemini-2.5-flash"),
        ai.WithDocs(resp.Documents),
        ai.WithSystem(`
You are acting as a helpful AI assistant that can answer questions about the
food available on the menu at Genkit Grub Pub.
Use only the context provided to answer the question. If you don't know, do not
make up an answer. Do not add or change items on the menu.`)
        ai.WithPrompt(question))
  })
```

## Write your own retrievers

It's also possible to create your own retriever. This is useful if your
documents are managed in a document store that is not supported in Genkit (eg:
MySQL, Google Drive, etc.). The Genkit SDK provides flexible methods that let
you provide custom code for fetching documents.

You can also define custom retrievers that build on top of existing retrievers
in Genkit and apply advanced RAG techniques (such as reranking or prompt
extension) on top.

For example, suppose you have a custom re-ranking function you want to use. The
following example defines a custom retriever that applies your function to the
menu retriever defined earlier:

```go
type CustomMenuRetrieverOptions struct {
    K          int
    PreRerankK int
}

advancedMenuRetriever := genkit.DefineRetriever(
    g, "custom", "advancedMenuRetriever",
    func(ctx context.Context, req *ai.RetrieverRequest) (*ai.RetrieverResponse, error) {
        // Handle options passed using our custom type.
        opts, _ := req.Options.(CustomMenuRetrieverOptions)
        // Set fields to default values when either the field was undefined
        // or when req.Options is not a CustomMenuRetrieverOptions.
        if opts.K == 0 {
            opts.K = 3
        }
        if opts.PreRerankK == 0 {
            opts.PreRerankK = 10
        }

        // Call the retriever as in the simple case.
        resp, err := ai.Retrieve(ctx, menuPDFRetriever,
            ai.WithDocs(req.Query),
            ai.WithConfig(ocalvec.RetrieverOptions{K: opts.PreRerankK}),
        )
        if err != nil {
            return nil, err
        }

        // Re-rank the returned documents using your custom function.
        rerankedDocs := rerank(response.Documents)
        response.Documents = rerankedDocs[:opts.K]

        return response, nil
    },
)
```
