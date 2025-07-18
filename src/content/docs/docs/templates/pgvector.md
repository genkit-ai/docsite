---
title: pgvector retriever template
description: This document provides a template for using PostgreSQL and pgvector as a retriever implementation in Genkit, with examples for configuration and usage in flows.
---

You can use PostgreSQL and `pgvector` as your retriever implementation. Use the
following example as a starting point and modify it to work with your database
schema.

```ts
import { genkit, z, Document } from 'genkit';
import { googleAI, textEmbedding004 } from '@genkit-ai/googleai';
import { toSql } from 'pgvector';
import postgres from 'postgres';

const ai = genkit({
  plugins: [googleAI()],
});

const sql = postgres({ ssl: false, database: 'recaps' });

const QueryOptions = z.object({
  show: z.string(),
  k: z.number().optional(),
});

const sqlRetriever = ai.defineRetriever(
  {
    name: 'pgvector-myTable',
    configSchema: QueryOptions,
  },
  async (input, options) => {
    const embedding = (
      await ai.embed({
        embedder: textEmbedding004,
        content: input,
      })
    )[0].embedding;
    const results = await sql`
      SELECT episode_id, season_number, chunk as content
        FROM embeddings
        WHERE show_id = ${options.show}
        ORDER BY embedding <#> ${toSql(embedding)} LIMIT ${options.k ?? 3}
      `;
    return {
      documents: results.map((row) => {
        const { content, ...metadata } = row;
        return Document.fromText(content, metadata);
      }),
    };
  },
);
```

And here's how to use the retriever in a flow:

```ts
// Simple flow to use the sqlRetriever
export const askQuestionsOnGoT = ai.defineFlow(
  {
    name: 'askQuestionsOnGoT',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (inputQuestion) => {
    const docs = await ai.retrieve({
      retriever: sqlRetriever,
      query: inputQuestion,
      options: {
        show: 'Game of Thrones',
      },
    });
    console.log(docs);

    // Continue with using retrieved docs
    // in RAG prompts.
    //...
  },
);
```
