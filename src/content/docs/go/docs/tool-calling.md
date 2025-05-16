---
title: Tool calling
description: Learn how to use tool calling (function calling) with Genkit Go to give LLMs access to external information and actions.
---

_Tool calling_, also known as _function calling_, is a structured way to give
LLMs the ability to make requests back to the application that called it. You
define the tools you want to make available to the model, and the model will
make tool requests to your app as necessary to fulfill the prompts you give it.

The use cases of tool calling generally fall into a few themes:

**Giving an LLM access to information it wasn't trained with**

- Frequently changing information, such as a stock price or the current
  weather.
- Information specific to your app domain, such as product information or user
  profiles.

Note the overlap with [retrieval augmented generation](/go/docs/rag) (RAG), which is also
a way to let an LLM integrate factual information into its generations. RAG is a
heavier solution that is most suited when you have a large amount of information
or the information that's most relevant to a prompt is ambiguous. On the other
hand, if a function call or database lookup is all that's necessary for
retrieving the information the LLM needs, tool calling is more appropriate.

**Introducing a degree of determinism into an LLM workflow**

- Performing calculations that the LLM cannot reliably complete itself.
- Forcing an LLM to generate verbatim text under certain circumstances, such
  as when responding to a question about an app's terms of service.

**Performing an action when initiated by an LLM**

- Turning on and off lights in an LLM-powered home assistant
- Reserving table reservations in an LLM-powered restaurant agent

## Before you begin

If you want to run the code examples on this page, first complete the steps in
the [Get started](/go/docs/get-started-go) guide. All of the examples assume that you
have already set up a project with Genkit dependencies installed.

This page discusses one of the advanced features of Genkit model abstraction, so
before you dive too deeply, you should be familiar with the content on the
[Generating content with AI models](/go/docs/models) page. You should also be familiar
with Genkit's system for defining input and output schemas, which is discussed
on the [Flows](/go/docs/flows) page.

## Overview of tool calling

At a high level, this is what a typical tool-calling interaction with an LLM
looks like:

1.  The calling application prompts the LLM with a request and also includes in
    the prompt a list of tools the LLM can use to generate a response.
2.  The LLM either generates a complete response or generates a tool call
    request in a specific format.
3.  If the caller receives a complete response, the request is fulfilled and the
    interaction ends; but if the caller receives a tool call, it performs
    whatever logic is appropriate and sends a new request to the LLM containing
    the original prompt or some variation of it as well as the result of the
    tool call.
4.  The LLM handles the new prompt as in Step 2.

For this to work, several requirements must be met:

- The model must be trained to make tool requests when it's needed to complete
  a prompt. Most of the larger models provided through web APIs such as Gemini
  can do this, but smaller and more specialized models often cannot. Genkit
  will throw an error if you try to provide tools to a model that doesn't
  support it.
- The calling application must provide tool definitions to the model in the
  format it expects.
- The calling application must prompt the model to generate tool calling
  requests in the format the application expects.

## Tool calling with Genkit

Genkit provides a single interface for tool calling with models that support it.
Each model plugin ensures that the last two criteria mentioned in the previous
section are met, and the `genkit.Generate()` function automatically carries out
the tool-calling loop described earlier.

### Model support

Tool calling support depends on the model, the model API, and the Genkit plugin.
Consult the relevant documentation to determine if tool calling is likely to be
supported. In addition:

- Genkit will throw an error if you try to provide tools to a model that
  doesn't support it.
- If the plugin exports model references, the `ModelInfo.Supports.Tools`
  property will indicate if it supports tool calling.

### Defining tools

Use the `genkit.DefineTool()` function to write tool definitions:

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

// Define the input structure for the tool
type WeatherInput struct {
	Location string `json:"location" jsonschema_description:"Location to get weather for"`
}

func main() {
	ctx := context.Background()

	g, err := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{}),
		genkit.WithDefaultModel("googleai/gemini-1.5-flash"), // Updated model name
	)
	if err != nil {
		log.Fatalf("Genkit initialization failed: %v", err)
	}

	getWeatherTool := genkit.DefineTool(
		g, "getWeather", "Gets the current weather in a given location",
		func(ctx context.Context, input WeatherInput) (string, error) {
			// Here, we would typically make an API call or database query. For this
			// example, we just return a fixed value.
			log.Printf("Tool 'getWeather' called for location: %s", input.Location)
			return fmt.Sprintf("The current weather in %s is 63°F and sunny.", input.Location), nil
		})

	log.Println("Tool defined:", getWeatherTool.Name())
	// ... rest of application logic, potentially using the tool ...
}
```

The syntax here looks just like the `genkit.DefineFlow()` syntax; however, you
must write a description. Take special care with the wording and descriptiveness
of the description as it is vital for the LLM to decide to use it appropriately.

### Using tools

Include defined tools in your prompts to generate content.

**Using `genkit.Generate()`:**

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

type WeatherInput struct {
	Location string `json:"location" jsonschema_description:"Location to get weather for"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{}),
		genkit.WithDefaultModel("googleai/gemini-1.5-flash"),
	)
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	getWeatherTool := genkit.DefineTool(
		g, "getWeather", "Gets the current weather in a given location",
		func(ctx context.Context, input WeatherInput) (string, error) {
			return fmt.Sprintf("The current weather in %s is 63°F and sunny.", input.Location), nil
		})

	resp, err := genkit.Generate(ctx, g,
		ai.WithPrompt("What is the weather in San Francisco?"),
		ai.WithTools(getWeatherTool),
	)
	if err != nil {
		log.Fatalf("Generate failed: %v", err)
	}
	log.Println("Response:", resp.Text())
}
```

**Using `genkit.DefinePrompt()`:**

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

type WeatherInput struct {
	Location string `json:"location" jsonschema_description:"Location to get weather for"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{}),
		genkit.WithDefaultModel("googleai/gemini-1.5-flash"),
	)
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	getWeatherTool := genkit.DefineTool(
		g, "getWeather", "Gets the current weather in a given location",
		func(ctx context.Context, input WeatherInput) (string, error) {
			return fmt.Sprintf("The current weather in %s is 63°F and sunny.", input.Location), nil
		})

	weatherPrompt, err := genkit.DefinePrompt(g, "weatherPrompt",
		ai.WithPrompt("What is the weather in {{location}}?"),
		ai.WithTools(getWeatherTool),
		// Define input schema for the prompt itself
		ai.WithInputSchema(struct{ Location string }{})),
	)
	if err != nil {
		log.Fatalf("DefinePrompt failed: %v", err)
	}

	resp, err := weatherPrompt.Execute(ctx,
		ai.WithInput(map[string]any{"location": "San Francisco"}),
	)
	if err != nil {
		log.Fatalf("Prompt Execute failed: %v", err)
	}
	log.Println("Response:", resp.Text())
}
```

**Using a `.prompt` file:**

Create a file named `prompts/weatherPrompt.prompt` (assuming default prompt directory):

```dotprompt
---
system: "Answer questions using the tools you have."
tools: [getWeather]
input:
  schema:
    location: string
---

What is the weather in {{location}}?
```

Then execute it in your Go code:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
)

type WeatherInput struct { // Tool input schema
	Location string `json:"location" jsonschema_description:"Location to get weather for"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{}),
		genkit.WithDefaultModel("googleai/gemini-1.5-flash"),
		// Ensure prompts directory is configured if not default
		// genkit.WithPromptDir("./prompts"),
	)
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	// Define the tool so it can be referenced in the prompt file
	_ = genkit.DefineTool(
		g, "getWeather", "Gets the current weather in a given location",
		func(ctx context.Context, input WeatherInput) (string, error) {
			return fmt.Sprintf("The current weather in %s is 63°F and sunny.", input.Location), nil
		})


	// Assuming prompt file named weatherPrompt.prompt exists in ./prompts dir.
	weatherPrompt := genkit.LookupPrompt(g, "weatherPrompt")
	if weatherPrompt == nil {
		log.Fatal("no prompt named 'weatherPrompt' found")
	}

	resp, err := weatherPrompt.Execute(ctx,
		ai.WithInput(map[string]any{"location": "San Francisco"}),
	)
	if err != nil {
		log.Fatalf("Prompt Execute failed: %v", err)
	}
	log.Println("Response:", resp.Text())
}
```

Genkit will automatically handle the tool call if the LLM needs to use the
`getWeather` tool to answer the prompt.

### Explicitly handling tool calls

If you want full control over this tool-calling loop, for example to apply more
complicated logic, set the `WithReturnToolRequests()` option to `true`. Now it's
your responsibility to ensure all of the tool requests are fulfilled:

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

type WeatherInput struct {
	Location string `json:"location" jsonschema_description:"Location to get weather for"`
}

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{}),
		genkit.WithDefaultModel("googleai/gemini-1.5-flash"),
	)
	if err != nil {
		log.Fatalf("Genkit init failed: %v", err)
	}

	getWeatherTool := genkit.DefineTool(
		g, "getWeather", "Gets the current weather in a given location",
		func(ctx context.Context, input WeatherInput) (string, error) {
			// Tool implementation...
			log.Printf("Explicit tool call for: %s", input.Location)
			return "sunny", nil
		},
	)

	// Initial generate call, asking for tool requests to be returned
	resp, err := genkit.Generate(ctx, g,
		ai.WithPrompt("What is the weather in San Francisco?"),
		ai.WithTools(getWeatherTool),
		ai.WithReturnToolRequests(true), // Explicitly handle tool requests
	)
	if err != nil {
		log.Fatalf("Initial Generate failed: %v", err)
	}

	// Check if the model requested a tool call
	toolRequests := resp.ToolRequests()
	if len(toolRequests) == 0 {
		log.Println("Model responded directly:", resp.Text())
		return // No tool call needed
	}

	// Process tool requests
	toolResponseParts := []*ai.Part{}
	for _, req := range toolRequests {
		tool := genkit.LookupTool(g, req.Name)
		if tool == nil {
			log.Printf("tool %q not found, skipping", req.Name)
			// Optionally return an error or a default response part
			toolResponseParts = append(toolResponseParts,
				ai.NewToolResponsePart(&ai.ToolResponse{
					Name:   req.Name,
					// Ref:    req.Ref, // Ref might not be available/needed depending on model
					Error: fmt.Sprintf("Tool %s not found", req.Name),
				}))
			continue
		}

		// Execute the tool. RunRaw takes the raw input from the model.
		output, err := tool.RunRaw(ctx, req.Input)
		if err != nil {
			log.Printf("tool %q execution failed: %v", tool.Name(), err)
			// Optionally return an error part
			toolResponseParts = append(toolResponseParts,
				ai.NewToolResponsePart(&ai.ToolResponse{
					Name:  req.Name,
					Error: err.Error(),
				}))
			continue
		}

		// Add the successful tool response part
		toolResponseParts = append(toolResponseParts,
			ai.NewToolResponsePart(&ai.ToolResponse{
				Name:   req.Name,
				Output: output,
			}))
	}

	// Send the tool responses back to the model
	finalResp, err := genkit.Generate(ctx, g,
		// Include original history and the new tool response message
		ai.WithMessages(append(resp.History(), ai.NewToolResponseMessage(toolResponseParts...))...),
		ai.WithTools(getWeatherTool), // Provide tools again if needed for multi-turn
	)
	if err != nil {
		log.Fatalf("Final Generate failed: %v", err)
	}

	log.Println("Final Response:", finalResp.Text())
}
```
