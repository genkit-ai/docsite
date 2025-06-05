---
title: Firebase plugin
description: Learn how to configure and use the Genkit Firebase plugin for Go to integrate with Firebase services including Firestore for RAG applications.
---

The Firebase plugin provides integration with Firebase services for Genkit applications. It enables you to use Firebase Firestore as a vector database for retrieval-augmented generation (RAG) applications by defining retrievers and indexers.

## Prerequisites

This plugin requires:

- A Firebase project - Create one at the [Firebase Console](https://console.firebase.google.com/)
- Firestore database enabled in your Firebase project
- Firebase credentials configured for your application

### Firebase Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Firestore** in your project:
   - Go to Firestore Database in the Firebase console
   - Click "Create database"
   - Choose your security rules and location
3. **Set up authentication** using one of these methods:
   - For local development: `firebase login` and `firebase use <project-id>`
   - For production: Service account key or Application Default Credentials

## Configuration

### Basic Configuration

To use this plugin, import the `firebase` package and initialize it with your project:

```go
import "github.com/firebase/genkit/go/plugins/firebase"
```

```go
// Option 1: Using project ID (recommended)
firebasePlugin := &firebase.Firebase{
    ProjectId: "your-firebase-project-id",
}

g, err := genkit.Init(context.Background(), genkit.WithPlugins(firebasePlugin))
if err != nil {
    log.Fatal(err)
}
```

### Environment Variable Configuration

You can also configure the project ID using environment variables:

```bash
export FIREBASE_PROJECT_ID=your-firebase-project-id
```

```go
// Plugin will automatically use FIREBASE_PROJECT_ID environment variable
firebasePlugin := &firebase.Firebase{}
g, err := genkit.Init(context.Background(), genkit.WithPlugins(firebasePlugin))
```

### Advanced Configuration

For advanced use cases, you can provide a pre-configured Firebase app:

```go
import firebasev4 "firebase.google.com/go/v4"

// Create Firebase app with custom configuration
app, err := firebasev4.NewApp(ctx, &firebasev4.Config{
    ProjectID: "your-project-id",
    // Additional Firebase configuration options
})
if err != nil {
    log.Fatal(err)
}

firebasePlugin := &firebase.Firebase{
    App: app,
}
```

## Usage

### Defining Firestore Retrievers

The primary use case for the Firebase plugin is creating retrievers for RAG applications:

```go
// Define a Firestore retriever
retrieverOptions := firebase.RetrieverOptions{
    Name:           "my-documents",
    Collection:     "documents",
    VectorField:    "embedding",
    EmbedderName:   "text-embedding-3-small",
    TopK:           10,
}

retriever, err := firebase.DefineRetriever(ctx, g, retrieverOptions)
if err != nil {
    log.Fatal(err)
}
```

### Using Retrievers in RAG Workflows

Once defined, you can use the retriever in your RAG workflows:

```go
// Retrieve relevant documents
results, err := ai.Retrieve(ctx, retriever, ai.WithDocs("What is machine learning?"))
if err != nil {
    log.Fatal(err)
}

// Use retrieved documents in generation
var contextDocs []string
for _, doc := range results.Documents {
    contextDocs = append(contextDocs, doc.Content[0].Text)
}

context := strings.Join(contextDocs, "\n\n")
resp, err := genkit.Generate(ctx, g,
    ai.WithPrompt(fmt.Sprintf("Context: %s\n\nQuestion: %s", context, "What is machine learning?")),
)
```

### Complete RAG Example

Here's a complete example showing how to set up a RAG system with Firebase:

```go
package main

import (
    "context"
    "fmt"
    "log"
    "strings"

    "github.com/firebase/genkit/go/ai"
    "github.com/firebase/genkit/go/genkit"
    "github.com/firebase/genkit/go/plugins/firebase"
    "github.com/firebase/genkit/go/plugins/compat_oai/openai"
)

func main() {
    ctx := context.Background()

    // Initialize plugins
    firebasePlugin := &firebase.Firebase{
        ProjectId: "my-firebase-project",
    }
    
    openaiPlugin := &openai.OpenAI{
        APIKey: "your-openai-api-key",
    }

    g, err := genkit.Init(ctx, genkit.WithPlugins(firebasePlugin, openaiPlugin))
    if err != nil {
        log.Fatal(err)
    }

    // Define retriever for knowledge base
    retriever, err := firebase.DefineRetriever(ctx, g, firebase.RetrieverOptions{
        Name:         "knowledge-base",
        Collection:   "documents",
        VectorField:  "embedding",
        EmbedderName: "text-embedding-3-small",
        TopK:         5,
    })
    if err != nil {
        log.Fatal(err)
    }

    // RAG query function
    query := "How does machine learning work?"
    
    // Step 1: Retrieve relevant documents
    retrievalResults, err := ai.Retrieve(ctx, retriever, ai.WithDocs(query))
    if err != nil {
        log.Fatal(err)
    }

    // Step 2: Prepare context from retrieved documents
    var contextParts []string
    for _, doc := range retrievalResults.Documents {
        contextParts = append(contextParts, doc.Content[0].Text)
    }
    context := strings.Join(contextParts, "\n\n")

    // Step 3: Generate answer with context
    model := openaiPlugin.Model(g, "gpt-4o")
    response, err := genkit.Generate(ctx, g,
        ai.WithModel(model),
        ai.WithPrompt(fmt.Sprintf(`
Based on the following context, answer the question:

Context:
%s

Question: %s

Answer:`, context, query)),
    )
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Answer: %s\n", response.Text())
}
```

## Firestore Data Structure

### Document Storage Format

Your Firestore documents should follow this structure for optimal retrieval:

```json
{
  "content": "Your document text content here...",
  "embedding": [0.1, -0.2, 0.3, ...],
  "metadata": {
    "title": "Document Title",
    "author": "Author Name",
    "category": "Technology",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Indexing Documents

To add documents to your Firestore collection with embeddings:

```go
// Example of adding documents with embeddings
embedder := openaiPlugin.Embedder(g, "text-embedding-3-small")

documents := []struct {
    Content  string
    Metadata map[string]interface{}
}{
    {
        Content: "Machine learning is a subset of artificial intelligence...",
        Metadata: map[string]interface{}{
            "title":    "Introduction to ML",
            "category": "Technology",
        },
    },
    // More documents...
}

for _, doc := range documents {
    // Generate embedding
    embeddingResp, err := ai.Embed(ctx, embedder, ai.WithDocs(doc.Content))
    if err != nil {
        log.Fatal(err)
    }

    // Store in Firestore
    firestoreClient, _ := firebasePlugin.App.Firestore(ctx)
    _, err = firestoreClient.Collection("documents").Doc().Set(ctx, map[string]interface{}{
        "content":   doc.Content,
        "embedding": embeddingResp.Embeddings[0].Embedding,
        "metadata":  doc.Metadata,
    })
    if err != nil {
        log.Fatal(err)
    }
}
```

## Configuration Options

### Firebase struct

```go
type Firebase struct {
    // ProjectId is your Firebase project ID
    // If empty, uses FIREBASE_PROJECT_ID environment variable
    ProjectId string
    
    // App is a pre-configured Firebase app instance
    // Use either ProjectId or App, not both
    App *firebasev4.App
}
```

### RetrieverOptions

```go
type RetrieverOptions struct {
    // Name is a unique identifier for the retriever
    Name string
    
    // Collection is the Firestore collection name containing documents
    Collection string
    
    // VectorField is the field name containing the embedding vectors
    VectorField string
    
    // EmbedderName is the name of the embedder to use for query vectorization
    EmbedderName string
    
    // TopK is the number of top similar documents to retrieve
    TopK int
    
    // Additional filtering and configuration options
}
```

## Authentication

### Local Development

For local development, use the Firebase CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and set project
firebase login
firebase use your-project-id
```

### Production Deployment

For production, use one of these authentication methods:

#### Service Account Key

```go
import "google.golang.org/api/option"

app, err := firebasev4.NewApp(ctx, &firebasev4.Config{
    ProjectID: "your-project-id",
}, option.WithCredentialsFile("path/to/serviceAccountKey.json"))
```

#### Application Default Credentials

Set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

Or use the metadata server on Google Cloud Platform.

## Error Handling

Handle Firebase-specific errors appropriately:

```go
retriever, err := firebase.DefineRetriever(ctx, g, options)
if err != nil {
    if strings.Contains(err.Error(), "plugin not found") {
        log.Fatal("Firebase plugin not initialized. Make sure to include it in genkit.Init()")
    }
    log.Fatalf("Failed to create retriever: %v", err)
}

// Handle retrieval errors
results, err := ai.Retrieve(ctx, retriever, ai.WithDocs(query))
if err != nil {
    log.Printf("Retrieval failed: %v", err)
    // Implement fallback logic
}
```

## Best Practices

### Performance Optimization

- **Batch Operations**: Use Firestore batch writes when adding multiple documents
- **Index Configuration**: Set up appropriate Firestore indexes for your queries
- **Caching**: Implement caching for frequently accessed documents
- **Pagination**: Use pagination for large result sets

### Security

- **Firestore Rules**: Configure proper security rules for your collections
- **API Keys**: Never expose Firebase configuration in client-side code
- **Authentication**: Implement proper user authentication for sensitive data

### Cost Management

- **Document Size**: Keep documents reasonably sized to minimize read costs
- **Query Optimization**: Design efficient queries to reduce operation costs
- **Storage Management**: Regularly clean up unused documents and embeddings

## Integration Examples

### With Multiple Embedders

```go
// Use different embedders for different types of content
technicalRetriever, err := firebase.DefineRetriever(ctx, g, firebase.RetrieverOptions{
    Name:         "technical-docs",
    Collection:   "technical_documents",
    VectorField:  "embedding",
    EmbedderName: "text-embedding-3-large", // More accurate for technical content
    TopK:         5,
})

generalRetriever, err := firebase.DefineRetriever(ctx, g, firebase.RetrieverOptions{
    Name:         "general-knowledge",
    Collection:   "general_documents", 
    VectorField:  "embedding",
    EmbedderName: "text-embedding-3-small", // Faster for general content
    TopK:         10,
})
```

### With Flows

```go
ragFlow := genkit.DefineFlow(g, "rag-qa", func(ctx context.Context, query string) (string, error) {
    // Retrieve context
    results, err := ai.Retrieve(ctx, retriever, ai.WithDocs(query))
    if err != nil {
        return "", err
    }
    
    // Generate response
    response, err := genkit.Generate(ctx, g,
        ai.WithPrompt(buildPromptWithContext(query, results)),
    )
    if err != nil {
        return "", err
    }
    
    return response.Text(), nil
})
```

## Troubleshooting

### Common Issues

1. **Plugin not found error**: Ensure Firebase plugin is included in `genkit.Init()`
2. **Authentication failures**: Verify Firebase credentials and project ID
3. **Firestore permission errors**: Check Firestore security rules
4. **Empty retrieval results**: Verify collection name and document structure

### Debugging

Enable verbose logging to debug issues:

```go
import "log/slog"

// Enable debug logging
slog.SetLogLoggerLevel(slog.LevelDebug)
```

## See also

- [Retrieval-augmented generation (RAG)](/go/docs/rag) - Learn about RAG patterns in Genkit
- [Creating flows](/go/docs/flows) - Build AI workflows with Firebase data
- [Generating content](/go/docs/models) - Use retrieved context in generation 