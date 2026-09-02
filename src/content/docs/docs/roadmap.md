---
title: Genkit roadmap and focus areas
description: Explore the Genkit roadmap to see what's coming next and what we're working on.
isLanguageAgnostic: true
---

Developers are increasingly building full-stack agentic applications to deliver real value to their users. To meet this moment, **Genkit has officially graduated to become a Google-wide AI framework.** Our thesis is simple: **Genkit is an open-source framework for building full-stack, AI-powered and agentic applications for any platform.** At its core, Genkit is built on these 5 pillars: model-agnosticism, platform portability, rich local tooling, complete observability, and seamless integration into user-facing applications.&nbsp;

Our 2026 efforts concentrate on four areas that reinforce that thesis: **Broadening platform portability and ecosystem reach**, **Expanding agentic capabilities**, **Observability for your agentic features**, **Optimizing for coding agent assistance**, and **Embracing and expanding our community.**

Our plans will evolve over time based on customer feedback and new market opportunities. We will use your feedback and GitHub issues to prioritize work. The list here shouldn't be viewed either as exhaustive nor a promise that we will complete all this work. If you have feedback about what you think we should work on, we encourage you to get in touch by filing an issue, or using the "thumbs-up" emoji reaction on an issue's first comment. Because Genkit is an open source project, we invite contributions both towards the themes presented below and in other areas.

### **Broadening platform portability and ecosystem reach**

Platform portability is a core promise of Genkit: your language, runtime, and deployment target should never limit where your agentic applications can run. Genkit is already a multi-language framework, supporting TypeScript, Go, Dart, and Python. In 2026, we will continue evolving our SDKs to embrace the latest patterns in AI development.

A major focus of this work is **bringing both Genkit Dart and Genkit Python to stable 1.0 releases this year**. For Python developers, this delivers production readiness, enterprise-grade stability, and seamless integration with the broader Python AI ecosystem. For Flutter and Dart developers, this provides an idiomatic way to ship agentic features across every platform Dart targets: mobile, web, desktop, and server.

To round out the full-stack story on mobile, we are also introducing client-side SDKs for **Kotlin (Android)** and **Swift (iOS)**. These give native mobile developers a simplified, idiomatic path to integrate Genkit-powered backends directly into their applications.

### **Expanding agentic capabilities**

High-quality agentic applications need more than a generation loop: they need state persistence, fine-grained context control, interactive user interfaces, and first-class integration with agent and enterprise ecosystems.&nbsp;

To support these needs, we have introduced our model-agnostic **Agents API**. This API empowers developers to build high-quality, full-stack, conversational, and multi-step interfaces that require tool use and persistent conversational memory. While currently available across **TypeScript**, **Go**, **Dart**, and **Python**, our top priority is **bringing the new Agents API to stable across all supported Genkit languages**.

To make production deployments seamless and robust, we are heavily investing in turnkey building blocks:
- **Expanding pre-built session stores**: We are expanding the number of turnkey session store implementations to provide scalable, production-grade state persistence out of the box.
- **Iterating on advanced middleware**: While Genkit already provides middleware for common patterns like retries, fallbacks, tool approvals, and Agent Skills, we are actively iterating on new middleware for **multi-agent delegation patterns**, **context compaction**, and **cost controls**.

We are also actively driving forward full-stack and ecosystem agent interactions:
- **Full-stack Generative UI (A2UI)**: We are actively working on end-to-end Agent-to-UI support, enabling agents to stream interactive UI surfaces directly to web and mobile clients (with rich components, form handling, and bidirectional user actions) rather than relying solely on text streams.
- **Agent-to-Agent (A2A) Orchestration**: We are advancing native support for A2A communication, empowering agents to discover, delegate tasks to, and collaborate with other agents across framework boundaries.
- **Seamless Gemini Enterprise Integration**: We are building deep, native integration with Gemini Enterprise, allowing developers to connect and deploy Genkit agents directly into enterprise workflows, knowledge bases, and agent systems.

### **Observability for your agentic features**

The ability to rapidly test AI logic with full observability is critical to building production-grade agentic applications.

We are advancing the Genkit Developer UI with a new **agent runner preview**. This feature allows developers to converse directly with their agents, observe how tools are executed, manage interrupts, and inspect step-by-step traces for every turn in a conversation. These end-to-end insights follow your application from initial development through to production, enabling rapid debugging and optimization.

### **Empowering development with coding agents**

The future of software development relies heavily on coding agent assistance, and Genkit aims to be the premier framework for developers building with AI coding assistants. We believe coding agents can handle the vast majority of heavy lifting when constructing and refining agentic features.

To support this shift:

- **Genkit Agent Skills** have been released for every supported language and will be continuously updated as new patterns and capabilities emerge.
- **Genkit CLI and Developer UI updates**: We are enhancing the Genkit CLI specifically for coding agent workflows. This allows coding agents to automatically and rapidly test agents built with Genkit, iterate on implementations, analyze traces, debug autonomously, and leverage skills to enforce best practices.

### **Embracing and expanding our community**

Genkit is only as strong as the community behind it. To enable faster iteration, streamline contributions, and allow for dedicated effort per ecosystem, we are breaking our monorepo up into multiple dedicated repositories for each supported language.

We are also expanding the range of built-in plugins and native capabilities within Genkit. Our goal is to ensure developers never feel locked into any single ecosystem, giving them maximum flexibility to integrate vector stores, model providers, and custom tooling while retaining total control over their stack.

---

## **Our Commitment**

This roadmap is aspirational and reflects our current trajectory. In the spirit of open-source development, we will continue to iterate in public, listening to your feedback at every milestone.
