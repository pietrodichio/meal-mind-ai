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
  pastMeals?: PastMeal[],
  language: string = "en"
): Promise<WeeklyMealPlan> {
  const currentDate = new Date();
  const seasonalVegetables = getSeasonalVegetables(currentDate);
  const isWinter = [11, 0, 1].includes(currentDate.getMonth());

  const languagePrompts: Record<string, { role: string; examples: string }> = {
    en: {
      role: "You are a meal planner. Create a weekly meal plan in English",
      examples: `EXAMPLES OF GOOD MEALS:
- "Pasta with ricotta and spinach" (protein: ricotta)
- "Lentil salad with cherry tomatoes and bread" (protein: lentils)
- "Grilled chicken breast with zucchini" (protein: chicken)
- "Baked sea bream with potatoes" (protein: fish)`,
    },
    it: {
      role: "Sei un pianificatore di pasti italiano. Crea un piano pasti settimanale in italiano",
      examples: `ESEMPI DI PASTI APPROPRIATI:
- "Pasta ricotta e spinaci" (proteina: ricotta)
- "Insalata di lenticchie con pomodorini e pane" (proteina: lenticchie)
- "Petto di pollo ai ferri con zucchine" (proteina: pollo)
- "Orata al forno con patate" (proteina: pesce)`,
    },
  };

  const selectedLanguage = languagePrompts[language] || languagePrompts.en;

  const seasonalGuidance = isWinter
    ? language === "it"
      ? `LINEE GUIDA PER I PASTI INVERNALI:
- Preferire piatti caldi e confortanti
- Includere più zuppe e brodi
- Usare verdure di stagione: ${seasonalVegetables.join(", ")}
- Favorire metodi di cottura più sostanziosi come arrosto e brasato
- Includere spezie e erbe riscaldanti (rosmarino, salvia, alloro)

ESEMPI DI PASTI INVERNALI:
- "Zuppa di legumi con cavolo nero e crostini di pane"
- "Pasta e fagioli"
- "Minestra di farro e lenticchie con carote, cipolle e sedano"
- "Pasta al forno con ricotta e spinaci"`
      : `WINTER MEAL GUIDELINES:
- Prefer warm, comforting dishes over cold ones
- Include more soups and broths
- Use winter vegetables in season: ${seasonalVegetables.join(", ")}
- Favor heartier cooking methods like roasting and braising
- Include warming spices and herbs (rosemary, sage, bay leaves)

WINTER MEAL EXAMPLES:
- "Bean soup with black kale and bread croutons"
- "Pasta and beans soup"
- "Spelt soup with lentils, carrots, onions and celery"
- "Baked pasta with ricotta and spinach"`
    : "";

  const recentMealsPrompt = pastMeals?.length
    ? language === "it"
      ? `\nPASTI RECENTI (per riferimento):
${pastMeals
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 10)
  .map((meal) => `- ${meal.name} (${meal.day} ${meal.type})`)
  .join("\n")}`
      : `\nRECENT MEALS (for reference):
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
        content: `${
          selectedLanguage.role
        }. Follow these strict rules and return it as a JSON object:

${language === "it" ? "REGOLE DIETETICHE:" : "DIETARY RULES:"}
${
  language === "it"
    ? `1. NIENTE FUNGHI PERMESSI in nessun pasto
2. Ogni pasto DEVE includere ESATTAMENTE:
   - UNA fonte proteica (no proteine multiple nello stesso pasto)
   - UNA fonte di carboidrati (pasta, riso basmati, pane, patate, cous cous, farro, riso venere, ecc.)
   - Verdure (usa solo verdure di stagione: ${seasonalVegetables.join(", ")})`
    : `1. NO MUSHROOMS ALLOWED in any meal
2. Each meal MUST include EXACTLY:
   - ONE protein source (no multiple proteins in the same meal)
   - ONE carbohydrate source (pasta, basmati rice, bread, potatoes, couscous, emmer, venus rice, etc.)
   - Vegetables (use only seasonal vegetables: ${seasonalVegetables.join(
     ", "
   )})`
}

${language === "it" ? "REGOLE PROTEINE:" : "PROTEIN RULES:"}
${
  language === "it"
    ? `- Proteine disponibili (SCEGLI SOLO UNA PER PASTO):
  * Legumi (ceci, lenticchie, fagioli)
  * Carne (rossa/bianca)
  * Formaggio fresco (mozzarella, robiola, ricotta) - NO formaggi stagionati come proteina principale
  * Pesce (preferire preparazioni semplici)
  * Uova (max 1 pasto a settimana)
- Massimo 1 pasto con carne rossa a settimana
- Massimo 2 pasti con carne bianca a settimana
- Bilanciare le fonti proteiche durante la settimana
- Prediligi i legumi in caso di dubbio
- Non ripetere mai la stessa fonte proteica in pasti consecutivi`
    : `- Available proteins (CHOOSE ONLY ONE PER MEAL):
  * Legumes (chickpeas, lentils, beans)
  * Meat (red/white)
  * Fresh cheese (mozzarella, robiola, ricotta) - NO aged cheeses as main protein
  * Fish (prefer simple preparations)
  * Eggs (max 1 meal per week)
- Maximum 1 red meat meal per week
- Maximum 2 white meat meals per week
- Balance protein sources across the week
- Default to legumes when in doubt
- Never repeat the same protein source in consecutive meals`
}

${language === "it" ? "STRUTTURA DEI PASTI:" : "MEAL STRUCTURE:"}
${
  language === "it"
    ? `- Mantieni i pasti SEMPLICI e VELOCI da preparare (max 30 minuti di cottura)
- Usa SOLO combinazioni in stile italiano
- Preferisci pranzi leggeri e porzioni normali per cena
- NO preparazioni complesse
- Cerca di evitare l'esatta ripetizione di pasti recenti
- È OK usare variazioni di pasti di successo passati`
    : `- Keep meals SIMPLE and QUICK to prepare (max 30 minutes cooking time)
- Use ONLY Italian-style combinations
- Prefer light lunches and normal portions for dinner
- NO complex preparations
- Try to avoid exact repetition of recent meals
- It's OK to use variations of past successful meals`
}

${seasonalGuidance}

${
  language === "it"
    ? "IMPORTANTE: Ogni pasto DEVE avere una proprietà nome non vuota."
    : "IMPORTANT: Every meal MUST have a non-empty name property."
}

${selectedLanguage.examples}${recentMealsPrompt}`,
      },
      {
        role: "user",
        content:
          language === "it"
            ? "Genera un piano pasti settimanale con pranzo e cena per ogni giorno. Fornisci la risposta come oggetto JSON seguendo lo schema specificato. Ogni pasto dovrebbe essere semplice, in stile italiano e contenere esattamente una fonte proteica. Considera i pasti recenti forniti e cerca di introdurre varietà."
            : "Generate a weekly meal plan with lunch and dinner for each day. Provide the response as a JSON object following the specified schema. Each meal should be simple, Italian-style, and contain exactly one protein source. Consider the recent meals provided and try to introduce some variety.",
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
