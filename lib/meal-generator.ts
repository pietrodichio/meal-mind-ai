import { z } from "zod";
import { client } from "./openai";

const MealSchema = z
  .object({
    name: z
      .string()
      .max(50)
      .describe("The name of the meal, should be concise but descriptive"),
    description: z
      .string()
      .max(200)
      .optional()
      .describe(
        "A brief description of the meal, including main ingredients and style"
      ),
  })
  .describe("A single meal with its name and optional description");

const DayMealsSchema = z
  .object({
    lunch: MealSchema.describe("The lunch meal for this day"),
    dinner: MealSchema.describe("The dinner meal for this day"),
  })
  .describe("The meals for a single day, including lunch and dinner");

const WeeklyMealPlanSchema = z
  .object({
    monday: DayMealsSchema,
    tuesday: DayMealsSchema,
    wednesday: DayMealsSchema,
    thursday: DayMealsSchema,
    friday: DayMealsSchema,
    saturday: DayMealsSchema,
    sunday: DayMealsSchema,
  })
  .describe(
    "A complete weekly meal plan with lunch and dinner for each day. Each meal must follow specific dietary rules."
  );

export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlanSchema>;

export function getSeasonalVegetables(date: Date): string[] {
  const month = date.getMonth();

  // Winter (December, January, February)
  if (month === 11 || month === 0 || month === 1) {
    return [
      "cavolo nero (black kale)",
      "broccoli",
      "cavolfiori (cauliflower)",
      "verza (savoy cabbage)",
      "cime di rapa (turnip tops)",
      "spinaci (spinach)",
      "bietole (chard)",
      "carote (carrots)",
      "finocchi (fennel)",
      "zucca (pumpkin)",
      "porri (leeks)",
      "radicchio",
      "pomodori (tomatoes)",
      "peperoni (bell peppers)",
      "zucchine (zucchini)",
      "cetrioli (cucumbers)",
    ];
  }

  // Spring (March, April, May)
  if (month >= 2 && month <= 4) {
    return [
      "asparagi (asparagus)",
      "carciofi (artichokes)",
      "fave (broad beans)",
      "spinaci (spinach)",
      "agretti",
      "ravanelli (radishes)",
      "rucola (rocket)",
      "lattuga (lettuce)",
      "pomodori (tomatoes)",
      "peperoni (bell peppers)",
      "zucchine (zucchini)",
      "cetrioli (cucumbers)",
    ];
  }

  // Summer (June, July, August)
  if (month >= 5 && month <= 7) {
    return [
      "pomodori (tomatoes)",
      "peperoni (bell peppers)",
      "zucchine (zucchini)",
      "cetrioli (cucumbers)",
      "insalate (lettuce varieties)",
      "melanzane (eggplants)",
      "fagiolini (green beans)",
      "basilico (basil)",
    ];
  }

  // Fall (September, October, November)
  return [
    "zucca (pumpkin)",
    "carciofi (artichokes)",
    "broccoli",
    "cavolfiori (cauliflower)",
    "verza (savoy cabbage)",
    "radicchio",
    "finocchi (fennel)",
  ];
}

export interface PastMeal {
  name: string;
  day: string;
  type: "lunch" | "dinner";
  createdAt: Date;
}

export async function generateMealPlan(
  pastMeals?: PastMeal[]
): Promise<WeeklyMealPlan> {
  const currentDate = new Date();
  const seasonalVegetables = getSeasonalVegetables(currentDate);
  const isWinter = [11, 0, 1].includes(currentDate.getMonth());

  const seasonalGuidance = isWinter
    ? `WINTER MEAL GUIDELINES:
- Prefer warm, comforting dishes over cold ones
- Include more soups and broths
- Use winter vegetables in season: ${seasonalVegetables.join(", ")}
- Favor heartier cooking methods like roasting and braising
- Include warming spices and herbs (rosemary, sage, bay leaves)

WINTER MEAL EXAMPLES:
- "Zuppa di legumi con cavolo nero e crostini di pane" (legume and black kale soup)
- "Pasta e fagioli" (pasta and beans soup)
- "Minestra di farro, lenticchie con carote, cipolle e sedano" (farro soup with lentils, carrots, onions and celery)
- "Pasta al forno con ricotta e spinaci" (baked pasta with ricotta and spinach)`
    : "";

  const recentMealsPrompt = pastMeals?.length
    ? `\nRECENT MEALS (for reference):
${pastMeals
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 10)
  .map((meal) => `- ${meal.name} (${meal.day} ${meal.type})`)
  .join("\n")}`
    : "";

  const response = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an Italian meal planner. Create a weekly meal plan following these strict rules and return it as a JSON object:

DIETARY RULES:
1. NO MUSHROOMS ALLOWED in any meal
2. Each meal MUST include EXACTLY:
   - ONE protein source (no multiple proteins in the same meal)
   - ONE carbohydrate source (pasta, basmati rice, bread, potatoes, couscous, emmer, venus rice, etc.)
   - Vegetables (use only seasonal vegetables: ${seasonalVegetables.join(", ")})

PROTEIN RULES:
- Available proteins (CHOOSE ONLY ONE PER MEAL):
  * Legumes (chickpeas, lentils, beans)
  * Meat (red/white)
  * Fresh cheese (mozzarella, robiola, ricotta) - NO aged cheeses as main protein
  * Fish (prefer simple preparations)
  * Eggs (max 1 meal per week)
- Maximum 1 red meat meal per week
- Maximum 2 white meat meals per week
- Balance protein sources across the week
- Default to legumes when in doubt
- Never repeat the same protein source in consecutive meals

MEAL STRUCTURE:
- Keep meals SIMPLE and QUICK to prepare (max 30 minutes cooking time)
- Use ONLY Italian-style combinations
- Prefer light lunches and normal portions for dinner
- NO complex preparations
- Try to avoid exact repetition of recent meals
- It's OK to use variations of past successful meals

${seasonalGuidance}

IMPORTANT: Every meal MUST have a non-empty name property.

EXAMPLES OF GOOD MEALS:
- "Pasta ricotta e spinaci" (protein: ricotta)
- "Insalata di lenticchie con pomodorini e pane" (protein: lentils)
- "Petto di pollo ai ferri con zucchine" (protein: chicken)
- "Orata al forno con patate" (protein: fish)

EXAMPLES OF MEALS TO AVOID:
- "Quinoa bowl with multiple proteins" (too many proteins)
- "Stir-fry with rice" (not Italian style)
- "Complex stews or slow-cooked meals" (too long to prepare)
- "Risotto with seafood mix" (too complex/expensive)${recentMealsPrompt}`,
      },
      {
        role: "user",
        content:
          "Generate a weekly meal plan with lunch and dinner for each day. Provide the response as a JSON object following the specified schema. Each meal should be simple, Italian-style, and contain exactly one protein source. Consider the recent meals provided and try to introduce some variety.",
      },
    ],
    model: "gpt-4o", //mandatory for JSON output
    response_format: {
      type: "json_object",
    },
    response_model: {
      schema: WeeklyMealPlanSchema,
      name: "WeeklyMealPlan",
    },
    max_retries: 3,
    seed: 1,
    temperature: 0.7,
  });

  return response;
}

const GroceryListSchema = z.object({
  categories: z.record(
    z.string(),
    z.array(
      z.object({
        item: z.string(),
        quantity: z.string().optional(),
        note: z.string().optional(),
      })
    )
  ),
});

export type GroceryList = z.infer<typeof GroceryListSchema>;

export async function generateGroceryList(
  meals: { name: string }[]
): Promise<GroceryList> {
  const response = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an Italian grocery list generator. Create a categorized grocery list for the provided meals. Return a JSON object with EXACTLY this structure:
{
  "categories": {
    "Verdura (Vegetables)": [
      { "item": "Spinaci (Spinach)", "quantity": "500g" },
      { "item": "Zucchine (Zucchini)", "quantity": "4 pezzi" }
    ],
    "Carne e Pesce (Meat and Fish)": [
      { "item": "Petto di pollo (Chicken breast)", "quantity": "600g" }
    ]
  }
}

Rules:
1. Always include these categories (even if empty):
   - "Verdura (Vegetables)"
   - "Frutta (Fruit)"
   - "Carne e Pesce (Meat and Fish)"
   - "Latticini (Dairy)"
   - "Dispensa (Pantry)"
   - "Erbe e Spezie (Herbs and Spices)"

2. For each item include:
   - Required: "item" with Italian and English names
   - Optional: "quantity" with amount
   - Optional: "note" for freshness/ripeness

3. Combine similar items and adjust quantities
4. Focus on fresh, seasonal ingredients
5. Include basic pantry items only if essential`,
      },
      {
        role: "user",
        content: `Generate a grocery list for these meals: ${meals
          .map((m) => m.name)
          .join(", ")}`,
      },
    ],
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  // Parse the response content
  const parsedResponse = JSON.parse(
    response?.choices?.[0]?.message?.content || ""
  );

  // Validate against our schema
  return GroceryListSchema.parse(parsedResponse);
}
