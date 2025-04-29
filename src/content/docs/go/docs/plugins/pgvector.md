---
title: pgvector retriever template
description: Learn how to use PostgreSQL and pgvector as a retriever implementation in Genkit Go.
---

You can use PostgreSQL and `pgvector` as your retriever implementation. Use the
following examples as a starting point and modify it to work with your database
schema.

We use [database/sql](https://pkg.go.dev/database/sql) to connect to the Postgres server, but you may use another client library of your choice.

```go
func defineRetriever(g *genkit.Genkit, db *sql.DB, embedder ai.Embedder) ai.Retriever {
	f := func(ctx context.Context, req *ai.RetrieverRequest) (*ai.RetrieverResponse, error) {
		eres, err := ai.Embed(ctx, embedder, ai.WithDocs(req.Query))
		if err != nil {
			return nil, err
		}
		rows, err := db.QueryContext(ctx, `
			SELECT episode_id, season_number, chunk as content
			FROM embeddings
			WHERE show_id = $1
		  	ORDER BY embedding <#> $2
		  	LIMIT 2`,
			req.Options, pgv.NewVector(eres.Embeddings[0].Embedding))
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		res := &ai.RetrieverResponse{}
		for rows.Next() {
			var eid, sn int
			var content string
			if err := rows.Scan(&eid, &sn, &content); err != nil {
				return nil, err
			}
			meta := map[string]any{
				"episode_id":    eid,
				"season_number": sn,
			}
			doc := &ai.Document{
				Content:  []*ai.Part{ai.NewTextPart(content)},
				Metadata: meta,
			}
			res.Documents = append(res.Documents, doc)
		}
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return res, nil
	}
	return genkit.DefineRetriever(g, provider, "shows", f)
}
```

And here's how to use the retriever in a flow:

```go
retriever := defineRetriever(g, db, embedder)

type input struct {
	Question string
	Show     string
}

genkit.DefineFlow(g, "askQuestion", func(ctx context.Context, in input) (string, error) {
	res, err := ai.Retrieve(ctx, retriever,
		ai.WithConfig(in.Show),
		ai.WithTextDocs(in.Question))
	if err != nil {
		return "", err
	}
	for _, doc := range res.Documents {
		fmt.Printf("%+v %q\n", doc.Metadata, doc.Content[0].Text)
	}
	// Use documents in RAG prompts.
	return "", nil
})
```
