---
title: Get started with Genkit using Go
description: Learn how to set up Genkit and make your first generative AI request in a Go application.
---

This guide shows you how to get started with Genkit in a Go app.

If you discover issues with the libraries or this documentation please report
them in our [GitHub repository](https://github.com/firebase/genkit/).

## Make your first request

1.  Install Go 1.24 or later. See [Download and install](https://go.dev/doc/install)
    in the official Go docs.

2.  Initialize a new Go project directory with the Genkit package:

    ```bash
    mkdir genkit-intro && cd genkit-intro

    go mod init example/genkit-intro

    go get github.com/firebase/genkit/go
    ```

3.  Create a `main.go` file with the following sample code:

    ```go
    package main

    import (
        "context"
        "log"

        "github.com/firebase/genkit/go/ai"
        "github.com/firebase/genkit/go/genkit"
        "github.com/firebase/genkit/go/plugins/googlegenai"
    )

    func main() {
        ctx := context.Background()

        // Initialize Genkit with the Google AI plugin and Gemini 2.0 Flash.
        g, err := genkit.Init(ctx,
            genkit.WithPlugins(&googlegenai.GoogleAI{}),
            genkit.WithDefaultModel("googleai/gemini-2.0-flash"),
        )
        if err != nil {
            log.Fatalf("could not initialize Genkit: %v", err)
        }

        resp, err := genkit.Generate(ctx, g, ai.WithPrompt("What is the meaning of life?"))
        if err != nil {
            log.Fatalf("could not generate model response: %v", err)
        }

        log.Println(resp.Text())
    }
    ```

4.  Configure your Gemini API key by setting the `GEMINI_API_KEY` environment
    variable:

    ```bash
    export GEMINI_API_KEY=<your API key>
    ```

    If you don't already have one, [create a key in Google AI Studio](https://aistudio.google.com/apikey).
    Google AI provides a generous free-of-charge tier and does not require a
    credit card to get started.

5.  Run the app to see the model response:

    ```bash
    go run .
    # Example output (may vary):
    # There is no single universally agreed-upon meaning of life; it's a deeply
    # personal question. Many find meaning through connection, growth,
    # contribution, happiness, or discovering their own purpose.
    ```

## Next steps

Now that you're set up to make model requests with Genkit, learn how to use more
Genkit capabilities to build your AI-powered apps and workflows. To get started
with additional Genkit capabilities, see the following guides:

*   [Developer tools](./devtools.md): Learn how to set up and use
    Genkit's CLI and developer UI to help you locally test and debug your app.
*   [Generating content](./models.md): Learn how to use Genkit's
    unified generation API to generate text and structured data from any
    supported model.
*   [Creating flows](./flows.md): Learn how to use special Genkit
    functions, called flows, that provide end-to-end observability for workflows
    and rich debugging from Genkit tooling.
*   [Managing prompts](./dotprompt.md): Learn how Genkit helps you
    manage your prompts and configuration together as code.
