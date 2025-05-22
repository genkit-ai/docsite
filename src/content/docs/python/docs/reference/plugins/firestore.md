---
title: Firestore Vector Store Plugin
description: Learn how to use the Firestore Vector Store plugin with Genkit Python to leverage Google Cloud Firestore for RAG.
---

# Firestore Vector Store

The Firestore plugin provides retriever implementations that use Google Cloud
Firestore as a vector store.

## Installation

```bash
pip3 install genkit-plugin-firebase
```

## Prerequisites

- A Firebase project with Cloud Firestore enabled.
- The `genkit` package installed.
- `gcloud` CLI for managing credentials and Firestore indexes.

## Configuration

To use this plugin, specify it when you initialize Genkit:

```python
from genkit.ai import Genkit
from genkit.plugins.firebase.firestore import FirestoreVectorStore
from google.cloud import firestore

firestore_client = firestore.Client()

ai = Genkit(
    plugins=[
        FirestoreVectorStore(
            name='my_firestore_retriever',
            collection='my_collection', # Replace with your collection name
            vector_field='embedding',
            content_field='text',
            embedder='vertexai/text-embedding-004', # Example embedder
            firestore_client=firestore_client,
        ),
    ]
)
```

### Configuration Options

- **name** (str): A unique name for this retriever instance.
- **collection** (str): The name of the Firestore collection to query.
- **vector_field** (str): The name of the field in the Firestore documents that contains the vector embedding.
- **content_field** (str): The name of the field in the Firestore documents that contains the text content.
- **embedder** (str): The name of the embedding model to use. Must match a configured embedder in your Genkit project.
- **firestore_client**: A `google.cloud.firestore.Client` object that will be used for all queries to the vectorstore.

## Usage

1.  **Create a Firestore Client**:

    ```python
    from google.cloud import firestore
    firestore_client = firestore.Client()
    ```

2.  **Define a Firestore Retriever**:

    ```python
    from genkit.ai import Genkit
    from genkit.plugins.firebase.firestore import FirestoreVectorStore
    from google.cloud import firestore

    ai = Genkit(
        plugins=[
            FirestoreVectorStore(
                name='my_firestore_retriever',
                collection='my_collection', # Replace with your collection name
                vector_field='embedding',
                content_field='text',
                embedder='vertexai/text-embedding-004', # Example embedder
                firestore_client=firestore_client,
            ),
        ]
    )
    ```

3.  **Retrieve Documents**:

    ```python
    async def retrieve_documents():
        return await ai.retrieve(
            query="What are the main topics?",
            retriever='my_firestore_retriever', # Matches the 'name' in FirestoreVectorStore config
        )
    ```

## Populating the Index

Before you can retrieve documents, you need to populate your Firestore collection with data and their corresponding vector embeddings. Here's how you can do it:

1.  **Prepare your Data**: Organize your data into documents. Each document should have at least two fields: a `text` field containing the content you want to retrieve, and an `embedding` field that holds the vector embedding of the content. You can add any other metadata as well.

2.  **Generate Embeddings**: Use the same embedding model configured in your `FirestoreVectorStore` to generate vector embeddings for your text content. The `ai.embed()` method can be used.

3.  **Upload Documents to Firestore**: Use the Firestore client to upload the documents with their embeddings to the specified collection.

Here's an example of how to index data:

```python
from genkit.ai import Document
from genkit.types import TextPart

async def index_documents(documents: list[str], collection_name: str):
    """Indexes the documents in Firestore."""
    genkit_documents = [Document(content=[TextPart(text=doc)]) for doc in documents]
    # Ensure the embedder name matches the one configured in Genkit
    embed_response = await ai.embed(embedder='vertexai/text-embedding-004', documents=genkit_documents)
    embeddings = [emb.embedding for emb in embed_response.embeddings]

    for i, document_text in enumerate(documents):
        doc_id = f'doc-{i + 1}'
        embedding = embeddings[i]

        doc_ref = firestore_client.collection(collection_name).document(doc_id)
        result = doc_ref.set({
            'text': document_text,
            'embedding': embedding, # Ensure this field name matches 'vector_field' in config
            'metadata': f'metadata for doc {i + 1}',
        })
        print(f"Indexed document {doc_id}") # Optional: print progress

# Example Usage
# documents = [
#     "This is document one.",
#     "This is document two.",
#     "This is document three.",
# ]
# import asyncio
# asyncio.run(index_documents(documents, 'my_collection')) # Replace 'my_collection' with your actual collection name
```

## Creating a Firestore Index

To enable vector similarity search you will need to configure the index in your Firestore database. Use the following command:

```bash
gcloud firestore indexes composite create \
  --project=<YOUR_FIREBASE_PROJECT_ID> \
  --collection-group=<YOUR_COLLECTION_NAME> \
  --query-scope=COLLECTION \
  --field-config=vector-config='{"dimension":<YOUR_DIMENSION_COUNT>,"flat": {}}',field-path=<YOUR_VECTOR_FIELD>
```

- Replace `<YOUR_FIREBASE_PROJECT_ID>` with the ID of your Firebase project.
- Replace `<YOUR_COLLECTION_NAME>` with the name of your Firestore collection (e.g., `my_collection`).
- Replace `<YOUR_DIMENSION_COUNT>` with the correct dimension for your embedding model. Common values are:
  - `768` for `vertexai/text-embedding-004`
- Replace `<YOUR_VECTOR_FIELD>` with the name of the field containing vector embeddings (e.g., `embedding`).
