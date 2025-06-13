---
title: AlloyDB plugin
description: Learn how to configure and use the Genkit AlloyDB plugin for Go to integrate with pgvector extension.
---

The AlloyDB plugin provides indexer and retriever implementatons that use the [AlloyDB](https://cloud.google.com/alloydb/docs) and [pgvector](https://github.com/pgvector/pgvector) extension.

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
			WithCloudSQLInstance('my-project', 'us-central1', 'my-cluster', 'my-instance'),
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

indexer, err := alloydb.DefineIndexer(ctx, g, postgres, cfg)
if err != nil {
	return err
}

d1 := ai.DocumentFromText( 
	"The product features include..." , 
	map[string]any{
		"source": "website", 
		"category": "product-docs", 
		"custom_id": "doc-123"})

err := ai.Index(ctx, indexer, ai.WithIndexerDocs(d1))
if err != nil {
	return err
}
```

Similarly, to retrieve documents from an index, first create a retriever
definition:

```go
retriever, err := alloydb.DefineRetriever(ctx, g, postgres, cfg)
if err != nil {
  retrun err
}

d2 := ai.DocumentFromText( "The product features include..." , nil)

resp, err := retriever.Retrieve(ctx, &ai.RetrieverRequest{
    Query: d2,
    k:5,
    filter: "source='website' AND category='product-docs'"
})

if err != nil {
    retrun err
}
```

It's also posible to use the Retrieve method from Retriever

```go
retriever, err := alloydb.DefineRetriever(ctx, g, postgres, cfg)
if err != nil {
  retrun err
}

d2 := ai.DocumentFromText( "The product features include..." , nil)

retrieverOptions := &alloydb.RetrieverOptions{
	k:5,
    filter: "source='website' AND category='product-docs'"
}

resp, err := ai.Retrieve(ctx, retriever,ai.WithDocs(d2), &ai.WithConfig(retrieverOptions))
if err != nil {
    retrun err
}
```


See the [Retrieval-augmented generation](/go/docs/rag) page for a general
discussion on using indexers and retrievers for RAG.
