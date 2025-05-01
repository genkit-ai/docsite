---
title: Dev Local Vector Store Plugin
description: Learn how to use the Dev Local Vector Store plugin for local development and testing in Genkit Python.
---

# Dev Local Vector Store

The Dev Local Vector Store plugin provides a local, file-based vector store for development and testing purposes. It is not intended for production use.

## Installation

```bash
pip3 install genkit-plugin-dev-local-vectorstore
```

## Configuration

To use this plugin, specify it when you initialize Genkit:

```python
from genkit.ai import Genkit
from genkit.plugins.dev_local_vectorstore import DevLocalVectorStore
from genkit.plugins.google_genai import VertexAI # Assuming VertexAI is used for embedder

ai = Genkit(
    plugins=[
        VertexAI(), # Ensure the embedder's plugin is loaded
        DevLocalVectorStore(
            name='my_vectorstore',
            embedder='vertexai/text-embedding-004', # Example embedder
        ),
    ],
    # Define a default model if needed
    # model='vertexai/gemini-1.5-flash',
)
```

### Configuration Options

*   **name** (str): A unique name for this vector store instance. This is used as the `retriever` argument to `ai.retrieve`.
*   **embedder** (str): The name of the embedding model to use. Must match a configured embedder in your Genkit project.
*   **embedder_options** (dict, optional): Options to pass to the embedder.

## Usage

### Indexing Documents

The Dev Local Vector Store automatically creates indexes. To populate with data you must call the static method `.index(name, documents)`:

```python
from genkit.ai import Genkit
from genkit.plugins.dev_local_vectorstore import DevLocalVectorStore
from genkit.plugins.google_genai import VertexAI # Assuming VertexAI is used for embedder
from genkit.types import Document

# Assuming 'ai' is configured as shown in the Configuration section
# ai = Genkit(...)

data_list = [
    'This is the first document.',
    'This is the second document.',
    'This is the third document.',
    "This is the fourth document.",
]

genkit_docs = [Document.from_text(text=item) for item in data_list]
# Ensure the vector store name matches the one in the Genkit config
await DevLocalVectorStore.index('my_vectorstore', genkit_docs)
```

### Retrieving Documents

Use `ai.retrieve` and pass the store name configured in the DevLocalVectorStore constructor.

```python
from genkit.types import Document
# Assuming 'ai' is configured as shown in the Configuration section
# ai = Genkit(...)

docs = await ai.retrieve(
    query=Document.from_text('search query'),
    retriever='my_vectorstore', # Matches the 'name' in DevLocalVectorStore config
)
# print(docs) # Process the retrieved documents
