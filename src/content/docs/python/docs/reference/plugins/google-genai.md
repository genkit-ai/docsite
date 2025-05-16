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

# Option 1: Configure via environment variable GEMINI_API_KEY
# Ensure GEMINI_API_KEY is set in your environment
ai = Genkit(
  plugins=[GoogleAI()],
  model='googleai/gemini-1.5-flash', # Optional: Set a default model
)

# Option 2: Provide API key directly
# ai = Genkit(
#   plugins=[GoogleAI(api_key='YOUR_GEMINI_API_KEY')]
# )
```

You will need to set the `GEMINI_API_KEY` environment variable, or you can provide the API Key directly during plugin initialization.

### Gemini API in Vertex AI (`VertexAI`)

To use models via Vertex AI, ensure you have authenticated with Google Cloud (e.g., via `gcloud auth application-default login`).

```python
from genkit.ai import Genkit
from genkit.plugins.google_genai import VertexAI

# Basic configuration (uses default project and location from gcloud)
ai = Genkit(
  plugins=[VertexAI()],
  model='vertexai/gemini-1.5-flash', # Optional: Set a default model
)

# Explicit configuration
# ai = Genkit(
#   plugins=[VertexAI(
#     location='us-central1', # Specify the desired region
#     project='your-gcp-project-id', # Specify your Google Cloud project ID
#     # Other configuration options can be added here
#   )],
# )
```

You can specify the `location` and `project` ID, among other configuration options available in the `VertexAI` constructor.
