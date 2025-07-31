---
title: pgvector retriever template
description: Learn how to use PostgreSQL and pgvector as a retriever implementation in Genkit Go.
---

You can use PostgreSQL and `pgvector` as your retriever implementation. Use the
following examples as a starting point and modify it to work with your database
schema.

```ts
import { genkit, z, Document } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
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
        embedder: googleAI.embedder('gemini-embedding-001'),
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
    inputSchema: z.object({ question: z.string() }),
    outputSchema: z.object({ answer: z.string() }),
  },
  async ({ question }) => {
    const docs = await ai.retrieve({
      retriever: sqlRetriever,
      query: question,
      options: {
        show: 'Game of Thrones',
      },
    });
    console.log(docs);

    // Continue with using retrieved docs
    // in RAG prompts.
    //...
    
    // Return an answer (placeholder for actual implementation)
    return { answer: "Answer would be generated here based on retrieved documents" };
  },
);
```
