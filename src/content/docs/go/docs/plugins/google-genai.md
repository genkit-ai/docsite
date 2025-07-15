---
title: Google Generative AI plugin
description: Learn how to configure and use the Genkit Google Generative AI plugin for Go to access Gemini models via the Gemini API or Vertex AI API.
---

The Google Generative AI plugin provides interfaces to Google's Gemini models through either the Gemini API or the Vertex AI Gemini API.

## Configuration

The configuration depends on which provider you choose:

### Google AI

To use this plugin, import the `googlegenai` package and pass 
`googlegenai.GoogleAI` to `WithPlugins()` in the Genkit initializer:

```go
import "github.com/firebase/genkit/go/plugins/googlegenai"
```

```go
g, err := genkit.Init(context.Background(), ai.WithPlugins(&googlegenai.GoogleAI{}))
```

The plugin requires an API key for the Gemini API, which you can get from
[Google AI Studio](https://aistudio.google.com/app/apikey).

Configure the plugin to use your API key by doing one of the following:

- Set the `GEMINI_API_KEY` environment variable to your API key.

- Specify the API key when you initialize the plugin:

  ```go
  ai.WithPlugins(&googlegenai.GoogleAI{APIKey: "YOUR_API_KEY"})
  ```

  However, don't embed your API key directly in code! Use this feature only
  in conjunction with a service like Cloud Secret Manager or similar.

### Vertex AI

To use this plugin, import the `googlegenai` package and pass
`googlegenai.VertexAI` to `WithPlugins()` in the Genkit initializer:

```go
import "github.com/firebase/genkit/go/plugins/googlegenai"
```

```go
g, err := genkit.Init(context.Background(), genkit.WithPlugins(&googlegenai.VertexAI{}))
```

The plugin requires you to specify your Google Cloud project ID, the
[region](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations)
to which you want to make Vertex API requests, and your Google Cloud project
credentials.

- By default, `googlegenai.VertexAI` gets your Google Cloud project ID from the
  `GOOGLE_CLOUD_PROJECT` environment variable.

  You can also pass this value directly:

  ```go
  genkit.WithPlugins(&googlegenai.VertexAI{ProjectID: "my-project-id"})
  ```

- By default, `googlegenai.VertexAI` gets the Vertex AI API location from the
  `GOOGLE_CLOUD_LOCATION` environment variable.

  You can also pass this value directly:

  ```go
  genkit.WithPlugins(&googlegenai.VertexAI{Location: "us-central1"})
  ```

- To provide API credentials, you need to set up Google Cloud Application
  Default Credentials.

  1. To specify your credentials:

     - If you're running your flow from a Google Cloud environment (Cloud
       Functions, Cloud Run, and so on), this is set automatically.

     - On your local dev environment, do this by running:

       ```shell
       gcloud auth application-default login
       ```

     - For other environments, see the [Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc)
       docs.

  2. In addition, make sure the account is granted the Vertex AI User IAM role
     (`roles/aiplatform.user`). See the Vertex AI [access control](https://cloud.google.com/vertex-ai/generative-ai/docs/access-control)
     docs.

## Usage

### Generative models

To get a reference to a supported model, specify its identifier to
either `googlegenai.GoogleAIModel` or `googlgenai.VertexAIModel`:

```go
model := googlegenai.GoogleAIModel(g, "gemini-2.5-flash")
```

Alternatively, you may create a `ModelRef` which pairs the model name with its
config:

```go
modelRef := googlegenai.GoogleAIModelRef("gemini-2.5-flash", &googlegenai.GeminiConfig{
    Temperature: 0.5,
    MaxOutputTokens: 500,
    // Other configuration...
})
```

The following models are supported: `gemini-1.5-pro`, `gemini-1.5-flash`,
`gemini-2.0-pro`, `gemini-2.5-flash`, and other experimental models.

Model references have a `Generate()` method that calls the Google API:

```go
resp, err := genkit.Generate(ctx, g, ai.WithModel(modelRef), ai.WithPrompt("Tell me a joke."))
if err != nil {
      return err
}

log.Println(resp.Text())
```

See [Generating content with AI models](/go/docs/models) for more information.

### Embedding models

To get a reference to a supported embedding model, specify its identifier to
either `googlegenai.GoogleAIEmbedder` or `googlgenai.VertexAIEmbedder`:

```go
embeddingModel := googlegenai.GoogleAIEmbedder(g, "text-embedding-004")
```

The following models are supported:

- **Google AI**

  `text-embedding-004` and `embedding-001`

- **Vertex AI**

  `textembedding-gecko@003`, `textembedding-gecko@002`, 
  `textembedding-gecko@001`, `text-embedding-004`,
  `textembedding-gecko-multilingual@001`, `text-multilingual-embedding-002`, 
  and `multimodalembedding`

Embedder references have an `Embed()` method that calls the Google AI API:

```go
resp, err := ai.Embed(ctx, embeddingModel, ai.WithDocs(userInput))
if err != nil {
      return err
}
```

You can also pass an Embedder to a retriever's `Retrieve()` method:

```go
resp, err := ai.Retrieve(ctx, myRetriever, ai.WithDocs(userInput))
if err != nil {
      return err
}
```

See [Retrieval-augmented generation (RAG)](/go/docs/rag) for more information.