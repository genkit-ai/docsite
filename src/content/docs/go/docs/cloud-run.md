---
title: Genkit with Cloud Run
description: Learn how to deploy Genkit Go flows as web services using Cloud Run.
---

You can deploy Genkit flows as web services using Cloud Run. This page,
as an example, walks you through the process of deploying the default sample
flow.

1.  Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) if
    you haven't already.

2.  Create a new Google Cloud project using the
    [Cloud console](https://console.cloud.google.com) or choose an existing one.
    The project must be linked to a billing account.

    After you create or choose a project, configure the Google Cloud CLI to use
    it:

    ```bash
    gcloud auth login

    gcloud init
    ```

3.  Create a directory for the Genkit sample project:

    ```bash
    mkdir -p ~/tmp/genkit-cloud-project

    cd ~/tmp/genkit-cloud-project
    ```

    If you're going to use an IDE, open it to this directory.

4.  Initialize a Go module in your project directory:

    ```bash
    go mod init example/cloudrun

    go mod get github.com/firebase/genkit/go
    ```

5.  Create a sample app using Genkit:

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

6.  Make API credentials available to your deployed function. Choose which
    credentials you need based on your choice in the sample above:

    <details>
    <summary>Gemini (Google AI)</summary>

    1.  Make sure Google AI is
        [available in your region](https://ai.google.dev/available_regions).

    2.  [Generate an API key](https://aistudio.google.com/app/apikey) for the
        Gemini API using Google AI Studio.

    3.  Make the API key available in the Cloud Run environment:

        1.  In the Cloud console, enable the
            [Secret Manager API](https://console.cloud.google.com/apis/library/secretmanager.googleapis.com?project=_).
        2.  On the
            [Secret Manager](https://console.cloud.google.com/security/secret-manager?project=_)
            page, create a new secret containing your API key.
        3.  After you create the secret, on the same page, grant your default
            compute service account access to the secret with the
            **Secret Manager Secret Accessor** role. (You can look up the name
            of the default compute service account on the IAM page.)

        In a later step, when you deploy your service, you will need to
        reference the name of this secret.

    </details>

    <details>
    <summary>Gemini (Vertex AI)</summary>

    1.  In the Cloud console,
        [Enable the Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=_)
        for your project.

    2.  On the [IAM](https://console.cloud.google.com/iam-admin/iam?project=_)
        page, ensure that the **Default compute service account** is granted
        the **Vertex AI User** role.

    </details>

    The only secret you need to set up for this tutorial is for the model
    provider, but in general, you must do something similar for each service
    your flow uses.

7.  **Optional**: Try your flow in the developer UI:

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

        1.  Click **jokesFlow**.

        2.  On the **Input JSON** tab, provide a subject for the model:

            ```json
            "bananas"
            ```

        3.  Click **Run**.

8.  If everything's working as expected so far, you can build and deploy the
    flow:

    <details>
    <summary>Gemini (Google AI)</summary>

    ```bash
    gcloud run deploy --port 3400 \
      --update-secrets=GEMINI_API_KEY=<your-secret-name>:latest
    ```

    </details>

    <details>
    <summary>Gemini (Vertex AI)</summary>

    ```bash
    gcloud run deploy --port 3400 \
      --set-env-vars GOOGLE_CLOUD_PROJECT=<your-gcloud-project> \
      --set-env-vars GOOGLE_CLOUD_LOCATION=us-central1
    ```

    (`GOOGLE_CLOUD_LOCATION` configures the Vertex API region you want to
    use.)

    </details>

    Choose `N` when asked if you want to allow unauthenticated invocations.
    Answering `N` will configure your service to require IAM credentials. See
    [Authentication](https://cloud.google.com/run/docs/authenticating/overview)
    in the Cloud Run docs for information on providing these credentials.

After deployment finishes, the tool will print the service URL. You can test
it with `curl`:

```bash
curl -X POST https://<service-url>/menuSuggestionFlow \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" -d '"bananas"'
```
