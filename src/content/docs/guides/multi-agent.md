---
title: Building multi-agent systems
---

:::caution[Beta]
This feature of Genkit is in **Beta,** which means it is not yet part of Genkit's stable API. APIs of beta features may change in minor version releases.
:::

A powerful application of large language models are LLM-powered agents. An agent
is a system that can carry out complex tasks by planning how to break tasks into
smaller ones, and (with the help of [tool calling](tool-calling)) execute tasks
that interact with external resources such as databases or even physical
devices.

Here are some excerpts from a very simple customer service agent built using a
single prompt and several tools:

<!-- TODO: Investigate code inclusion from firebase/genkit/js/doc-snippets/src/multi-agent/simple.ts (region_tag: tools) -->

```ts
const listHotels = ai.defineTool(
  {
    name: "listHotels",
    description: "List hotels in a given location. Returns the list of hotels.",
    inputSchema: z.object({ location: z.string() }),
    outputSchema: z.array(z.string()),
  },
  async ({ location }) => {
    // ... call a hotel booking API
    return ["hotel 1", "hotel 2"];
  }
);

const reserveHotel = ai.defineTool(
  {
    name: "reserveHotel",
    description:
      "Reserve a hotel for the given dates. Returns the reservation ID.",
    inputSchema: z.object({ hotelId: z.string(), dates: z.string() }),
    outputSchema: z.string(),
  },
  async ({ hotelId, dates }) => {
    // ... call a hotel booking API
    return "reservation-123";
  }
);
```

<!-- TODO: Investigate code inclusion from firebase/genkit/js/doc-snippets/src/multi-agent/simple.ts (region_tag: chat) -->

```ts
const chat = await ai.chat({
  system: "You are a customer service agent for a hotel chain.",
  tools: [listHotels, reserveHotel],
});
```

A simple architecture like the one shown above can be sufficient when your agent
only has a few capabilities. However, even for the limited example above, you
can see that there are some capabilities that customers would likely expect: for
example, listing the customer's current reservations, canceling a reservation,
and so on. As you build more and more tools to implement these additional
capabilities, you start to run into some problems:

- The more tools you add, the more you stretch the model's ability to
  consistently and correctly employ the right tool for the job.
- Some tasks might best be served through a more focused back and forth
  between the user and the agent, rather than by a single tool call.
- Some tasks might benefit from a specialized prompt. For example, if your
  agent is responding to an unhappy customer, you might want its tone to be
  more business-like, whereas the agent that greets the customer initially can
  have a more friendly and lighthearted tone.

One approach you can use to deal with these issues that arise when building
complex agents is to create many specialized agents and use a general purpose
agent to delegate tasks to them. Genkit supports this architecture by allowing
you to specify prompts as tools. Each prompt represents a single specialized
agent, with its own set of tools available to it, and those agents are in turn
available as tools to your single orchestration agent, which is the primary
interface with the user.

Here's what an expanded version of the previous example might look like as a
multi-agent system:

<!-- TODO: Investigate code inclusion from firebase/genkit/js/doc-snippets/src/multi-agent/multi.ts (region_tag: agents) -->

```ts
const listReservations = ai.defineTool(/* ... */);
const cancelReservation = ai.defineTool(/* ... */);

const reservationAgent = ai.definePrompt(
  {
    name: "reservationAgent",
    description: "Use this agent to list or cancel reservations.",
    tools: [listReservations, cancelReservation],
  },
  '{{role "system"}} You are an agent that helps users manage their reservations. {{role "user"}} {{prompt}}'
);

const bookingAgent = ai.definePrompt(
  {
    name: "bookingAgent",
    description: "Use this agent to book hotels.",
    tools: [listHotels, reserveHotel],
  },
  '{{role "system"}} You are an agent that helps users book hotels. {{role "user"}} {{prompt}}'
);
```

<!-- TODO: Investigate code inclusion from firebase/genkit/js/doc-snippets/src/multi-agent/multi.ts (region_tag: chat) -->

```ts
const chat = await ai.chat({
  system:
    "You are a customer service agent for a hotel chain. You can delegate tasks to other agents.",
  tools: [reservationAgent, bookingAgent],
});
```
