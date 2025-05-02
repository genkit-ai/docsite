---
title: Ollama Plugin
description: Learn how to configure and use the Ollama plugin for Genkit Python to run local LLMs and embedding models.
---

# Ollama

The `genkit-plugin-ollama` package provides integration with [Ollama](https://ollama.com/), allowing you to run various open-source large language models and embedding models locally.

## Installation

```bash
pip3 install genkit-plugin-ollama
```

You will need to download and install Ollama separately: [https://ollama.com/download](https://ollama.com/download)

Use the Ollama CLI to pull the models you would like to use. For example:

```bash
ollama pull gemma2 # Example model
ollama pull nomic-embed-text # Example embedder
```

## Configuration

Configure the Ollama plugin in your Genkit initialization, specifying the models and embedders you have pulled and wish to use.

```python
from genkit.ai import Genkit
from genkit.plugins.ollama import Ollama, ModelDefinition, EmbeddingModelDefinition

ai = Genkit(
    plugins=[
        Ollama(
           models=[
               ModelDefinition(name='gemma2'), # Match the model pulled via ollama CLI
               # Add other models as needed
               # ModelDefinition(name='mistral'),
           ],
           embedders=[
               EmbeddingModelDefinition(
                   name='nomic-embed-text', # Match the embedder pulled via ollama CLI
                   # Specify dimensions if known/required by your use case
                   # dimensions=768, # Example dimension
               )
           ],
           # Optional: Specify Ollama server address if not default (http://127.0.0.1:11434)
           # address="http://custom-ollama-host:11434"
        )
    ],
)
```

Then use Ollama models and embedders by specifying the `ollama/` prefix followed by the model/embedder name defined in the configuration:

```python
from genkit.ai import Document # Import Document
# Assuming 'ai' is configured as above

async def run_ollama():
    generate_response = await ai.generate(
        prompt='Tell me a short story about a space cat.',
        model='ollama/gemma2', # Use the configured model name
    )
    print("Generated Text:", generate_response.text)

    embedding_response = await ai.embed(
        embedder='ollama/nomic-embed-text', # Use the configured embedder name
        content=[Document.from_text('This is text to embed.')], # Pass content as a list of Documents
    )
    print("Embedding:", embedding_response.embeddings[0].embedding) # Access the embedding vector

# Example of running the async function
# import asyncio
# asyncio.run(run_ollama())
```

## API Reference

Detailed API documentation for the Ollama plugin components is generated separately.

*(Note: The original MkDocs configuration used `mkdocstrings` to auto-generate content here. A different approach is needed for Starlight.)*
