---
title: Writing Genkit plugins
description: Learn the fundamentals of creating Genkit plugins in Go to extend its capabilities with new models, retrievers, indexers, and more.
---

Genkit's capabilities are designed to be extended by plugins. Genkit plugins are
configurable modules that can provide models, retrievers, indexers, trace
stores, and more. You've already seen plugins in action just by using Genkit:

```go
package main

import (
	"context"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
	// Assuming server plugin is needed for a complete example
	// "github.com/firebase/genkit/go/plugins/server"
)

func main() {
	ctx := context.Background()
	g, err := genkit.Init(ctx,
		genkit.WithPlugins(
			&googlegenai.GoogleAI{APIKey: "YOUR_API_KEY"}, // Replace with your key or env var logic
			&googlegenai.VertexAI{ProjectID: "my-project", Location: "us-central1"},
		),
	)
	if err != nil {
		log.Fatalf("Genkit initialization failed: %v", err)
	}
	// ... rest of your Genkit application logic ...
}
```

The Vertex AI plugin takes configuration (such as the user's Google Cloud
project ID) and registers a variety of new models, embedders, and more with the
Genkit registry. The registry serves as a lookup service for named actions at
runtime, and powers Genkit's local UI for running and inspecting models,
prompts, and more.

## Creating a plugin

In Go, a Genkit plugin is a package that adheres to a small set of
conventions. A single module can contain several plugins.

### Provider ID

Every plugin must have a unique identifier string that distinguishes it from
other plugins. Genkit uses this identifier as a namespace for every resource
your plugin defines, to prevent naming conflicts with other plugins.

For example, if your plugin has an ID `yourplugin` and provides a model called
`text-generator`, the full model identifier will be `yourplugin/text-generator`.

This provider ID needs to be exported and you should define it once for your
plugin and use it consistently when required by a Genkit function.

```go
package yourplugin

const providerID = "yourplugin"
```

### Standard exports

Every plugin should define and export the following symbols to conform to the
`genkit.Plugin` interface:

-   A struct type that encapsulates all of the configuration options accepted by
    the plugin.

    For any plugin options that are secret values, such as API keys, you should
    offer both a config option and a default environment variable to configure
    it. This lets your plugin take advantage of the secret-management features
    offered by many hosting providers (such as Cloud Secret Manager, which you
    can use with Cloud Run). For example:

    ```go
    package yourplugin

    import "os"

    // MyPlugin holds the configuration for your plugin.
    type MyPlugin struct {
    	APIKey string // Can be set directly or via YOURPLUGIN_API_KEY env var
    	// Other options you may allow to configure...
    	SomeOption string `json:"someOption"`
    }

    func (p *MyPlugin) resolveAPIKey() string {
    	if p.APIKey != "" {
    		return p.APIKey
    	}
    	// Default to environment variable if APIKey field is not set
    	return os.Getenv("YOURPLUGIN_API_KEY")
    }
    ```

-   A `Name()` method on the struct that returns the provider ID.

    ```go
    package yourplugin

    func (p *MyPlugin) Name() string {
    	return providerID
    }
    ```

-   An `Init()` method on the struct with a declaration like the following:

    ```go
    package yourplugin

    import (
    	"context"
    	"errors"
    	"fmt" // Import fmt for error formatting

    	"github.com/firebase/genkit/go/genkit"
    )

    func (p *MyPlugin) Init(ctx context.Context, g *genkit.Genkit) error {
    	apiKey := p.resolveAPIKey() // Use the helper method
    	if apiKey == "" {
    		return errors.New("API key is required for yourplugin")
    	}

    	// Perform any setup steps required by your plugin.
    	// For example:
    	// - Confirm that any required configuration values are specified.
    	// - Assign default values to any unspecified optional settings.
    	if p.SomeOption == "" {
    		p.SomeOption = "defaultValue"
    	}

    	// - Verify that the given configuration options are valid together.
    	//   (Example: if option A is set, option B must also be set)

    	// - Create any shared resources required by the rest of your plugin.
    	//   For example, create clients for any services your plugin accesses.
    	//   myServiceClient, err := NewServiceClient(apiKey)
    	//   if err != nil {
    	//       return fmt.Errorf("failed to create service client: %w", err)
    	//   }
    	//   Store the client or other resources in the plugin struct or globally accessible way.

    	fmt.Printf("Initializing %s plugin with option: %s\n", p.Name(), p.SomeOption)

    	// Register models, retrievers, etc. using genkit.Define... functions
    	// Example: DefineMyModel(g, myServiceClient)

    	return nil // Return nil on successful initialization
    }

    // Ensure MyPlugin implements genkit.Plugin
    var _ genkit.Plugin = &MyPlugin{}
    ```

    In this function, perform any setup steps required by your plugin. For
    example:

    -   Confirm that any required configuration values are specified and assign
        default values to any unspecified optional settings.
    -   Verify that the given configuration options are valid together.
    -   Create any shared resources required by the rest of your plugin. For
        example, create clients for any services your plugin accesses.

    To the extent possible, the resources provided by your plugin shouldn't
    assume that any other plugins have been installed before this one.

    This method will be called automatically during `genkit.Init()` when the
    user passes the plugin into the `WithPlugins()` option.

## Building plugin features

A single plugin can activate many new things within Genkit. For example, the
Vertex AI plugin activates several new models as well as an embedder.

### Model plugins

Genkit model plugins add one or more generative AI models to the Genkit
registry. A model represents any generative model that is capable of receiving a
prompt as input and generating text, media, or data as output.

See [Writing a Genkit model plugin](./plugin-authoring-models.md).

### Telemetry plugins

Genkit telemetry plugins configure Genkit's OpenTelemetry instrumentation to
export traces, metrics, and logs to a particular monitoring or visualization
tool.

See [Writing a Genkit telemetry plugin](./plugin-authoring-telemetry.md).

## Publishing a plugin

Genkit plugins can be published as normal Go packages. To increase
discoverability, your package should have `genkit` somewhere in its name so it
can be found with a simple search on
[`pkg.go.dev`](https://pkg.go.dev/search?q=genkit). Any of the following are
good choices:

-   `github.com/yourorg/genkit-plugins/servicename`
-   `github.com/yourorg/your-repo/genkit/servicename`
