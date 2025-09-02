---
title: Google GenAI Plugin
description: Learn how to configure and use the Google GenAI plugin for Genkit Python, providing access to Google Gemini API and Vertex AI models.
---

# Google Gen AI

The `genkit-plugin-google-genai` package provides two plugins for accessing Google's generative AI models:

1.  `GoogleAI`: For accessing models via the Google Gemini API (requires an API key).
2.  `VertexAI`: For accessing models via the Gemini API within Google Cloud Vertex AI (uses standard Google Cloud authentication).

## Installation

```bash
pip3 install genkit-plugin-google-genai
```

## Configuration

### Google Gemini API (`GoogleAI`)

To use the Google Gemini API, you need an API key.

```python
from genkit.ai import Genkit
from genkit.plugins.google_genai import GoogleAI

ai = Genkit(
  plugins=[GoogleAI()],
  model='googleai/gemini-2.5-flash',
)
```

You will need to set GEMINI_API_KEY environment variable or you can provide the API Key directly:

```python
ai = Genkit(
  plugins=[GoogleAI(api_key='...')]
)
```

### Gemini API in Vertex AI (`VertexAI`)

To use models via Vertex AI, ensure you have authenticated with Google Cloud (e.g., via `gcloud auth application-default login`).

```python
from genkit.ai import Genkit
from genkit.plugins.google_genai import VertexAI

ai = Genkit(
  plugins=[VertexAI()],
  model='vertexai/gemini-2.5-flash', # optional
)
```

You can specify the `location` and `project` ID, among other configuration options available in the `VertexAI` constructor.

```python
ai = Genkit(
  plugins=[VertexAI(
    location='us-east1',
    project='my-project-id',
  )],
)
```
