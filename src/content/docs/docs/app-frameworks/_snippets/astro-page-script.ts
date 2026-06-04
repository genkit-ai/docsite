export const pageScript = (
  url: string,
) => `import { streamFlow } from 'genkit/beta/client';

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

const form = document.getElementById('prompt-form') as HTMLFormElement;
const cravingInput = document.getElementById('craving') as HTMLInputElement;
const submitButton = document.getElementById('submit') as HTMLButtonElement;
const recipeEl = document.getElementById('recipe') as HTMLElement;

let isStreaming = false;

function setStreaming(value: boolean) {
  isStreaming = value;
  cravingInput.disabled = value;
  submitButton.disabled = value;
  submitButton.textContent = value ? 'Cooking…' : 'Suggest a recipe';
}

function render(recipe: Recipe | null) {
  if (!recipe) {
    recipeEl.innerHTML = '';
    return;
  }

  const parts: string[] = ['<article>'];
  if (recipe.title) parts.push(\`<h2>\${recipe.title}</h2>\`);
  if (recipe.description) parts.push(\`<p class="description">\${recipe.description}</p>\`);
  if (recipe.servings) parts.push(\`<p class="serves"><strong>Serves:</strong> \${recipe.servings}</p>\`);

  if (recipe.ingredients?.length) {
    parts.push('<h3>Ingredients</h3><ul class="ingredients">');
    for (const ing of recipe.ingredients) {
      const badge = ing.onSale ? ' <span class="badge">on sale</span>' : '';
      parts.push(\`<li>\${ing.quantity ?? ''} \${ing.name ?? ''}\${badge}</li>\`);
    }
    parts.push('</ul>');
  }

  if (recipe.steps?.length) {
    parts.push('<h3>Steps</h3><ol class="steps">');
    for (const step of recipe.steps) {
      parts.push(\`<li>\${step}</li>\`);
    }
    parts.push('</ol>');
  }

  parts.push('</article>');
  recipeEl.innerHTML = parts.join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const craving = cravingInput.value.trim();
  if (!craving) return;

  render(null);
  setStreaming(true);
  try {
    const result = streamFlow({
      url: '${url}',
      input: { craving },
    });
    for await (const partial of result.stream) {
      render(partial as Recipe);
    }
    await result.output;
  } catch (err) {
    console.error('Failed to generate recipe', err);
  } finally {
    setStreaming(false);
  }
});
`;
