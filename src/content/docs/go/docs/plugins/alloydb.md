---
title: AlloyDB plugin
description: Learn how to configure and use the AlloyDB plugin as a retriever implementation in Genkit Go.
---

The AlloyDB plugin provides provides the retriever implementation to search a [AlloyDB](https://cloud.google.com/alloydb/docs) database using the [pgvector](https://github.com/pgvector/pgvector) extension.

## Configuration

## Configuration

To use this plugin, follow these steps:

1. Import the plugin

	```go
	import "github.com/firebase/genkit/go/plugins/alloydb"
	```

2. Create a `PostgresEngine` instance:

	- Using basic authentication
		```go
		pEngine, err := alloydb.NewPostgresEngine(ctx,
				WithUser('user'),
				WithPassword('password'),
				WithAlloyDBInstance('my-project', 'us-central1', 'my-cluster', 'my-instance'),
				WithDatabase('my-database')
		```
	- Using email authentication
		```go
		pEngine, err := alloydb.NewPostgresEngine(ctx,
			WithAlloyDBInstance('my-project', 'us-central1', 'my-cluster', 'my-instance'),
			WithDatabase('my-database'),
			WithIAMAccountEmail('mail@company.com'))
		```
	- Using custom pool
		```go



		pool, err := pgxpool.New(ctx, "add_your_connection_string")
		if err != nil {
			return err
		}

		pEngine, err := alloydb.NewPostgresEngine(ctx,
			WithDatabase("db_test"),
			WithPool(pool))

		```

3. Create the Postgres plugin
	- Using plugin method Init


		```go
			postgres := &alloydb.Postgres{
				engine: pEngine,
			}

			if err := (postgres).Init(ctx, g); err != nil {
				return err
			}
		```

	- Using the genkit method init

		```go
			postgres := &alloydb.Postgres{
				engine: pEngine,
			}

			g, err := genkit.Init(ctx, genkit.WithPlugins(postgres))

			if  err != nil {
				return err
			}

		```

## Usage

To add documents to a AlloyDB index, first create an index definition that specifies the features of the table:

```go
cfg := &alloydb.Config{
	TableName:             'documents',
	SchemaName:            'public',
	ContentColumn:         "content",
	EmbeddingColumn:       "embedding",
	MetadataColumns:       []string{"source", "category"},
	IDColumn:              "custom_id",
	MetadataJSONColumn:    "custom_metadata",
	Embedder:              embedder,
	EmbedderOptions:       nil,
}

doc, retriever, err := postgresql.DefineRetriever(ctx, g, postgres, cfg)
if err != nil {
  return err
}

docs := []*ai.Document{{
        Content: []*ai.Part{{
        Kind:        ai.PartText,
        ContentType: "text/plain",
        Text:        "The product features include...",
        }},
      Metadata: map[string]any{"source": "website", "category": "product-docs", "custom_id": "doc-123"},
  }}

if err := doc.Index(ctx, docs); err != nil {
    return err
}
```

Similarly, to retrieve documents from an index,use the retriever
method:

```go
doc,  retriever, err := alloydb.DefineRetriever(ctx, g, postgres, cfg)
if err != nil {
  return err
}

d2 := ai.DocumentFromText( "The product features include..." , nil)

resp, err := retriever.Retrieve(ctx, &ai.RetrieverRequest{
    Query: d2,
    k:5,
    filter: "source='website' AND category='product-docs'"
})

if err != nil {
    return err
}
```

It's also possible to use the Retrieve method from Retriever

```go

d2 := ai.DocumentFromText( "The product features include..." , nil)

retrieverOptions := &alloydb.RetrieverOptions{
	k:5,
    filter: "source='website' AND category='product-docs'"
}

resp, err := ai.Retrieve(ctx, retriever,ai.WithDocs(d2), &ai.WithConfig(retrieverOptions))
if err != nil {
    return err
}
```


See the [Retrieval-augmented generation](/go/docs/rag) page for a general
discussion on using indexers and retrievers for RAG.
