---
title: Deploy with Flask
description: Learn how to build a Flask application using Genkit for Python.
---

Prerequisites: make sure you have everything installed from the [Get Started](/python/get-started/) guide.

1.  Install Genkit Flask plugin

    ```bash
    pip install git+https://github.com/firebase/genkit#subdirectory=py/plugins/flask
    ```

    Or create a `requirements.txt` file

    ```text title="requirements.txt"
    genkit-plugin-flask @ git+https://github.com/firebase/genkit#subdirectory=py/plugins/google-genai
    ```

2.  Create `main.py` file:

    ```python title="main.py"
    from flask import Flask

    from genkit.ai import Genkit
    from genkit.plugins.flask import genkit_flask_handler
    from genkit.plugins.google_genai import (
        GoogleGenai,
        google_genai_name,
    )

    ai = Genkit(
        plugins=[GoogleGenai()],
        model=google_genai_name('gemini-2.0-flash'),
    )

    app = Flask(__name__)


    @app.post('/joke')
    @genkit_flask_handler(ai)
    @ai.flow()
    async def joke(name: str, ctx):
        return await ai.generate(
            on_chunk=ctx.send_chunk,
            prompt=f'tell a medium sized joke about {name}',
        )
    ```

3.  Run the app:

    ```bash
    flask --app main.py run
    ```

    Or with Dev UI:

    ```bash
    genkit start -- flask --app main.py run
    ```

    You can invoke the flow via HTTP:

    ```bash
    curl -X POST http://127.0.0.1:5000/joke -d '{"data": "banana"}' -H 'content-Type: application/json' -H 'Accept: text/event-stream'
    ```

    or you can use [Genkit client library](https://js.api.genkit.dev/modules/genkit.beta_client.html).

## Authorization and custom context

You can do custom authorization and custom context parsing by passing a `ContextProvider` implementation.

```python
from genkit.types import GenkitError

# Assume parse_request_header is defined elsewhere
# def parse_request_header(auth_header):
#     # Example implementation: Replace with your actual logic
#     if auth_header and auth_header.startswith('Bearer '):
#         token = auth_header.split(' ')[1]
#         # Validate token and return username, or None/raise error
#         if token == "valid-token":
#             return "testuser"
#     return None

async def my_context_provider(request):
    # This function needs access to the request object from Flask
    # The exact way to get headers might depend on how genkit_flask_handler passes the request
    auth_header = request.headers.get('authorization')
    username = parse_request_header(auth_header) # Call the (assumed) function
    return {'username': username}

@app.post('/say_hi')
@genkit_flask_handler(ai, context_provider=my_context_provider)
@ai.flow()
async def say_hi(name: str, ctx):
    if not ctx.context.get('username'):
        raise GenkitError(status='UNAUTHENTICATED', message='user not provided')

    return await ai.generate(
        on_chunk=ctx.send_chunk,
        prompt=f'say hi to {ctx.context.get("username")}',
    )
```

`parse_request_header` can be your custom authorization header parsing/validation.
