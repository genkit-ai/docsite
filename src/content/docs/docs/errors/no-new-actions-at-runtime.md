---
title: No new actions at runtime error
description: Learn why defining new actions at runtime is not allowed in Genkit and how to correctly define them.
---

Defining new actions at runtime is not allowed.

✅ DO:

```ts
const prompt = ai.definePrompt({...})

const myFlow = ai.defineFlow({...}, async (input) => {
  await prompt(...);
})
```

❌ DON'T:

```ts
const myFlow = ai.defineFlow({...}, async (input) => {
  const prompt = ai.definePrompt({...})
  await prompt(...);
})
```
