/**
 * Centralized code samples for the LanguageSelector
 */

export const nodeCode = `import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({ plugins: [googleAI()] });

const { text } = await ai.generate({
  model: googleAI.model('gemini-2.5-flash'),
  prompt: 'Why is Firebase awesome?'
});`;

export const goCode = `package main

import (
    "context"
    "github.com/firebase/genkit/go/ai"
    "github.com/firebase/genkit/go/plugins/googleai"
)

func main() {
    ai := genkit.New(googleai.Plugin())
    
    response, err := ai.Generate(context.Background(), &ai.GenerateRequest{
        Model:  googleai.Model("gemini-2.5-flash"),
        Prompt: "Why is Firebase awesome?",
    })
}`;

export const pythonCode = `from genkit import genkit
from genkit.plugins import googleai

ai = genkit(plugins=[googleai.plugin()])

response = ai.generate(
    model=googleai.model('gemini-2.5-flash'),
    prompt='Why is Firebase awesome?'
)`;

export const codeExamples: Record<string, string> = {
  nodejs: nodeCode,
  go: goCode,
  python: pythonCode,
};


