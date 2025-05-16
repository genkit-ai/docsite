---
title: Evaluation
description: Learn how to evaluate Genkit Go flows and models using built-in and third-party tools.
---

Evaluation is a form of testing that helps you validate your LLM's responses and
ensure they meet your quality bar.

Genkit supports third-party evaluation tools through plugins, paired
with powerful observability features that provide insight into the runtime state
of your LLM-powered applications. Genkit tooling helps you automatically extract
data including inputs, outputs, and information from intermediate steps to
evaluate the end-to-end quality of LLM responses as well as understand the
performance of your system's building blocks.

### Types of evaluation

Genkit supports two types of evaluation:

- **Inference-based evaluation**: This type of evaluation runs against a
  collection of pre-determined inputs, assessing the corresponding outputs for
  quality.

  This is the most common evaluation type, suitable for most use cases. This
  approach tests a system's actual output for each evaluation run.

  You can perform the quality assessment manually, by visually inspecting the
  results. Alternatively, you can automate the assessment by using an
  evaluation metric.

- **Raw evaluation**: This type of evaluation directly assesses the quality of
  inputs without any inference. This approach typically is used with automated
  evaluation using metrics. All required fields for evaluation (e.g., `input`,
  `context`, `output` and `reference`) must be present in the input dataset. This
  is useful when you have data coming from an external source (e.g., collected
  from your production traces) and you want to have an objective measurement of
  the quality of the collected data.

  For more information, see the [Advanced use](#advanced-use) section of this
  page.

This section explains how to perform inference-based evaluation using Genkit.

## Quick start

Perform these steps to get started quickly with Genkit.

### Setup

1.  Use an existing Genkit app or create a new one by following our
    [Get started](/go/docs/get-started-go) guide.

2.  Add the following code to define a simple RAG application to evaluate. For
    this guide, we use a dummy retriever that always returns the same documents.

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

    func main() {
        ctx := context.Background()

        // Initialize Genkit
        g, err := genkit.Init(ctx,
            genkit.WithPlugins(&googlegenai.GoogleAI{}),
            genkit.WithDefaultModel("googleai/gemini-2.0-flash"),
        )
        if err != nil {
            log.Fatalf("Genkit initialization error: %v", err)
        }

        // Dummy retriever that always returns the same facts
        dummyRetrieverFunc := func(ctx context.Context, req *ai.RetrieverRequest) (*ai.RetrieverResponse, error) {
            facts := []string{
                "Dog is man's best friend",
                "Dogs have evolved and were domesticated from wolves",
            }
            // Just return facts as documents.
            var docs []*ai.Document
            for _, fact := range facts {
                docs = append(docs, ai.DocumentFromText(fact, nil))
            }
            return &ai.RetrieverResponse{Documents: docs}, nil
        }
        factsRetriever := genkit.DefineRetriever(g, "local", "dogFacts", dummyRetrieverFunc)

        m := googlegenai.GoogleAIModel(g, "gemini-2.0-flash")
        if m == nil {
            log.Fatal("failed to find model")
        }

        // A simple question-answering flow
        genkit.DefineFlow(g, "qaFlow", func(ctx context.Context, query string) (string, error) {
            factDocs, err := ai.Retrieve(ctx, factsRetriever, ai.WithTextDocs(query))
            if err != nil {
                return "", fmt.Errorf("retrieval failed: %w", err)
            }
            llmResponse, err := genkit.Generate(ctx, g,
                ai.WithModelName("googleai/gemini-2.0-flash"),
                ai.WithPrompt("Answer this question with the given context: %s", query),
                ai.WithDocs(factDocs.Documents...)
            )
            if err != nil {
                return "", fmt.Errorf("generation failed: %w", err)
            }
            return llmResponse.Text(), nil
        })
    }
    ```

3.  You can optionally add evaluation metrics to your application to use while
    evaluating. This guide uses the `EvaluatorRegex` metric from the
    `evaluators` package.

    ```go
    import (
        "github.com/firebase/genkit/go/plugins/evaluators"
    )

    func main() {
        // ...

        metrics := []evaluators.MetricConfig{
            {
                MetricType: evaluators.EvaluatorRegex,
            },
        }

        // Initialize Genkit
        g, err := genkit.Init(ctx,
            genkit.WithPlugins(
                &googlegenai.GoogleAI{},
                &evaluators.GenkitEval{Metrics: metrics}, // Add this plugin
            ),
            genkit.WithDefaultModel("googleai/gemini-2.0-flash"),
        )
    }
    ```

    **Note:** Ensure that the `evaluators` package is
    installed in your go project:

    ```bash
    go get github.com/firebase/genkit/go/plugins/evaluators
    ```

4.  Start your Genkit application.

    ```bash
    genkit start -- go run main.go
    ```

### Create a dataset

Create a dataset to define the examples we want to use for evaluating our flow.

1.  Go to the Dev UI at `http://localhost:4000` and click the **Datasets**
    button to open the Datasets page.

2.  Click the **Create Dataset** button to open the create dataset dialog.

    a. Provide a `datasetId` for your new dataset. This guide uses
    `myFactsQaDataset`.

    b. Select `Flow` dataset type.

    c. Leave the validation target field empty and click **Save**

3.  Your new dataset page appears, showing an empty dataset. Add examples to it
    by following these steps:

    a. Click the **Add example** button to open the example editor panel.

    b. Only the `Input` field is required. Enter `"Who is man's best friend?"`
    in the `Input` field, and click **Save** to add the example has to your
    dataset.

    If you have configured the `EvaluatorRegex` metric and would like
    to try it out, you need to specify a Reference string that contains the
    pattern to match the output against. For the preceding input, set the
    `Reference output` text to `"(?i)dog"`, which is a case-insensitive regular-
    expression pattern to match the word "dog" in the flow output.

    c. Repeat steps (a) and (b) a couple of more times to add more examples.
    This guide adds the following example inputs to the dataset:

    ```text
    "Can I give milk to my cats?"
    "From which animals did dogs evolve?"
    ```

    If you are using the regular-expression evaluator, use the corresponding
    reference strings:

    ```text
    "(?i)don't know"
    "(?i)wolf|wolves"
    ```

    Note that this is a contrived example and the regular-expression
    evaluator may not be the right choice to evaluate the responses
    from `qaFlow`. However, this guide can be applied to any
    Genkit Go evaluator of your choice.

    By the end of this step, your dataset should have 3 examples in it, with the
    values mentioned above.

### Run evaluation and view results

To start evaluating the flow, click the **Run new evaluation** button on your
dataset page. You can also start a new evaluation from the _Evaluations_ tab.

1.  Select the `Flow` radio button to evaluate a flow.

2.  Select `qaFlow` as the target flow to evaluate.

3.  Select `myFactsQaDataset` as the target dataset to use for evaluation.

4.  If you have installed an evaluator metric using Genkit plugins,
    you can see these metrics in this page. Select the metrics that you want to
    use with this evaluation run. This is entirely optional: Omitting this step
    will still return the results in the evaluation run, but without any
    associated metrics.

    If you have not provided any reference values and are using the
    `EvaluatorRegex` metric, your evaluation will fail since this metric needs
    reference to be set.

5.  Click **Run evaluation** to start evaluation. Depending on the flow
    you're testing, this may take a while. Once the evaluation is complete, a
    success message appears with a link to view the results. Click the link
    to go to the _Evaluation details_ page.

You can see the details of your evaluation on this page, including original
input, extracted context and metrics (if any).

## Core concepts

### Terminology

Knowing the following terms can help ensure that you correctly understand
the information provided on this page:

- **Evaluation**: An evaluation is a process that assesses system performance.
  In Genkit, such a system is usually a Genkit primitive, such as a flow or a
  model. An evaluation can be automated or manual (human evaluation).

- **Bulk inference** Inference is the act of running an input on a flow or
  model to get the corresponding output. Bulk inference involves performing
  inference on multiple inputs simultaneously.

- **Metric** An evaluation metric is a criterion on which an inference is
  scored. Examples include accuracy, faithfulness, maliciousness, whether the
  output is in English, etc.

- **Dataset** A dataset is a collection of examples to use for inference-based
  evaluation. A dataset typically consists of `Input` and optional `Reference`
  fields. The `Reference` field does not affect the inference step of evaluation
  but it is passed verbatim to any evaluation metrics. In Genkit, you can create
  a dataset through the Dev UI. There are two types of datasets in Genkit:
  _Flow_ datasets and _Model_ datasets.

## Supported evaluators

Genkit supports several evaluators, some built-in, and others
provided externally.

### Genkit evaluators

Genkit includes a small number of built-in evaluators, ported from
the [JS evaluators plugin](https://js.api.genkit.dev/enums/_genkit-ai_evaluator.GenkitMetric.html),
to help you get started:

- EvaluatorDeepEqual -- Checks if the generated output is deep-equal to the
  reference output provided.
- EvaluatorRegex -- Checks if the generated output matches the regular
  expression provided in the reference field.
- EvaluatorJsonata -- Checks if the generated output matches the
  [JSONATA](https://jsonata.org/) expression provided in the
  reference field.

## Advanced use

Along with its basic functionality, Genkit also provides advanced support for
certain evaluation use cases.

### Evaluation using the CLI

Genkit CLI provides a rich API for performing evaluation. This is especially
useful in environments where the Dev UI is not available (e.g. in a CI/CD
workflow).

Genkit CLI provides 3 main evaluation commands: `eval:flow`, `eval:extractData`,
and `eval:run`.

#### Evaluation `eval:flow` command

The `eval:flow` command runs inference-based evaluation on an input dataset.
This dataset may be provided either as a JSON file or by referencing an existing
dataset in your Genkit runtime.

```bash
# Referencing an existing dataset
genkit eval:flow qaFlow --input myFactsQaDataset

# or, using a dataset from a file
genkit eval:flow qaFlow --input testInputs.json
```

**Note:** Make sure that you start your genkit app before running these CLI
commands.

```bash
genkit start -- go run main.go
```

Here, `testInputs.json` should be an array of objects containing an `input`
field and an optional `reference` field, like below:

```json
[
  {
    "input": "What is the French word for Cheese?"
  },
  {
    "input": "What green vegetable looks like cauliflower?",
    "reference": "Broccoli"
  }
]
```

If your flow requires auth, you may specify it using the `--context` argument:

```bash
genkit eval:flow qaFlow --input testInputs.json --context '{"auth": {"email_verified": true}}'
```

By default, the `eval:flow` and `eval:run` commands use all available metrics
for evaluation. To run on a subset of the configured evaluators, use the
`--evaluators` flag and provide a comma-separated list of evaluators by name:

```bash
genkit eval:flow qaFlow --input testInputs.json --evaluators=genkitEval/regex,genkitEval/jsonata
```

You can view the results of your evaluation run in the Dev UI at
`localhost:4000/evaluate`.

#### `eval:extractData` and `eval:run` commands

To support _raw evaluation_, Genkit provides tools to extract data from traces
and run evaluation metrics on extracted data. This is useful, for example, if
you are using a different framework for evaluation or if you are collecting
inferences from a different environment to test locally for output quality.

You can batch run your Genkit flow and extract an _evaluation dataset_ from the
resultant traces. A raw evaluation dataset is a collection of inputs for
evaluation metrics, _without_ running any prior inference.

Run your flow over your test inputs:

```bash
genkit flow:batchRun qaFlow testInputs.json
```

Extract the evaluation data:

```bash
genkit eval:extractData qaFlow --maxRows 2 --output factsEvalDataset.json
```

The exported data has a format different from the dataset format presented
earlier. This is because this data is intended to be used with evaluation
metrics directly, without any inference step. Here is the syntax of the
extracted data.

```json
Array<{
  "testCaseId": string,
  "input": any,
  "output": any,
  "context": any[],
  "traceIds": string[],
}>;
```

The data extractor automatically locates retrievers and adds the produced docs
to the context array. You can run evaluation metrics on this extracted dataset
using the `eval:run` command.

```bash
genkit eval:run factsEvalDataset.json
```

By default, `eval:run` runs against all configured evaluators, and as with
`eval:flow`, results for `eval:run` appear in the evaluation page of Developer
UI, located at `localhost:4000/evaluate`.
