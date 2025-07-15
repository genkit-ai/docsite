---
title: Generating content with AI models
description: Learn how to use Genkit's unified API in Go to generate content with various AI models like LLMs and image generators.
---

At the heart of generative AI are AI _models_. The two most prominent
examples of generative models are large language models (LLMs) and image
generation models. These models take input, called a _prompt_ (most commonly
text, an image, or a combination of both), and from it produce as output text,
an image, or even audio or video.

The output of these models can be surprisingly convincing: LLMs generate text
that appears as though it could have been written by a human being, and image
generation models can produce images that are very close to real photographs or
artwork created by humans.

In addition, LLMs have proven capable of tasks beyond simple text generation:

- Writing computer programs.
- Planning subtasks that are required to complete a larger task.
- Organizing unorganized data.
- Understanding and extracting information data from a corpus of text.
- Following and performing automated activities based on a text description of
  the activity.

There are many models available to you, from several different providers. Each
model has its own strengths and weaknesses and one model might excel at one task
but perform less well at others. Apps making use of generative AI can often
benefit from using multiple different models depending on the task at hand.

As an app developer, you typically don't interact with generative AI models
directly, but rather through services available as web APIs. Although these
services often have similar functionality, they all provide them through
different and incompatible APIs. If you want to make use of multiple model
services, you have to use each of their proprietary SDKs, potentially
incompatible with each other. And if you want to upgrade from one model to the
newest and most capable one, you might have to build that integration all over
again.

Genkit addresses this challenge by providing a single interface that abstracts
away the details of accessing potentially any generative AI model service, with
several prebuilt implementations already available. Building your AI-powered
app around Genkit simplifies the process of making your first generative AI call
and makes it equally straightforward to combine multiple models or swap one
model for another as new models emerge.

### Before you begin

If you want to run the code examples on this page, first complete the steps in
the [Get started](/go/docs/get-started-go) guide. All of the examples assume that you
have already installed Genkit as a dependency in your project.

### Models supported by Genkit

Genkit is designed to be flexible enough to use potentially any generative AI
model service. Its core libraries define the common interface for working with
models, and model plugins define the implementation details for working with a
specific model and its API.

The Genkit team maintains plugins for working with models provided by Vertex AI,
Google Generative AI, and Ollama:

- Gemini family of LLMs, through the
  [Google GenAI plugin](/go/docs/plugins/google-genai).
- Gemma 3, Llama 4, and many more open models, through the
  [Ollama plugin](/go/docs/plugins/ollama)
  (you must host the Ollama server yourself).

### Loading and configuring model plugins

Before you can use Genkit to start generating content, you need to load and
configure a model plugin. If you're coming from the Get Started guide,
you've already done this. Otherwise, see the [Get Started](/go/docs/get-started-go)
guide or the individual plugin's documentation and follow the steps there before
continuing.

### The `genkit.Generate()` function

In Genkit, the primary interface through which you interact with generative AI
models is the `genkit.Generate()` function.

The simplest `genkit.Generate()` call specifies the model you want to use and a
text prompt:

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

	g, err := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{}),
		genkit.WithDefaultModel("googleai/gemini-2.5-flash"),
	)
	if err != nil {
		log.Fatalf("could not initialize Genkit: %v", err)
	}

	resp, err := genkit.Generate(ctx, g,
		ai.WithPrompt("Invent a menu item for a pirate themed restaurant."),
	)
	if err != nil {
		log.Fatalf("could not generate model response: %v", err)
	}

	log.Println(resp.Text())
}
```

When you run this brief example, it will print out some debugging information
followed by the output of the `genkit.Generate()` call, which will usually be
Markdown text as in the following example:

```md
## The Blackheart's Bounty

**A hearty stew of slow-cooked beef, spiced with rum and molasses, served in a
hollowed-out cannonball with a side of crusty bread and a dollop of tangy
pineapple salsa.**

**Description:** This dish is a tribute to the hearty meals enjoyed by pirates
on the high seas. The beef is tender and flavorful, infused with the warm spices
of rum and molasses. The pineapple salsa adds a touch of sweetness and acidity,
balancing the richness of the stew. The cannonball serving vessel adds a fun and
thematic touch, making this dish a perfect choice for any pirate-themed
adventure.
```

Run the script again and you'll get a different output.

The preceding code sample sent the generation request to the default model,
which you specified when you configured the Genkit instance.

You can also specify a model for a single `genkit.Generate()` call:

```go
resp, err := genkit.Generate(ctx, g,
	ai.WithModelName("googleai/gemini-2.5-pro"),
	ai.WithPrompt("Invent a menu item for a pirate themed restaurant."),
)
```

A model string identifier looks like `providerid/modelid`, where the provider ID
(in this case, `googleai`) identifies the plugin, and the model ID is a
plugin-specific string identifier for a specific version of a model.

These examples also illustrate an important point: when you use
`genkit.Generate()` to make generative AI model calls, changing the model you
want to use is a matter of passing a different value to the model
parameter. By using `genkit.Generate()` instead of the native model SDKs, you
give yourself the flexibility to more easily use several different models in
your app and change models in the future.

So far you have only seen examples of the simplest `genkit.Generate()` calls.
However, `genkit.Generate()` also provides an interface for more advanced
interactions with generative models, which you will see in the sections that
follow.

### System prompts

Some models support providing a _system prompt_, which gives the model
instructions as to how you want it to respond to messages from the user. You can
use the system prompt to specify characteristics such as a persona you want the
model to adopt, the tone of its responses, and the format of its responses.

If the model you're using supports system prompts, you can provide one with the
`ai.WithSystem()` option:

```go
resp, err := genkit.Generate(ctx, g,
	ai.WithSystem("You are a food industry marketing consultant."),
	ai.WithPrompt("Invent a menu item for a pirate themed restaurant."),
)
```

For models that don't support system prompts, `ai.WithSystem()` simulates it by
modifying the request to appear _like_ a system prompt.

### Model parameters

The `genkit.Generate()` function takes a `ai.WithConfig()` option, through which
you can specify optional settings that control how the model generates content:

```go
resp, err := genkit.Generate(ctx, g,
	ai.WithModelName("googleai/gemini-2.5-flash"),
	ai.WithPrompt("Invent a menu item for a pirate themed restaurant."),
	ai.WithConfig(&googlegenai.GeminiConfig{
		MaxOutputTokens: 500,
		StopSequences:   ["<end>", "<fin>"],
		Temperature:     0.5,
		TopP:            0.4,
		TopK:            50,
	}),
)
```

The exact parameters that are supported depend on the individual model and model
API. However, the parameters in the previous example are common to almost every
model. The following is an explanation of these parameters:

#### Parameters that control output length

**MaxOutputTokens**

LLMs operate on units called _tokens_. A token usually, but does not
necessarily, map to a specific sequence of characters. When you pass a prompt to
a model, one of the first steps it takes is to _tokenize_ your prompt string
into a sequence of tokens. Then, the LLM generates a sequence of tokens from the
tokenized input. Finally, the sequence of tokens gets converted back into text,
which is your output.

The maximum output tokens parameter sets a limit on how many tokens to
generate using the LLM. Every model potentially uses a different tokenizer, but
a good rule of thumb is to consider a single English word to be made of 2 to 4
tokens.

As stated earlier, some tokens might not map to character sequences. One such
example is that there is often a token that indicates the end of the sequence:
when an LLM generates this token, it stops generating more. Therefore, it's
possible and often the case that an LLM generates fewer tokens than the maximum
because it generated the "stop" token.

**StopSequences**

You can use this parameter to set the tokens or token sequences that, when
generated, indicate the end of LLM output. The correct values to use here
generally depend on how the model was trained, and are usually set by the model
plugin. However, if you have prompted the model to generate another stop
sequence, you might specify it here.

Note that you are specifying character sequences, and not tokens per se. In most
cases, you will specify a character sequence that the model's tokenizer maps to
a single token.

#### Parameters that control "creativity"

The _temperature_, _top-p_, and _top-k_ parameters together control how
"creative" you want the model to be. This section provides very brief
explanations of what these parameters mean, but the more important point is
this: these parameters are used to adjust the character of an LLM's output. The
optimal values for them depend on your goals and preferences, and are likely to
be found only through experimentation.

**Temperature**

LLMs are fundamentally token-predicting machines. For a given sequence of tokens
(such as the prompt) an LLM predicts, for each token in its vocabulary, the
likelihood that the token comes next in the sequence. The temperature is a
scaling factor by which these predictions are divided before being normalized to
a probability between 0 and 1.

Low temperature values&mdash;between 0.0 and 1.0&mdash;amplify the difference in
likelihoods between tokens, with the result that the model will be even less
likely to produce a token it already evaluated to be unlikely. This is often
perceived as output that is less creative. Although 0.0 is technically not a
valid value, many models treat it as indicating that the model should behave
deterministically, and to only consider the single most likely token.

High temperature values&mdash;those greater than 1.0&mdash;compress the
differences in likelihoods between tokens, with the result that the model
becomes more likely to produce tokens it had previously evaluated to be
unlikely. This is often perceived as output that is more creative. Some model
APIs impose a maximum temperature, often 2.0.

**TopP**

_Top-p_ is a value between 0.0 and 1.0 that controls the number of possible
tokens you want the model to consider, by specifying the cumulative probability
of the tokens. For example, a value of 1.0 means to consider every possible
token (but still take into account the probability of each token). A value of
0.4 means to only consider the most likely tokens, whose probabilities add up to
0.4, and to exclude the remaining tokens from consideration.

**TopK**

_Top-k_ is an integer value that also controls the number of possible tokens you
want the model to consider, but this time by explicitly specifying the maximum
number of tokens. Specifying a value of 1 means that the model should behave
deterministically.

#### Experiment with model parameters

You can experiment with the effect of these parameters on the output generated
by different model and prompt combinations by using the Developer UI. Start the
developer UI with the `genkit start` command and it will automatically load all
of the models defined by the plugins configured in your project. You can quickly
try different prompts and configuration values without having to repeatedly make
these changes in code.

#### Pair model with its config

Given that each provider or even a specific model may have its own configuration
schema or warrant certain settings, it may be error prone to set separate
options using `ai.WithModelName()` and `ai.WithConfig()` since the latter is not
strongly typed to the former.

To pair a model with its config, you can create a model reference that you can
pass into the generate call instead:

```go
model := googlegenai.GoogleAIModelRef("gemini-2.5-flash", &googlegenai.GeminiConfig{
	MaxOutputTokens: 500,
	StopSequences:   ["<end>", "<fin>"],
	Temperature:     0.5,
	TopP:            0.4,
	TopK:            50,
})

resp, err := genkit.Generate(ctx, g,
	ai.WithModel(model),
	ai.WithPrompt("Invent a menu item for a pirate themed restaurant."),
)
if err != nil {
	log.Fatal(err)
}
```

The constructor for the model reference will enforce that the correct config
type is provided which may reduce mismatches.

### Structured output

When using generative AI as a component in your application, you often want
output in a format other than plain text. Even if you're just generating content
to display to the user, you can benefit from structured output simply for the
purpose of presenting it more attractively to the user. But for more advanced
applications of generative AI, such as programmatic use of the model's output,
or feeding the output of one model into another, structured output is a must.

In Genkit, you can request structured output from a model by specifying an
output type when you call `genkit.Generate()`:

```go
type MenuItem struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Calories    int      `json:"calories"`
	Allergens   []string `json:"allergens"`
}

resp, err := genkit.Generate(ctx, g,
	ai.WithPrompt("Invent a menu item for a pirate themed restaurant."),
	ai.WithOutputType(MenuItem{}),
)
if err != nil {
	log.Fatal(err) // One possible error is that the response does not conform to the type.
}
```

Model output types are specified as JSON schema using the
[`invopop/jsonschema`](https://github.com/invopop/jsonschema) package. This
provides runtime type checking, which bridges the gap between static Go types
and the unpredictable output of generative AI models. This system lets you write
code that can rely on the fact that a successful generate call will always
return output that conforms to your Go types.

When you specify an output type in `genkit.Generate()`, Genkit does several
things behind the scenes:

- Augments the prompt with additional guidance about the selected output
  format. This also has the side effect of specifying to the model what
  content exactly you want to generate (for example, not only suggest a menu
  item but also generate a description, a list of allergens, and so on).
- Verifies that the output conforms to the schema.
- Marshals the model output into a Go type.

To get structured output from a successful generate call, call `Output()` on the
model response with an empty value of the type:

```go
var item MenuItem
if err := resp.Output(&item); err != nil {
	log.Fatalf(err)
}

log.Printf("%s (%d calories, %d allergens): %s\n",
	item.Name, item.Calories, len(item.Allergens), item.Description)
```

Alternatively, you can use `genkit.GenerateData()` for a more succinct call:

```go
item, resp, err := genkit.GenerateData[MenuItem](ctx, g,
	ai.WithPrompt("Invent a menu item for a pirate themed restaurant."),
)
if err != nil {
	log.Fatal(err)
}

log.Printf("%s (%d calories, %d allergens): %s\n",
	item.Name, item.Calories, len(item.Allergens), item.Description)
```

This function requires the output type parameter but automatically sets the
`ai.WithOutputType()` option and calls `ModelResponse.Output()` before returning
the value.

#### Handling errors

Note in the prior example that the `genkit.Generate()` call can result in an
error. One possible error can happen when the model fails to generate output
that conforms to the schema. The best strategy for dealing with such errors will
depend on your exact use case, but here are some general hints:

- **Try a different model**. For structured output to succeed, the model must
  be capable of generating output in JSON. The most powerful LLMs like Gemini
  are versatile enough to do this; however, smaller models, such as some of
  the local models you would use with Ollama, might not be able to generate
  structured output reliably unless they have been specifically trained to do
  so.

- **Simplify the schema**. LLMs may have trouble generating complex or deeply
  nested types. Try using clear names, fewer fields, or a flattened structure
  if you are not able to reliably generate structured data.

- **Retry the `genkit.Generate()` call**. If the model you've chosen only
  rarely fails to generate conformant output, you can treat the error as you
  would treat a network error, and retry the request using some kind of
  incremental back-off strategy.

### Streaming

When generating large amounts of text, you can improve the experience for your
users by presenting the output as it's generated&mdash;streaming the output. A
familiar example of streaming in action can be seen in most LLM chat apps: users
can read the model's response to their message as it's being generated, which
improves the perceived responsiveness of the application and enhances the
illusion of chatting with an intelligent counterpart.

In Genkit, you can stream output using the `ai.WithStreaming()` option:

```go
resp, err := genkit.Generate(ctx, g,
	ai.WithPrompt("Suggest a complete menu for a pirate themed restaurant."),
	ai.WithStreaming(func(ctx context.Context, chunk *ai.ModelResponseChunk) error {
		// Do something with the chunk...
		log.Println(chunk.Text())
		return nil
	}),
)
if err != nil {
	log.Fatal(err)
}

log.Println(resp.Text())
```

<!-- TODO: Talk about streaming structured data once it's supported. -->

### Multimodal input

The examples you've seen so far have used text strings as model prompts. While
this remains the most common way to prompt generative AI models, many models can
also accept other media as prompts. Media prompts are most often used in
conjunction with text prompts that instruct the model to perform some operation
on the media, such as to caption an image or transcribe an audio recording.

The ability to accept media input and the types of media you can use are
completely dependent on the model and its API. For example, the Gemini 2.0
series of models can accept images, video, and audio as prompts.

To provide a media prompt to a model that supports it, instead of passing a
simple text prompt to `genkit.Generate()`, pass an array consisting of a media
part and a text part. This example specifies an image using a
publicly-accessible HTTPS URL.

```go
resp, err := genkit.Generate(ctx, g,
	ai.WithModelName("googleai/gemini-2.5-flash"),
	ai.WithMessages(
		NewUserMessage(
			NewMediaPart("image/jpeg", "https://example.com/photo.jpg"),
			NewTextPart("Compose a poem about this image."),
		),
	),
)
```

You can also pass media data directly by encoding it as a data URL. For
example:

```go
image, err := ioutil.ReadFile("photo.jpg")
if err != nil {
	log.Fatal(err)
}

resp, err := genkit.Generate(ctx, g,
	ai.WithModelName("googleai/gemini-2.5-flash"),
	ai.WithMessages(
		NewUserMessage(
			NewMediaPart("image/jpeg", "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(image)),
			NewTextPart("Compose a poem about this image."),
		),
	),
)
```

All models that support media input support both data URLs and HTTPS URLs. Some
model plugins add support for other media sources. For example, the Vertex AI
plugin also lets you use Cloud Storage (`gs://`) URLs.

<!-- TODO: Talk about generating media when either Imagen or native image gen is ready. -->

### Next steps

#### Learn more about Genkit

- As an app developer, the primary way you influence the output of generative
  AI models is through prompting. Read
  [Managing prompts with Dotprompt](/go/docs/dotprompt) to learn
  how Genkit helps you develop effective prompts and manage them in your
  codebase.
- Although `genkit.Generate()` is the nucleus of every generative AI powered
  application, real-world applications usually require additional work before
  and after invoking a generative AI model. To reflect this, Genkit introduces
  the concept of _flows_, which are defined like functions but add additional
  features such as observability and simplified deployment. To learn more, see
  [Defining AI workflows](/go/docs/flows).

#### Advanced LLM use

There are techniques your app can use to reap even more benefit from LLMs.

- One way to enhance the capabilities of LLMs is to prompt them with a list of
  ways they can request more information from you, or request you to perform
  some action. This is known as _tool calling_ or _function calling_. Models
  that are trained to support this capability can respond to a prompt with a
  specially-formatted response, which indicates to the calling application
  that it should perform some action and send the result back to the LLM along
  with the original prompt. Genkit has library functions that automate both
  the prompt generation and the call-response loop elements of a tool calling
  implementation. See [Tool calling](/go/docs/tool-calling) to learn more.
- Retrieval-augmented generation (RAG) is a technique used to introduce
  domain-specific information into a model's output. This is accomplished by
  inserting relevant information into a prompt before passing it on to the
  language model. A complete RAG implementation requires you to bring several
  technologies together: text embedding generation models, vector databases, and
  large language models. See [Retrieval-augmented generation (RAG)](/go/docs/rag) to
  learn how Genkit simplifies the process of coordinating these various
  elements.
