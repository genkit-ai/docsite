---
title: Neo4j plugin
description: This document describes the Neo4j plugin for Genkit, which provides indexer and retriever implementations that use the Neo4j graph database for vector search capabilities.
---

The Neo4j plugin provides indexer and retriever implementations that use the
[Neo4j](https://neo4j.com/) graph database for vector search capabilities.

## Installation

```bash
npm install genkitx-neo4j
```

## Configuration

To use this plugin, specify it when you initialize Genkit:

```ts
import { genkit } from 'genkit';
import { neo4j } from 'genkitx-neo4j';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [
    neo4j([
      {
        indexId: 'bob-facts',
        embedder: googleAI.embedder('gemini-embedding-001'),
      },
    ]),
  ],
});
```

You must specify a Neo4j index ID and the embedding model you want to use.

### Connection Configuration

There are two ways to configure the Neo4j connection:

1. Using environment variables:

```
NEO4J_URI=bolt://localhost:7687  # Neo4j's binary protocol
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j  # Optional: specify database name
```

2. Using the `clientParams` option:

```ts
neo4j([
  {
    indexId: 'bob-facts',
    embedder: googleAI.embedder('gemini-embedding-001'),
    clientParams: {
      url: 'bolt://localhost:7687',  // Neo4j's binary protocol
      username: 'neo4j',
      password: 'password',
      database: 'neo4j', // Optional
    },
  },
]),
```

> Note: The `bolt://` protocol is Neo4j's proprietary binary protocol designed for efficient client-server communication.

### Configuration Options

The Neo4j plugin accepts the following configuration options:

- `indexId`: (required) The name of the index to use in Neo4j
- `embedder`: (required) The embedding model to use
- `clientParams`: (optional) Neo4j connection configuration

## Usage

Import retriever and indexer references like so:

```ts
import { neo4jRetrieverRef } from 'genkitx-neo4j';
import { neo4jIndexerRef } from 'genkitx-neo4j';
```

### Retrieval

Use the retriever reference with `ai.retrieve()`:

```ts
// To use the index you configured when you loaded the plugin:
let docs = await ai.retrieve({ 
  retriever: neo4jRetrieverRef, 
  query,
  // Optional: limit number of results (max 1000)
  k: 5 
});

// To specify an index:
export const bobFactsRetriever = neo4jRetrieverRef({
  indexId: 'bob-facts',
  // Optional: custom display name
  displayName: 'Bob Facts Database'
});
docs = await ai.retrieve({ 
  retriever: bobFactsRetriever, 
  query,
  k: 10 
});
```

### Indexing

Use the indexer reference with `ai.index()`:

```ts
// To use the index you configured when you loaded the plugin:
await ai.index({ indexer: neo4jIndexerRef, documents });

// To specify an index:
export const bobFactsIndexer = neo4jIndexerRef({
  indexId: 'bob-facts',
  // Optional: custom display name
  displayName: 'Bob Facts Database'
});
await ai.index({ indexer: bobFactsIndexer, documents });
```

See the [Retrieval-augmented generation](/docs/rag) page for a general
discussion on indexers and retrievers.

## Learn More

For more information, feedback, or to report issues, visit the [Neo4j plugin GitHub repository](https://github.com/neo4j-partners/genkitx-neo4j/blob/main/README.md).
