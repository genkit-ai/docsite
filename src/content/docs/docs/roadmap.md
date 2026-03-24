---
title: 2026 Genkit Roadmap
description: Explore the Genkit roadmap to see what's coming next and what we're working on.
---

As we look toward 2026, the AI landscape is shifting from simple prompts to autonomous agentic systems. To meet this moment, **Firebase Genkit has officially graduated to become Genkit: a Google-wide AI framework.** This evolution reflects our broader mission to provide a foundational, multi-platform tool for the agentic era while maintaining our core promise: making AI features easy to build, test, and debug. We are committed to making it simple to bring your own models into the Genkit ecosystem, providing a unified, shared interface that allows you to swap providers with minimal friction. 

We are focusing our efforts on four areas: 
- **Broadening our reach and ecosystem**
- **Expanding agentic capabilities**
- **Improving observability**
- **Embracing and expanding our community**

Our plans will evolve over time based on customer feedback and new market opportunities. We will use your feedback and GitHub issues to prioritize work. The list here shouldn't be viewed either as exhaustive nor a promise that we will complete all this work. If you have feedback about what you think we should work on, we encourage you to get in touch by filing a Github issue, or using the "thumbs-up" emoji reaction on an issue's first comment. Because Genkit is an open source project, we invite contributions both towards the themes presented below and in other areas.

### **Broadening our reach and ecosystem**

We believe that your choice of programming language should never be a barrier to building AI and agentic features to your apps and systems. While Genkit's roots are in TypeScript, 2026 marks our expansion into a truly multi-language ecosystem. The centerpiece of this effort is the launch of Genkit for Dart. By moving from Alpha to a stable 1.0 release this year, we are providing Flutter and Dart developers with an idiomatic experience to build AI features on any platform that Dart runs.

### **From Static Loops to Dynamic Agents**

The industry is moving beyond "chatbots" and towards "agents"—systems that can reason, use tools, and persist across long periods. We are introducing a new **Agent Primitive**, a core abstraction designed to simplify state management and Agent-to-Agent (A2A) orchestration.

To support the next generation of interactive experiences, we are building native support for **bi-directional streaming**. This enables you to tap into the "Live" modalities of models like Gemini and OpenAI, supporting voice and video interactions with minimal latency. For more intensive tasks, we are also adding support for Deep Research models, allowing Genkit to manage background reasoning tasks that survive long after a user has closed their browser tab.

### **Observability for your AI and agentic features**

As agents become more autonomous, debugging them becomes significantly more difficult. In 2026, we are evolving the Genkit Dev UI into a full-scale agent playground. Developers will be able to inspect multi-turn states, replay tool loops, and observe the "thought process" of their agents in real-time.

### **Embracing and expanding our community**

Finally, Genkit is only as strong as the community behind it. To facilitate faster iteration and easier contributions, we have migrated to a dedicated GitHub organization and are going to seperate our SDKs into specialized repositories.

We are also investigating mechanisms to make it easier for you to share patterns and plugins that you have developed using Genkit’s extensibility features. These reusable pieces provide developers with customizable, "copy-and-paste" code for complex integrations such as vector stores, giving you total control over your implementation. Our goal is to continue expanding Genkit’s capabilities with the support of our community so that by the end of 2026, Genkit's position is solidified as a leading powerful, flexible, and community-driven AI framework on the market.

---
## **Our Commitment**

This roadmap is aspirational and reflects our current trajectory. In the spirit of open-source development, we will continue to iterate in public, listening to your feedback at every milestone.
