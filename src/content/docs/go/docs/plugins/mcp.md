---
title: MCP (Model Context Protocol) plugin
description: Learn how to integrate MCP servers with Genkit for Go and expose Genkit tools as MCP servers.
---

The MCP (Model Context Protocol) plugin enables integration with MCP servers and allows you to expose Genkit tools as MCP servers. You can connect to external MCP servers to use their tools and prompts, manage multiple server connections, or turn your Genkit application into an MCP server.

## Prerequisites

This plugin requires MCP servers to be available. For testing and development, you can use:

- `mcp-server-time` - Spmple server Exposing time operations
- `@modelcontextprotocol/server-everything` - A comprehensive MCP server for testing
- Custom MCP servers written in Python, TypeScript, or other languages

## Configuration

### Single Server Connection

To connect to a single MCP server, import the `mcp` package and create a `GenkitMCPClient`:

```go
import "github.com/firebase/genkit/go/plugins/mcp"
```

```go
ctx := context.Background()
g, err := genkit.Init(ctx)
if err != nil {
    log.Fatal(err)
}

client, err := mcp.NewGenkitMCPClient(mcp.MCPClientOptions{
    Name: "mcp-server-time",
    Stdio: &mcp.StdioConfig{
        Command: "uvx",
        Args: []string{"mcp-server-time"},
    },
})
if err != nil {
    log.Fatal(err)
}
```

### Multiple Server Management

To manage connections to multiple MCP servers, use `GenkitMCPManager`:

```go
import "github.com/firebase/genkit/go/plugins/mcp"
```

```go
manager, err := mcp.NewMCPManager(mcp.MCPManagerOptions{
    Name: "my-app",
    MCPServers: []mcp.MCPServerConfig{
        {
            Name: "everything-server",
            Config: mcp.MCPClientOptions{
                Name: "everything-server",
                Stdio: &mcp.StdioConfig{
                    Command: "npx",
                    Args: []string{"-y", "@modelcontextprotocol/server-everything"},
                },
            },
        },
        {
            Name: "mcp-server-time",
            Config: mcp.MCPClientOptions{
                Name: "mcp-server-time",
                Stdio: &mcp.StdioConfig{
                    Command: "uvx",
                    Args: []string{"mcp-server-time"},
                },
            },
        },
    },
})
if err != nil {
    log.Fatal(err)
}
```

### Exposing as MCP Server

To expose your Genkit tools as an MCP server, create an `MCPServer`:

```go
import "github.com/firebase/genkit/go/plugins/mcp"
```

```go
// Define your tools first
addTool := genkit.DefineTool(g, "add", "Add two numbers",
    func(ctx *ai.ToolContext, input struct{A, B int}) (int, error) {
        return input.A + input.B, nil
    })

// Create MCP server
server := mcp.NewMCPServer(g, mcp.MCPServerOptions{
    Name:    "genkit-calculator",
    Version: "1.0.0",
})
```

## Usage

### Using Tools from MCP Servers

Once connected to an MCP server, you can retrieve and use its tools:

```go
// Get a specific tool
echoTool, err := client.GetTool(ctx, g, "echo")
if err != nil {
    log.Fatal(err)
}

// Use the tool in your workflow
resp, err := genkit.Generate(ctx, g, 
    ai.WithModel(myModel),
    ai.WithPrompt("Use the echo tool to repeat this message"),
    ai.WithTools(echoTool),
)
if err != nil {
    log.Fatal(err)
}
```

### Using Prompts from MCP Servers

Retrieve and use prompts from connected MCP servers:

```go
// Get a specific prompt
simplePrompt, err := client.GetPrompt(ctx, g, "simple_prompt")
if err != nil {
    log.Fatal(err)
}

// Use the prompt
resp, err := genkit.Generate(ctx, g,
    ai.WithModel(myModel),
    ai.WithPrompt(simplePrompt),
)
```

### Managing Multiple Servers

With `GenkitMCPManager`, you can dynamically manage server connections:

```go
// Connect to a new server at runtime
err = manager.Connect("weather", mcp.MCPClientOptions{
    Name: "weather-server",
    Stdio: &mcp.StdioConfig{
        Command: "python",
        Args: []string{"weather_server.py"},
    },
})
if err != nil {
    log.Fatal(err)
}

// Disconnect a server completely
err = manager.Disconnect("weather")
if err != nil {
    log.Fatal(err)
}

// Get all tools from all active servers
tools, err := manager.GetActiveTools(ctx, g)
if err != nil {
    log.Fatal(err)
}

// Get a specific prompt from a specific server
prompt, err := manager.GetPrompt(ctx, g, "mcp-server-time", "current_time", nil)
if err != nil {
    log.Fatal(err)
}
```

For individual client management (disable/enable without disconnecting), you would access the clients directly. The manager focuses on connection lifecycle management.

### Running as MCP Server

To run your Genkit application as an MCP server:

```go
// Option 1: Auto-expose all defined tools
server := mcp.NewMCPServer(g, mcp.MCPServerOptions{
    Name:    "genkit-calculator",
    Version: "1.0.0",
})

// Option 2: Expose only specific tools
server = mcp.NewMCPServer(g, mcp.MCPServerOptions{
    Name:    "genkit-calculator", 
    Version: "1.0.0",
    Tools:   []ai.Tool{addTool, multiplyTool},
})

// Start the MCP server
log.Println("Starting MCP server...")
if err := server.ServeStdio(ctx); err != nil {
    log.Fatal(err)
}
```

## Transport Options

### Stdio Transport

You can use either Stdio or SSE 

```go
Stdio: &mcp.StdioConfig{
    Command: "uvx",
    Args: []string{"mcp-server-time"},
    Env: []string{"DEBUG=1"},
}
```

```go
SSE: &mcp.SSEConfig{
    BaseURL: "http://localhost:3000/sse",
}
```

## Testing

### Testing Your MCP Server

To test your Genkit application as an MCP server:

```bash
# Run your server
go run main.go

# Test with MCP Inspector in another terminal
npx @modelcontextprotocol/inspector go run main.go
```

## Configuration Options

### MCPClientOptions

```go
type MCPClientOptions struct {
    Name     string          // Server identifier
    Version  string          // Version number (defaults to "1.0.0")
    Disabled bool            // Disabled flag to temporarily disable this client
    Stdio    *StdioConfig    // Stdio transport config
    SSE      *SSEConfig      // SSE transport config
}
```

### StdioConfig

```go
type StdioConfig struct {
    Command string   // Command to run
    Args    []string // Command arguments
    Env     []string // Environment variables
}
```

### MCPServerConfig

```go
type MCPServerConfig struct {
    Name   string            // Name for this server
    Config MCPClientOptions  // Client configuration options
}
```

### MCPManagerOptions

```go
type MCPManagerOptions struct {
    Name       string              // Manager instance name
    Version    string              // Manager version (defaults to "1.0.0")
    MCPServers []MCPServerConfig   // Array of server configurations
}
```

### MCPServerOptions

```go
type MCPServerOptions struct {
    Name    string     // Server name
    Version string     // Server version
    Tools   []ai.Tool  // Specific tools to expose (optional)
}
```