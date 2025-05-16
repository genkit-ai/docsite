---
title: Deploy flows to any app hosting platform
description: Learn how to deploy Genkit Go flows as web services using any service that can host a Go binary.
---

You can deploy Genkit flows as web services using any service that can host a Go
binary. This page, as an example, walks you through the general process of
deploying the default sample flow, and points out where you must take
provider-specific actions.

1.  Create a directory for the Genkit sample project:

    ```bash
    mkdir -p ~/tmp/genkit-cloud-project

    cd ~/tmp/genkit-cloud-project
    ```

    If you're going to use an IDE, open it to this directory.

2.  Initialize a Go module in your project directory:

    ```bash
    go mod init example/cloudrun

    go get github.com/firebase/genkit/go
    ```

3.  Create a sample app using Genkit:

    ```go
    package main

    import (
        "context"
        "fmt"
        "log"
        "net/http"
        "os"

        "github.com/firebase/genkit/go/ai"
        "github.com/firebase/genkit/go/genkit"
        "github.com/firebase/genkit/go/plugins/googlegenai"
        "github.com/firebase/genkit/go/plugins/server"
    )

    func main() {
        ctx := context.Background()

        // Initialize Genkit with the Google AI plugin and Gemini 2.0 Flash.
        // Alternatively, use &googlegenai.VertexAI{} and "vertexai/gemini-2.0-flash"
        // to use Vertex AI as the provider instead.
        g, err := genkit.Init(ctx,
            genkit.WithPlugins(&googlegenai.GoogleAI{}),
            genkit.WithDefaultModel("googleai/gemini-2.0-flash"),
        )
        if err != nil {
            log.Fatalf("failed to initialize Genkit: %w", err)
        }

        flow := genkit.DefineFlow(g, "jokesFlow", func(ctx context.Context, topic string) (string, error) {
            resp, err := genkit.Generate(ctx, g,
                ai.WithPrompt(`Tell a short joke about %s. Be creative!`, topic),
            )
            if err != nil {
                return "", fmt.Errorf("failed to generate joke: %w", err)
            }

            return resp.Text(), nil
        })

        mux := http.NewServeMux()
        mux.HandleFunc("POST /jokesFlow", genkit.Handler(flow))
        log.Fatal(server.Start(ctx, "127.0.0.1:"+os.Getenv("PORT"), mux))
    }
    ```

4.  Implement some form of authentication and authorization to gate access to
    the flows you plan to deploy.

    Because most generative AI services are metered, you most likely do not want
    to allow open access to any endpoints that call them. Some hosting services
    provide an authentication layer as a frontend to apps deployed on them,
    which you can use for this purpose.

5.  Make API credentials available to your deployed function. Do one of the
    following, depending on the model provider you chose:

    <details>
    <summary>Gemini (Google AI)</summary>

    1.  Make sure Google AI is [available in your
        region](https://ai.google.dev/available_regions).

    2.  [Generate an API key](https://aistudio.google.com/app/apikey) for the
        Gemini API using Google AI Studio.

    3.  Make the API key available in the deployed environment.

    Most app hosts provide some system for securely handling secrets such as
    API keys. Often, these secrets are available to your app in the form of
    environment variables. If you can assign your API key to the
    `GEMINI_API_KEY` variable, Genkit will use it automatically. Otherwise,
    you need to modify the `googlegenai.GoogleAI` plugin struct to explicitly
    set the key. (But don't embed the key directly in code! Use the secret
    management facilities provided by your hosting provider.)

    </details>

    <details>
    <summary>Gemini (Vertex AI)</summary>

    1.  In the Cloud console, [Enable the Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=_)
        for your project.

    2.  On the [IAM](https://console.cloud.google.com/iam-admin/iam?project=_)
        page, create a service account for accessing the Vertex AI API if you
        don't alreacy have one.

        Grant the account the **Vertex AI User** role.

    3.  [Set up Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc#on-prem)
        in your hosting environment.

    4.  Configure the plugin with your Google Cloud project ID and the Vertex
        AI API location you want to use. You can do so either by setting the
        `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` environment
        variables in your hosting environment, or in your
        `googlegenai.VertexAI{}` constructor.

        The only secret you need to set up for this tutorial is for the model
        provider, but in general, you must do something similar for each
        service your flow uses.

    </details>

6.  **Optional**: Try your flow in the developer UI:

    1.  Set up your local environment for the model provider you chose:

        <details>
        <summary>Gemini (Google AI)</summary>

        ```bash
        export GEMINI_API_KEY=<your API key>
        ```

        </details>

        <details>
        <summary>Gemini (Vertex AI)</summary>

        ```bash
        export GOOGLE_CLOUD_PROJECT=<your project ID>

        export GOOGLE_CLOUD_LOCATION=us-central1

        gcloud auth application-default login
        ```

        </details>

    2.  Start the UI:

        ```bash
        genkit start -- go run .
        ```

    3.  In the developer UI (`http://localhost:4000/`), run the flow:

    4.  Click **jokesFlow**.

    5.  On the **Input JSON** tab, provide a subject for the model:

        ```json
        "bananas"
        ```

    6.  Click **Run**.

7.  If everything's working as expected so far, you can build and deploy the
    flow using your provider's tools.
