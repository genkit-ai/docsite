---
title: Genkit roadmap and focus areas
description: Explore the Genkit roadmap to see what's coming next and what we're working on.
---

Developers are increasingly building full-stack agentic applications to deliver real value to their users. To meet this moment, **Genkit has officially graduated to become a Google-wide AI framework.** Our thesis is simple: **Genkit is an open-source framework for building full-stack, AI-powered and agentic applications for any platform.** At its core, Genkit is built on these 5 pillars: model-agnosticism, platform portability, rich local tooling, complete observability, and seamless integration into user-facing applications.&nbsp;

Our 2026 efforts concentrate on four areas that reinforce that thesis: **Broadening platform portability and ecosystem reach**, **Expanding agentic capabilities**, **Observability for your agentic features**, **Optimizing for coding agent assistance**, and **Embracing and expanding our community.**

Our plans will evolve over time based on customer feedback and new market opportunities. We will use your feedback and GitHub issues to prioritize work. The list here shouldn't be viewed either as exhaustive nor a promise that we will complete all this work. If you have feedback about what you think we should work on, we encourage you to get in touch by filing an issue, or using the "thumbs-up" emoji reaction on an issue's first comment. Because Genkit is an open source project, we invite contributions both towards the themes presented below and in other areas.

### **Broadening platform portability and ecosystem reach**

Platform portability is a core promise of Genkit: your language, runtime, and deployment target should never limit where your agentic applications can run. Genkit is already a multi-language framework, supporting TypeScript, Go, Dart, and Python. In 2026, we will continue evolving our SDKs to embrace the latest patterns in AI development. The centerpiece of that work is Genkit for Dart, which will graduate from an early preview to a stable 1.0 release this year. This will bring Flutter and Dart developers an idiomatic way to ship agentic features across every platform Dart targets: mobile, web, desktop, and server.

To round out the full-stack story on mobile, we are also introducing client-side SDKs for **Kotlin (Android)** and **Swift (iOS)**. These give native mobile developers a simplified, idiomatic path to integrate Genkit-powered backends directly into their applications.

### **Expanding agentic capabilities**

High-quality agentic applications need more than a generation loop: they need state persistence, fine-grained context control, and first-class integration with user experiences.&nbsp;

To support these needs, we have released a preview of our new model-agnostic **Agent Primitive**. This primitive helps developers build high-quality, full-stack, conversational, and multi-step interfaces that require tool use and persistent conversational memory. It is currently available in beta across **TypeScript**, **Go**, and **Dart**, with **Python** support coming soon. We will continue iterating on this preview based on customer feedback, and bring to a stable feature release in the near future.

We have also introduced middleware as a first-class way to extend the capabilities and improve the reliability of your agents. Middleware enables features like Agent Skills, retry and fallback behavior, tool approval, and more, giving you composable building blocks to enhance agents for production.

Furthermore, this primitive is designed to power Agent-to-Agent (A2A) interactions. It enables developers to easily plug their Genkit agents into the Gemini Enterprise Agent Platform and allows agents to seamlessly interact with other agents, including those built with other frameworks.

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
