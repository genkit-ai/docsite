export const componentCode = (
  url: string,
) => `import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';

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

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  craving = signal('something warm with chicken');
  recipe = signal<Recipe | null>(null);
  isStreaming = signal(false);

  async generateRecipe() {
    if (!this.craving().trim()) return;
    this.recipe.set(null);
    this.isStreaming.set(true);
    try {
      const result = streamFlow({
        url: '${url}',
        input: { craving: this.craving() },
      });
      for await (const partial of result.stream) {
        this.recipe.set(partial as Recipe);
      }
      await result.output;
    } catch (err) {
      console.error('Failed to generate recipe', err);
    } finally {
      this.isStreaming.set(false);
    }
  }
}
`;
