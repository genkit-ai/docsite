---
title: Defining AI workflows
description: Learn how to define and use Genkit flows in Go to structure your AI logic.
---

The core of your app's AI features is generative model requests, but it's rare
that you can simply take user input, pass it to the model, and display the model
output back to the user. Usually, there are pre- and post-processing steps that
must accompany the model call. For example:

*   Retrieving contextual information to send with the model call.
*   Retrieving the history of the user's current session, for example in a chat
    app.
*   Using one model to reformat the user input in a way that's suitable to pass
    to another model.
*   Evaluating the "safety" of a model's output before presenting it to the
    user.
*   Combining the output of several models.

Every step of this workflow must work together for any AI-related task to
succeed.

In Genkit, you represent this tightly-linked logic using a construction called a
flow. Flows are written just like functions, using ordinary Go code, but
they add additional capabilities intended to ease the development of AI
features:

*   **Type safety**: Input and output schemas, which provides both static and
    runtime type checking.
*   **Integration with developer UI**: Debug flows independently of your
    application code using the developer UI. In the developer UI, you can run
    flows and view traces for each step of the flow.
*   **Simplified deployment**: Deploy flows directly as web API endpoints, using
    any platform that can host a web app.

Genkit's flows are lightweight and unobtrusive, and don't force your app to
conform to any specific abstraction. All of the flow's logic is written in
standard Go, and code inside a flow doesn't need to be flow-aware.

## Defining and calling flows

In its simplest form, a flow just wraps a function. The following example wraps
a function that calls `Generate()`:

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
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	menuSuggestionFlow := genkit.DefineFlow(g, "menuSuggestionFlow",
		func(ctx context.Context, theme string) (string, error) {
			resp, err := genkit.Generate(ctx, g,
				ai.WithPrompt("Invent a menu item for a %s themed restaurant.", theme),
			)
			if err != nil {
				return "", err
			}

			return resp.Text(), nil
		})

	// Use the flow (example)
	_, _ = menuSuggestionFlow.Run(ctx, "pirate")

	// Blocks end of program execution to use the developer UI.
	select {}
}
```

Just by wrapping your `genkit.Generate()` calls like this, you add some
functionality: Doing so lets you run the flow from the Genkit CLI and from the
developer UI, and is a requirement for several of Genkit's features,
including deployment and observability (later sections discuss these topics).

### Input and output schemas

One of the most important advantages Genkit flows have over directly calling a
model API is type safety of both inputs and outputs. When defining flows, you
can define schemas, in much the same way as you define the output schema of a
`genkit.Generate()` call; however, unlike with `genkit.Generate()`, you can also
specify an input schema.

Here's a refinement of the last example, which defines a flow that takes a
string as input and outputs an object:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

type MenuItem struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	menuSuggestionFlow := genkit.DefineFlow(g, "menuSuggestionFlow",
		func(ctx context.Context, theme string) (MenuItem, error) {
			item, _, err := genkit.GenerateData[MenuItem](ctx, g,
				ai.WithPrompt("Invent a menu item for a %s themed restaurant.", theme),
			)
			return item, err
		})

	// Use the flow (example)
	_, _ = menuSuggestionFlow.Run(ctx, "bistro")

	// Blocks end of program execution to use the developer UI.
	select {}
}
```

Note that the schema of a flow does not necessarily have to line up with the
schema of the `genkit.Generate()` calls within the flow (in fact, a flow might
not even contain `genkit.Generate()` calls). Here's a variation of the example
that calls `genkit.GenerateData()`, but uses the structured
output to format a simple string, which the flow returns. Note how we pass
`MenuItem` as a type parameter; this is the equivalent of passing the
`WithOutputType()` option and getting a value of that type in response.

```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

type MenuItem struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	menuSuggestionMarkdownFlow := genkit.DefineFlow(g, "menuSuggestionMarkdownFlow",
		func(ctx context.Context, theme string) (string, error) {
			item, _, err := genkit.GenerateData[MenuItem](ctx, g,
				ai.WithPrompt("Invent a menu item for a %s themed restaurant.", theme),
			)
			if err != nil {
				return "", err
			}

			return fmt.Sprintf("**%s**: %s", item.Name, item.Description), nil
		})

	// Use the flow (example)
	_, _ = menuSuggestionMarkdownFlow.Run(ctx, "sci-fi")

	// Blocks end of program execution to use the developer UI.
	select {}
}
```

### Calling flows

Once you've defined a flow, you can call it from your Go code:

```go
item, err := menuSuggestionFlow.Run(ctx, "bistro")
```

The argument to the flow must conform to the input schema.

If you defined an output schema, the flow response will conform to it. For
example, if you set the output schema to `MenuItem`, the flow output will
contain its properties:

```go
item, err := menuSuggestionFlow.Run(ctx, "bistro")
if err != nil {
    log.Fatal(err)
}

log.Println(item.Name) // Assuming MenuItem has Name field
log.Println(item.Description) // Assuming MenuItem has Description field
```

## Streaming flows

Flows support streaming using an interface similar to `genkit.Generate()`'s
streaming interface. Streaming is useful when your flow generates a large
amount of output, because you can present the output to the user as it's being
generated, which improves the perceived responsiveness of your app. As a
familiar example, chat-based LLM interfaces often stream their responses to the
user as they are generated.

Here's an example of a flow that supports streaming:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/core"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

type Menu struct {
	Theme string     `json:"theme"`
	Items []MenuItem `json:"items"`
}

type MenuItem struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	menuSuggestionFlow := genkit.DefineStreamingFlow(g, "menuSuggestionFlow",
		func(ctx context.Context, theme string, callback core.StreamCallback[string]) (Menu, error) {
			item, _, err := genkit.GenerateData[MenuItem](ctx, g,
				ai.WithPrompt("Invent a menu item for a %s themed restaurant.", theme),
				ai.WithStreaming(func(ctx context.Context, chunk *ai.ModelResponseChunk) error {
					// Here, you could process the chunk in some way before sending it to
					// the output stream using StreamCallback. In this example, we output
					// the text of the chunk, unmodified.
					return callback(ctx, chunk.Text())
				}),
			)
			if err != nil {
				// Return zero value for Menu along with the error
				return Menu{}, err
			}

			return Menu{
				Theme: theme,
				Items: []MenuItem{item},
			}, nil
		})

	// Use the flow (example)
	_, _ = menuSuggestionFlow.Run(ctx, "fantasy") // Non-streaming call still works

	// Blocks end of program execution to use the developer UI.
	select {}
}
```

The `string` type in `StreamCallback[string]` specifies the type of
values your flow streams. This does not necessarily need to be the same
type as the return type, which is the type of the flow's complete output
(`Menu` in this example).

In this example, the values streamed by the flow are directly coupled to
the values streamed by the `genkit.Generate()` call inside the flow.
Although this is often the case, it doesn't have to be: you can output values
to the stream using the callback as often as is useful for your flow.

### Calling streaming flows

Streaming flows can be run like non-streaming flows with
`menuSuggestionFlow.Run(ctx, "bistro")` or they can be streamed:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/core"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

type Menu struct {
	Theme string     `json:"theme"`
	Items []MenuItem `json:"items"`
}

type MenuItem struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	// Assume menuSuggestionFlow is defined as in the previous example
	menuSuggestionFlow := genkit.DefineStreamingFlow(g, "menuSuggestionFlow",
		func(ctx context.Context, theme string, callback core.StreamCallback[string]) (Menu, error) {
			item, _, err := genkit.GenerateData[MenuItem](ctx, g,
				ai.WithPrompt("Invent a menu item for a %s themed restaurant.", theme),
				ai.WithStreaming(func(ctx context.Context, chunk *ai.ModelResponseChunk) error {
					return callback(ctx, chunk.Text())
				}),
			)
			if err != nil {
				return Menu{}, err
			}
			return Menu{Theme: theme, Items: []MenuItem{item}}, nil
		})

	streamCh, err := menuSuggestionFlow.Stream(ctx, "bistro")
	if err != nil {
		log.Fatal(err)
	}

	for result := range streamCh {
		if result.Err != nil {
			log.Fatalf("Stream error: %v", result.Err)
		}
		if result.Done {
			// Access the final output (Menu)
			finalOutput := result.Output
			log.Printf("Menu with %s theme:\n", finalOutput.Theme)
			for _, item := range finalOutput.Items {
				log.Printf(" - %s: %s", item.Name, item.Description)
			}
		} else {
			// Access the streamed chunk (string)
			chunk := result.Stream
			log.Println("Stream chunk:", chunk)
		}
	}

	// Blocks end of program execution to use the developer UI.
	select {}
}
```

## Running flows from the command line

You can run flows from the command line using the Genkit CLI tool:

```bash
genkit flow:run menuSuggestionFlow '"French"'
```

For streaming flows, you can print the streaming output to the console by adding
the `-s` flag:

```bash
genkit flow:run menuSuggestionFlow '"French"' -s
```

Running a flow from the command line is useful for testing a flow, or for
running flows that perform tasks needed on an ad hoc basis&mdash;for example, to
run a flow that ingests a document into your vector database.

## Debugging flows

One of the advantages of encapsulating AI logic within a flow is that you can
test and debug the flow independently from your app using the Genkit developer
UI.

The developer UI relies on the Go app continuing to run, even if the logic has
completed. If you are just getting started and Genkit is not part of a broader
app, add `select {}` as the last line of `main()` to prevent the app from
shutting down so that you can inspect it in the UI.

To start the developer UI, run the following command from your project
directory:

```bash
genkit start -- go run .
```

From the **Run** tab of developer UI, you can run any of the flows defined in
your project:

![Screenshot of the Flow runner](./resources/devui-flows.png)

After you've run a flow, you can inspect a trace of the flow invocation by
either clicking **View trace** or looking at the **Inspect** tab.

## Deploying flows

You can deploy your flows directly as web API endpoints, ready for you to call
from your app clients. Deployment is discussed in detail on several other pages,
but this section gives brief overviews of your deployment options.

### `net/http` Server

To deploy a flow using any Go hosting platform, such as Cloud Run, define
your flow using `DefineFlow()` and start a `net/http` server with the provided
flow handler:

```go
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/firebase/genkit/go/ai" // Assuming MenuItem is defined elsewhere or here
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
	"github.com/firebase/genkit/go/plugins/server"
)

type MenuItem struct { // Define MenuItem if not already defined
	Name        string `json:"name"`
	Description string `json:"description"`
}

func main() {
	ctx := context.Background()

	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	menuSuggestionFlow := genkit.DefineFlow(g, "menuSuggestionFlow",
		func(ctx context.Context, theme string) (MenuItem, error) {
			// Flow implementation...
			item, _, err := genkit.GenerateData[MenuItem](ctx, g,
				ai.WithPrompt("Invent a menu item for a %s themed restaurant.", theme),
			)
			return item, err
		})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /menuSuggestionFlow", genkit.Handler(menuSuggestionFlow))
	log.Fatal(server.Start(ctx, "127.0.0.1:3400", mux))
}
```

`server.Start()` is an optional helper function that starts the server and
manages its lifecycle, including capturing interrupt signals to ease local
development, but you may use your own method.

To serve all the flows defined in your codebase, you can use `ListFlows()`:

```go
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
	"github.com/firebase/genkit/go/plugins/server"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	// Assume flows are defined elsewhere and registered with 'g'

	mux := http.NewServeMux()
	for _, flow := range genkit.ListFlows(g) {
		// Capture the flow variable for the closure
		currentFlow := flow
		mux.HandleFunc("POST /"+currentFlow.Name(), genkit.Handler(currentFlow))
	}
	log.Fatal(server.Start(ctx, "127.0.0.1:3400", mux))
}
```

You can call a flow endpoint with a POST request as follows:

```bash
curl -X POST "http://localhost:3400/menuSuggestionFlow" \
    -H "Content-Type: application/json" -d '{"data": "banana"}'
```

### Other server frameworks

You can also use other server frameworks to deploy your flows. For
example, you can use [Gin](https://gin-gonic.com/) with just a few lines:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
	"github.com/gin-gonic/gin"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))
	if err != nil {
		log.Fatal(err)
	}

	// Assume flows are defined elsewhere and registered with 'g'

	router := gin.Default()
	for _, flow := range genkit.ListFlows(g) {
		// Capture the flow variable for the closure
		currentFlow := flow
		router.POST("/"+currentFlow.Name(), func(c *gin.Context) {
			genkit.Handler(currentFlow)(c.Writer, c.Request)
		})
	}
	log.Fatal(router.Run(":3400"))
}
```

For information on deploying to specific platforms, see
[Genkit with Cloud Run](./cloud-run.md).
