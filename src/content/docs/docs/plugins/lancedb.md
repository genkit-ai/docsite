---
title: LanceDB plugin
---

The LanceDB plugin provides indexer and retriever implementations that use [LanceDB](https://lancedb.com/), an open-source vector database for AI applications.

## Installation

```bash
npm i --save genkitx-lancedb
```

## Configuration

To use this plugin, specify it when you initialize Genkit:

```ts
import { genkit } from 'genkit';
import { lancedb } from 'genkitx-lancedb';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [
    // Google AI provides the text-embedding-004 embedder
    googleAI(),

    // LanceDB requires an embedder to translate from text to vector
    lancedb([
      {
        dbUri: '.db', // optional lancedb uri, default to .db
        tableName: 'table', // optional table name, default to table
        embedder: googleAI.embedder('text-embedding-004'),
      },
    ]),
  ],
});
```

You must specify an embedder to use with LanceDB. You can also optionally configure:

- `dbUri`: The URI for the LanceDB database (defaults to `.db`)
- `tableName`: The name of the table to use (defaults to `table`)

## Usage

Import retriever and indexer references like so:

```ts
import { lancedbRetrieverRef, lancedbIndexerRef, WriteMode } from 'genkitx-lancedb';
```

### Retrieval

Use the retriever reference with `ai.retrieve()`:

```ts
// To use the default configuration:
let docs = await ai.retrieve({ 
  retriever: lancedbRetrieverRef, 
  query 
});

// To specify custom options:
export const menuRetriever = lancedbRetrieverRef({
  tableName: "table", // Use the same table name as the indexer
  displayName: "Menu", // Use a custom display name
});

docs = await ai.retrieve({ 
  retriever: menuRetriever, 
  query,
  options: { 
    k: 3, // Limit to 3 results
  },
});
```

### Indexing

Use the indexer reference with `ai.index()`:

```ts
// To use the default configuration:
await ai.index({ indexer: lancedbIndexerRef, documents });

// To specify custom options:
export const menuPdfIndexer = lancedbIndexerRef({
  // Using all defaults for dbUri, tableName, and embedder
});

await ai.index({ 
  indexer: menuPdfIndexer, 
  documents,
  options: {
    writeMode: WriteMode.Overwrite,
  }
});
```

## Example: Creating a RAG Flow

Here's a complete example of creating a RAG (Retrieval-Augmented Generation) flow with LanceDB:

```ts
import { lancedbIndexerRef, lancedb, lancedbRetrieverRef, WriteMode } from 'genkitx-lancedb';
import { googleAI } from '@genkit-ai/googleai';
import { z, genkit } from 'genkit';
import { Document } from 'genkit/retriever';
import { chunk } from 'llm-chunk';
import { readFile } from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse';

const ai = genkit({
  plugins: [
    googleAI(),
    lancedb([
      {
        dbUri: '.db',
        tableName: 'table',
        embedder: googleAI.embedder('text-embedding-004'),
      },
    ]),
  ],
});

// Define indexer
export const menuPdfIndexer = lancedbIndexerRef({
   // Using all defaults
});

const chunkingConfig = {
  minLength: 1000,
  maxLength: 2000,
  splitter: 'sentence',
  overlap: 100,
  delimiters: '',
};

async function extractTextFromPdf(filePath: string) {
  const pdfFile = path.resolve(filePath);
  const dataBuffer = await readFile(pdfFile);
  const data = await pdf(dataBuffer);
  return data.text;
}

// Define indexing flow
export const indexMenu = ai.defineFlow(
  {
    name: 'indexMenu',
    inputSchema: z.string().describe('PDF file path'),
    outputSchema: z.void(),
  },
  async (filePath: string) => {
    filePath = path.resolve(filePath);

    // Read the pdf
    const pdfTxt = await ai.run('extract-text', () =>
      extractTextFromPdf(filePath)
    );

    // Divide the pdf text into segments
    const chunks = await ai.run('chunk-it', async () =>
      chunk(pdfTxt, chunkingConfig)
    );

    // Convert chunks of text into documents to store in the index
    const documents = chunks.map((text) => {
      return Document.fromText(text, { filePath });
    });

    // Add documents to the index
    await ai.index({
      indexer: menuPdfIndexer,
      documents,
      options: {
        writeMode: WriteMode.Overwrite,
      }
    });
  }
);

// Define retriever
export const menuRetriever = lancedbRetrieverRef({
  tableName: "table", // Use the same table name as the indexer
  displayName: "Menu", // Use a custom display name
});

// Define retrieval flow
export const menuQAFlow = ai.defineFlow(
  { name: "Menu", inputSchema: z.string(), outputSchema: z.string() },
  async (input: string) => {
    // Retrieve relevant documents
    const docs = await ai.retrieve({
      retriever: menuRetriever,
      query: input,
      options: { 
        k: 3,
      },
    });

    const extractedContent = docs.map(doc => {
      if (doc.content && Array.isArray(doc.content) && doc.content.length > 0) {
        if (doc.content[0].media && doc.content[0].media.url) {
          return doc.content[0].media.url;
        }
      }
      return "No content found";
    });

    console.log("Extracted content:", extractedContent);

    // Generate response using retrieved documents
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
You are acting as a helpful AI assistant that can answer 
questions about the food available on the menu at Genkit Grub Pub.

Use only the context provided to answer the question.
If you don't know, do not make up an answer.
Do not add or change items on the menu.

Context:
${extractedContent.join('\n\n')}

Question: ${input}`,
      docs,
    });
    
    return text;
  }
);
```

See the [Retrieval-augmented generation](/docs/rag) page for a general discussion on indexers and retrievers.

## Learn More

For more information, feedback, or to report issues, visit the [LanceDB plugin GitHub repository](https://github.com/lancedb/genkitx-lancedb).
