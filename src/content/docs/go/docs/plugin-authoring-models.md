---
title: Writing a Genkit model plugin
description: Learn how to create a Genkit model plugin in Go to integrate new generative AI models.
---

Genkit model plugins add one or more generative AI models to the Genkit
registry. A model represents any generative model that is capable of receiving a
prompt as input and generating text, media, or data as output.

## Before you begin

Read [Writing Genkit plugins](/go/docs/plugin-authoring) for information about writing
any kind of Genkit plug-in, including model plugins. In particular, note that
every plugin must export a type that conforms to the `genkit.Plugin` interface,
which includes a `Name()` and a `Init()` function.

## Model definitions

Generally, a model plugin will make one or more `genkit.DefineModel()` calls in
its `Init` function&mdash;once for each model the plugin is providing an
interface to.

A model definition consists of three components:

1.  Metadata declaring the model's capabilities.
2.  A configuration type with any specific parameters supported by the model.
3.  A generation function that accepts an `ai.ModelRequest` and returns an
    `ai.ModelResponse`, presumably using an AI model to generate the latter.

At a high level, here's what it looks like in code:

```go
package myplugin

import (
	"context"
	"fmt"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
)

const providerID = "myProvider" // Unique ID for your plugin provider

// MyModelConfig defines the configuration options for your model.
// Embed ai.GenerationCommonConfig for common options.
type MyModelConfig struct {
	ai.GenerationCommonConfig
	AnotherCustomOption string `json:"anotherCustomOption,omitempty"`
	CustomOption        int    `json:"customOption,omitempty"`
}

// DefineModel registers your custom model with Genkit.
func DefineMyModel(g *genkit.Genkit) {
	genkit.DefineModel(g, providerID, "my-model",
		&ai.ModelInfo{
			Label: "My Model", // User-friendly label
			Supports: &ai.ModelSupports{
				Multiturn:  true,  // Does the model support multi-turn chats?
				SystemRole: true,  // Does the model support system messages?
				Media:      false, // Can the model accept media input?
				Tools:      false, // Does the model support function calling (tools)?
			},
			Versions: []string{"my-model-001"}, // List supported versions/aliases
		},
		// The generation function
		func(ctx context.Context, mr *ai.ModelRequest, cb ai.ModelStreamCallback) (*ai.ModelResponse, error) {
			// Verify that the request includes a configuration that conforms to your schema.
			var cfg MyModelConfig
			if mr.Config != nil {
				// Attempt to cast the config; handle potential type mismatch
				if typedCfg, ok := mr.Config.(*MyModelConfig); ok {
					cfg = *typedCfg
				} else {
					// Handle incorrect config type if necessary, or rely on default values
					// For simplicity, this example proceeds with default cfg if cast fails
				}
			}
			// Now 'cfg' holds the configuration, either from the request or default.

			// Use your custom logic to convert Genkit's ai.ModelRequest into a form
			// usable by the model's native API.
			apiRequest, err := apiRequestFromGenkitRequest(mr, cfg) // Pass config too
			if err != nil {
				return nil, fmt.Errorf("failed to create API request: %w", err)
			}

			// Send the request to the model API, using your own code or the model
			// API's client library.
			apiResponse, err := callModelAPI(ctx, apiRequest) // Pass context if needed
			if err != nil {
				return nil, fmt.Errorf("model API call failed: %w", err)
			}

			// Use your custom logic to convert the model's response to Genkit's ai.ModelResponse.
			response, err := genResponseFromAPIResponse(apiResponse)
			if err != nil {
				return nil, fmt.Errorf("failed to convert API response: %w", err)
			}

			return response, nil
		},
	)
}

// Placeholder for the function that converts Genkit request to your API's format
func apiRequestFromGenkitRequest(mr *ai.ModelRequest, cfg MyModelConfig) (interface{}, error) {
	// Implementation depends on your specific model API
	fmt.Printf("Converting Genkit request with config: %+v\n", cfg)
	// ... conversion logic ...
	return "your-api-request-format", nil // Replace with actual request object
}

// Placeholder for the function that calls your model's API
func callModelAPI(ctx context.Context, apiRequest interface{}) (interface{}, error) {
	// Implementation depends on your specific model API client library
	// ... API call logic ...
	return "your-api-response-format", nil // Replace with actual response object
}

// Placeholder for the function that converts your API's response to Genkit's format
func genResponseFromAPIResponse(apiResponse interface{}) (*ai.ModelResponse, error) {
	// Implementation depends on your specific model API response format
	// ... conversion logic ...
	return &ai.ModelResponse{
		Candidates: []*ai.Candidate{
			{
				Message: &ai.Message{
					Content: []*ai.Part{ai.NewTextPart("Generated response text")},
					Role:    ai.RoleModel,
				},
				FinishReason: ai.FinishReasonStop,
			},
		},
	}, nil // Replace with actual response conversion
}

// Example Plugin implementation
type MyPlugin struct{}

func (p *MyPlugin) Name() string {
	return providerID
}

func (p *MyPlugin) Init(ctx context.Context, g *genkit.Genkit) error {
	DefineMyModel(g)
	// Define other models or resources here
	return nil
}

// Ensure MyPlugin implements genkit.Plugin
var _ genkit.Plugin = &MyPlugin{}
```

### Declaring model capabilities

Every model definition must contain, as part of its metadata, an `ai.ModelInfo`
value that declares which features the model supports. Genkit uses this
information to determine certain behaviors, such as verifying whether certain
inputs are valid for the model. For example, if the model doesn't support
multi-turn interactions, then it's an error to pass it a message history.

Note that these declarations refer to the capabilities of the model as provided
by your plugin, and do not necessarily map one-to-one to the capabilities of the
underlying model and model API. For example, even if the model API doesn't
provide a specific way to define system messages, your plugin might still
declare support for the system role, and implement it as special logic that
inserts system messages into the user prompt.

### Defining your model's config schema

To specify the generation options a model supports, define and export a
configuration type. Genkit has an `ai.GenerationCommonConfig` type that contains
options frequently supported by generative AI model services, which you can
embed or use outright.

Your generation function should verify that the request contains the correct
options type.

### Transforming requests and responses

The generation function carries out the primary work of a Genkit model plugin:
transforming the `ai.ModelRequest` from Genkit's common format into a format
that is supported by your model's API, and then transforming the response from
your model into the `ai.ModelResponse` format used by Genkit.

Sometimes, this may require massaging or manipulating data to work around model
limitations. For example, if your model does not natively support a `system`
message, you may need to transform a prompt's system message into a user-model
message pair.

## Exports

In addition to the resources that all plugins must export, a model plugin should
also export the following:

- A generation config type, as discussed [earlier](#defining-your-models-config-schema).

- A `Model()` function, which returns references to your plugin's defined
  models. Often, this can be:

  ```go
  func Model(g *genkit.Genkit, name string) *ai.Model {
      return genkit.LookupModel(g, providerID, name)
  }
  ```

- A `ModelRef` function, which creates a model reference paired with its
  config that can validate the type and be passed around together:

  ```go
  func ModelRef(name string, config *MyModelConfig) *ai.ModelRef {
      return ai.NewModelRef(name, config)
  }
  ```

- **Optional**: A `DefineModel()` function, which lets users define models
  that your plugin can provide, but that you do not automatically define.
  There are two main reasons why you might want to provide such a function:

  - Your plugin provides access to too many models to practically register
    each one. For example, the Ollama plugin can provide access to dozens of
    different models, with more added frequently. For this reason, it
    doesn't automatically define any models, and instead requires the user
    to call `DefineModel()` for each model they want to use.

  - To give your users the ability to use newly-released models that you
    have not yet added to your plugin.

  A plugin's `DefineModel()` function is typically a frontend to
  `genkit.DefineModel()` that defines a generation function, but lets the user
  specify the model name and model capabilities.
