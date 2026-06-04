export const appRouterPageCode = (
  url: string,
  importLine: string,
) => `'use client';

import { useState } from 'react';
${importLine}

interface RecipeIngredient {
  name?: string;
  quantity?: string;
  onSale?: boolean;
}

interface Recipe {
  title?: string;
  description?: string;
  servings?: number;
  ingredients?: RecipeIngredient[];
  steps?: string[];
}

export default function Home() {
  const [craving, setCraving] = useState('something warm with chicken');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  async function generateRecipe(event: React.FormEvent) {
    event.preventDefault();
    if (!craving.trim()) return;
    setRecipe(null);
    setIsStreaming(true);
    try {
      const result = streamFlow({
        url: '${url}',
        input: { craving },
      });
      for await (const partial of result.stream) {
        setRecipe(partial as Recipe);
      }
      await result.output;
    } catch (err) {
      console.error('Failed to generate recipe', err);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main>
      <h1>Bargain Chef</h1>
      <p className="tagline">
        Tell me what you feel like eating and I&apos;ll suggest a recipe built
        around today&apos;s grocery deals.
      </p>

      <form className="prompt" onSubmit={generateRecipe}>
        <input
          type="text"
          value={craving}
          onChange={(e) => setCraving(e.target.value)}
          name="craving"
          placeholder="What are you in the mood for?"
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming}>
          {isStreaming ? 'Cooking…' : 'Suggest a recipe'}
        </button>
      </form>

      {recipe && (
        <article>
          {recipe.title && <h2>{recipe.title}</h2>}
          {recipe.description && (
            <p className="description">{recipe.description}</p>
          )}
          {recipe.servings && (
            <p className="serves">
              <strong>Serves:</strong> {recipe.servings}
            </p>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <>
              <h3>Ingredients</h3>
              <ul className="ingredients">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>
                    {ing.quantity} {ing.name}
                    {ing.onSale && <span className="badge">on sale</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          {recipe.steps && recipe.steps.length > 0 && (
            <>
              <h3>Steps</h3>
              <ol className="steps">
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </article>
      )}
    </main>
  );
}
`;
