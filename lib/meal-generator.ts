import { z } from "zod";
import { client } from "./openai";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayKey = typeof DAYS[number];

type MealSlot = "lunch" | "dinner";

type SupportedLanguage = "en" | "it";

const DEFAULT_LANGUAGE: SupportedLanguage = "it";

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

type Season = "winter" | "spring" | "summer" | "fall";

type ProteinType =
  | "legumes"
  | "white_meat"
  | "red_meat"
  | "fresh_cheese"
  | "fish"
  | "eggs";

type DishWeight = "light" | "normal" | "hearty";

type MealTranslation = {
  name: string;
  description: string;
};

type MealOptionBase = {
  id: string;
  protein: ProteinType;
  carbohydrate: string;
  vegetables: string[];
  seasons: (Season | "all")[];
  suitableFor: MealSlot[];
  weight: DishWeight;
  translations: Record<SupportedLanguage, MealTranslation>;
};

type MealOption = MealOptionBase & {
  normalizedNames: string[];
};

const PROTEIN_LIMITS: Partial<Record<ProteinType, number>> = {
  red_meat: 1,
  white_meat: 2,
  eggs: 1,
};

const MINIMUM_TARGETS: Partial<Record<ProteinType, number>> = {
  legumes: 3,
  fish: 2,
};

const SEASONAL_MEAL_LIBRARY_BASE: MealOptionBase[] = [
  {
    id: "pasta_ceci_cavolo_nero",
    protein: "legumes",
    carbohydrate: "pasta",
    vegetables: ["cavolo nero", "carote"],
    seasons: ["fall", "winter"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Pasta e ceci con cavolo nero",
        description:
          "Pasta corta con ceci stufati, cavolo nero saltato e rosmarino.",
      },
      en: {
        name: "Pasta and chickpeas with black kale",
        description:
          "Short pasta with stewed chickpeas, sautéed black kale and rosemary.",
      },
    },
  },
  {
    id: "zuppa_lenticchie_verza",
    protein: "legumes",
    carbohydrate: "pane integrale",
    vegetables: ["verza", "carote", "sedano"],
    seasons: ["fall", "winter"],
    suitableFor: ["dinner"],
    weight: "hearty",
    translations: {
      it: {
        name: "Zuppa di lenticchie con verza",
        description:
          "Zuppa calda di lenticchie con verza, carote e pane integrale tostato.",
      },
      en: {
        name: "Lentil soup with savoy cabbage",
        description:
          "Warm lentil soup with savoy cabbage, carrots and toasted wholemeal bread.",
      },
    },
  },
  {
    id: "risotto_radicchio_robiola",
    protein: "fresh_cheese",
    carbohydrate: "riso",
    vegetables: ["radicchio"],
    seasons: ["fall", "winter"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Risotto al radicchio con robiola",
        description:
          "Risotto cremoso al radicchio mantecato con robiola fresca.",
      },
      en: {
        name: "Radicchio risotto with robiola",
        description: "Creamy radicchio risotto finished with fresh robiola cheese.",
      },
    },
  },
  {
    id: "pollo_limone_broccoli_riso",
    protein: "white_meat",
    carbohydrate: "riso basmati",
    vegetables: ["broccoli"],
    seasons: ["winter", "spring", "fall"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Pollo al limone con broccoli e riso",
        description:
          "Filetti di pollo al limone con broccoli saltati e riso basmati.",
      },
      en: {
        name: "Lemon chicken with broccoli and rice",
        description:
          "Lemon-marinated chicken strips with sautéed broccoli and basmati rice.",
      },
    },
  },
  {
    id: "orata_patate_finocchi",
    protein: "fish",
    carbohydrate: "patate",
    vegetables: ["finocchi"],
    seasons: ["winter", "fall"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Orata al forno con patate e finocchi",
        description:
          "Filetto di orata al forno con patate a fette e finocchi gratinati.",
      },
      en: {
        name: "Baked sea bream with potatoes and fennel",
        description:
          "Oven-baked sea bream fillet with sliced potatoes and roasted fennel.",
      },
    },
  },
  {
    id: "spezzatino_manzo_patate",
    protein: "red_meat",
    carbohydrate: "patate",
    vegetables: ["carote", "sedano"],
    seasons: ["fall", "winter"],
    suitableFor: ["dinner"],
    weight: "hearty",
    translations: {
      it: {
        name: "Spezzatino di manzo con patate",
        description:
          "Spezzatino di manzo brasato con patate, carote e alloro.",
      },
      en: {
        name: "Beef stew with potatoes",
        description:
          "Slow-braised beef stew with potatoes, carrots and bay leaves.",
      },
    },
  },
  {
    id: "frittata_spinaci_pane",
    protein: "eggs",
    carbohydrate: "pane integrale",
    vegetables: ["spinaci"],
    seasons: ["winter", "spring"],
    suitableFor: ["lunch"],
    weight: "light",
    translations: {
      it: {
        name: "Frittata di spinaci con pane tostato",
        description:
          "Frittata morbida agli spinaci con pane integrale tostato e limone.",
      },
      en: {
        name: "Spinach frittata with toasted bread",
        description:
          "Soft spinach frittata served with toasted wholemeal bread and lemon.",
      },
    },
  },
  {
    id: "orecchiette_cime_rapa_ricotta",
    protein: "fresh_cheese",
    carbohydrate: "pasta",
    vegetables: ["cime di rapa"],
    seasons: ["winter"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Orecchiette con cime di rapa e ricotta",
        description:
          "Orecchiette saltate con cime di rapa e ricotta fresca montata.",
      },
      en: {
        name: "Orecchiette with turnip tops and ricotta",
        description:
          "Orecchiette tossed with turnip tops and whipped fresh ricotta.",
      },
    },
  },
  {
    id: "trota_cavolo_nero_patate",
    protein: "fish",
    carbohydrate: "patate",
    vegetables: ["cavolo nero", "finocchi"],
    seasons: ["winter"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Trota al forno con cavolo nero",
        description:
          "Filetto di trota al forno con cavolo nero stufato e patate arrosto.",
      },
      en: {
        name: "Baked trout with black kale",
        description:
          "Oven-baked trout fillet with braised black kale and roasted potatoes.",
      },
    },
  },
  {
    id: "pollo_arancia_finocchi",
    protein: "white_meat",
    carbohydrate: "riso integrale",
    vegetables: ["finocchi", "carote"],
    seasons: ["winter", "fall"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Pollo all'arancia con finocchi",
        description:
          "Filetti di pollo all'arancia con finocchi al vapore e riso integrale.",
      },
      en: {
        name: "Orange chicken with fennel",
        description:
          "Orange-glazed chicken fillets with steamed fennel and brown rice.",
      },
    },
  },
  {
    id: "farro_fave_ravanelli",
    protein: "legumes",
    carbohydrate: "farro",
    vegetables: ["fave", "ravanelli", "rucola"],
    seasons: ["spring"],
    suitableFor: ["lunch"],
    weight: "light",
    translations: {
      it: {
        name: "Insalata di farro con fave e ravanelli",
        description:
          "Farro tiepido con fave, ravanelli croccanti e olio al limone.",
      },
      en: {
        name: "Farro salad with fava beans and radishes",
        description:
          "Warm farro tossed with fava beans, crisp radishes and lemon oil.",
      },
    },
  },
  {
    id: "pasta_asparagi_ricotta",
    protein: "fresh_cheese",
    carbohydrate: "pasta",
    vegetables: ["asparagi"],
    seasons: ["spring"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Pasta agli asparagi e ricotta",
        description:
          "Farfalle con crema di asparagi freschi e ricotta leggera.",
      },
      en: {
        name: "Asparagus and ricotta pasta",
        description:
          "Farfalle pasta with fresh asparagus purée and light ricotta.",
      },
    },
  },
  {
    id: "merluzzo_agretti_patate",
    protein: "fish",
    carbohydrate: "patate",
    vegetables: ["agretti"],
    seasons: ["spring"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Merluzzo al vapore con agretti",
        description:
          "Filetto di merluzzo al vapore con agretti saltati e patate novelle.",
      },
      en: {
        name: "Steamed cod with agretti",
        description:
          "Steamed cod fillet with sautéed agretti and new potatoes.",
      },
    },
  },
  {
    id: "pollo_griglia_zucchine_couscous",
    protein: "white_meat",
    carbohydrate: "cous cous",
    vegetables: ["zucchine", "pomodori"],
    seasons: ["spring", "summer"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Pollo grigliato con zucchine e cous cous",
        description:
          "Petto di pollo alla griglia con zucchine marinate e cous cous al limone.",
      },
      en: {
        name: "Grilled chicken with zucchini and couscous",
        description:
          "Grilled chicken breast with marinated zucchini and lemon couscous.",
      },
    },
  },
  {
    id: "riso_ceci_piselli",
    protein: "legumes",
    carbohydrate: "riso basmati",
    vegetables: ["piselli", "menta"],
    seasons: ["spring", "summer"],
    suitableFor: ["lunch"],
    weight: "light",
    translations: {
      it: {
        name: "Riso basmati con ceci e piselli",
        description:
          "Riso basmati saltato con ceci, piselli freschi e menta.",
      },
      en: {
        name: "Basmati rice with chickpeas and peas",
        description:
          "Basmati rice sautéed with chickpeas, fresh peas and mint.",
      },
    },
  },
  {
    id: "insalata_riso_venere_tonno",
    protein: "fish",
    carbohydrate: "riso venere",
    vegetables: ["zucchine", "pomodori"],
    seasons: ["spring", "summer"],
    suitableFor: ["lunch"],
    weight: "light",
    translations: {
      it: {
        name: "Insalata di riso venere con tonno fresco",
        description:
          "Riso venere freddo con tonno scottato, zucchine grigliate e basilico.",
      },
      en: {
        name: "Venere rice salad with seared tuna",
        description:
          "Chilled venere rice with seared tuna, grilled zucchini and basil.",
      },
    },
  },
  {
    id: "pasta_pomodori_mozzarella",
    protein: "fresh_cheese",
    carbohydrate: "pasta",
    vegetables: ["pomodori", "basilico"],
    seasons: ["spring", "summer"],
    suitableFor: ["lunch"],
    weight: "light",
    translations: {
      it: {
        name: "Pasta fredda con pomodorini e mozzarella",
        description:
          "Pasta corta fredda con pomodorini, mozzarella fresca e basilico.",
      },
      en: {
        name: "Chilled pasta with cherry tomatoes and mozzarella",
        description:
          "Chilled short pasta with cherry tomatoes, fresh mozzarella and basil.",
      },
    },
  },
  {
    id: "pollo_peperoni_patate",
    protein: "white_meat",
    carbohydrate: "patate",
    vegetables: ["peperoni"],
    seasons: ["spring", "summer", "fall"],
    suitableFor: ["dinner"],
    weight: "hearty",
    translations: {
      it: {
        name: "Pollo alle erbe con peperoni e patate",
        description:
          "Cosce di pollo alle erbe con peperoni arrostiti e patate al forno.",
      },
      en: {
        name: "Herb chicken with peppers and potatoes",
        description:
          "Herb-roasted chicken thighs with roasted peppers and potatoes.",
      },
    },
  },
  {
    id: "insalata_ceci_pomodori_pane",
    protein: "legumes",
    carbohydrate: "pane integrale",
    vegetables: ["pomodori", "rucola"],
    seasons: ["spring", "summer", "fall"],
    suitableFor: ["lunch"],
    weight: "light",
    translations: {
      it: {
        name: "Insalata di ceci con pomodorini",
        description:
          "Ceci con pomodorini, rucola e pane integrale tostato.",
      },
      en: {
        name: "Chickpea salad with cherry tomatoes",
        description:
          "Chickpeas tossed with cherry tomatoes, arugula and toasted wholemeal bread.",
      },
    },
  },
  {
    id: "salmone_fagiolini_couscous",
    protein: "fish",
    carbohydrate: "cous cous",
    vegetables: ["fagiolini", "limone"],
    seasons: ["spring", "summer"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Salmone alla piastra con fagiolini",
        description:
          "Filetto di salmone alla piastra con fagiolini al vapore e cous cous.",
      },
      en: {
        name: "Griddled salmon with green beans",
        description:
          "Griddled salmon fillet with steamed green beans and couscous.",
      },
    },
  },
  {
    id: "farro_melanzane_ricotta",
    protein: "fresh_cheese",
    carbohydrate: "farro",
    vegetables: ["melanzane", "pomodori"],
    seasons: ["summer"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Farro con melanzane e ricotta fresca",
        description:
          "Farro con melanzane grigliate, pomodorini e ricotta fresca.",
      },
      en: {
        name: "Farro with grilled eggplant and fresh ricotta",
        description:
          "Farro with grilled eggplant, cherry tomatoes and fresh ricotta.",
      },
    },
  },
  {
    id: "frittata_zucchine_pane",
    protein: "eggs",
    carbohydrate: "pane integrale",
    vegetables: ["zucchine", "basilico"],
    seasons: ["spring", "summer"],
    suitableFor: ["lunch"],
    weight: "light",
    translations: {
      it: {
        name: "Frittata di zucchine con pane rustico",
        description:
          "Frittata soffice alle zucchine con pane rustico tostato.",
      },
      en: {
        name: "Zucchini frittata with rustic bread",
        description:
          "Soft zucchini frittata served with toasted rustic bread.",
      },
    },
  },
  {
    id: "risotto_zucca_robiola",
    protein: "fresh_cheese",
    carbohydrate: "riso",
    vegetables: ["zucca", "salvia"],
    seasons: ["fall"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Risotto alla zucca con robiola",
        description: "Risotto alla zucca mantecato con robiola e salvia.",
      },
      en: {
        name: "Pumpkin risotto with robiola",
        description: "Pumpkin risotto finished with robiola cheese and sage.",
      },
    },
  },
  {
    id: "tacchino_cavolfiore_patate",
    protein: "white_meat",
    carbohydrate: "patate",
    vegetables: ["cavolfiori"],
    seasons: ["fall", "winter"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Tacchino al forno con cavolfiore",
        description:
          "Fettine di tacchino al forno con cavolfiore arrosto e patate.",
      },
      en: {
        name: "Roasted turkey with cauliflower",
        description:
          "Roasted turkey slices with caramelised cauliflower and potatoes.",
      },
    },
  },
  {
    id: "sgombro_finocchi_couscous",
    protein: "fish",
    carbohydrate: "cous cous integrale",
    vegetables: ["finocchi", "radicchio"],
    seasons: ["fall", "winter"],
    suitableFor: ["lunch", "dinner"],
    weight: "light",
    translations: {
      it: {
        name: "Sgombro arrosto con finocchi",
        description:
          "Filetti di sgombro arrosto con finocchi croccanti e cous cous integrale.",
      },
      en: {
        name: "Roasted mackerel with fennel",
        description:
          "Roasted mackerel fillets with crisp fennel and wholemeal couscous.",
      },
    },
  },
  {
    id: "zuppa_fagioli_verza",
    protein: "legumes",
    carbohydrate: "pane rustico",
    vegetables: ["verza", "carote"],
    seasons: ["fall", "winter"],
    suitableFor: ["dinner"],
    weight: "hearty",
    translations: {
      it: {
        name: "Zuppa di fagioli borlotti",
        description:
          "Zuppa rustica di fagioli borlotti con verza e pane rustico.",
      },
      en: {
        name: "Borlotti bean soup",
        description:
          "Rustic borlotti bean soup with savoy cabbage and country bread.",
      },
    },
  },
  {
    id: "pasta_zucca_salsiccia",
    protein: "red_meat",
    carbohydrate: "pasta",
    vegetables: ["zucca", "rosmarino"],
    seasons: ["fall"],
    suitableFor: ["dinner"],
    weight: "hearty",
    translations: {
      it: {
        name: "Pasta con zucca e salsiccia",
        description:
          "Pasta corta con zucca arrostita e salsiccia sbriciolata alle erbe.",
      },
      en: {
        name: "Pasta with pumpkin and sausage",
        description:
          "Short pasta with roasted pumpkin and herb-seasoned sausage crumbles.",
      },
    },
  },
  {
    id: "gnocchi_ricotta_spinaci",
    protein: "fresh_cheese",
    carbohydrate: "gnocchi di patate",
    vegetables: ["spinaci"],
    seasons: ["winter", "spring"],
    suitableFor: ["dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Gnocchi di ricotta e spinaci",
        description:
          "Gnocchi di patate saltati con crema di ricotta e spinaci freschi.",
      },
      en: {
        name: "Ricotta and spinach gnocchi",
        description:
          "Potato gnocchi tossed with ricotta cream and fresh spinach.",
      },
    },
  },
  {
    id: "couscous_legumi_verdure",
    protein: "legumes",
    carbohydrate: "cous cous integrale",
    vegetables: ["zucchine", "carote", "peperoni"],
    seasons: ["spring", "summer", "fall"],
    suitableFor: ["lunch", "dinner"],
    weight: "normal",
    translations: {
      it: {
        name: "Cous cous integrale con legumi",
        description:
          "Cous cous integrale con ceci, verdure arrosto e olio al limone.",
      },
      en: {
        name: "Wholemeal couscous with legumes",
        description:
          "Wholemeal couscous with chickpeas, roasted vegetables and lemon oil.",
      },
    },
  },
];

const SEASONAL_MEAL_LIBRARY: MealOption[] = SEASONAL_MEAL_LIBRARY_BASE.map(
  (meal) => ({
    ...meal,
    normalizedNames: Object.values(meal.translations).map((t) =>
      normalizeName(t.name)
    ),
  })
);

const MEAL_BY_NAME = new Map<string, MealOption>();
for (const meal of SEASONAL_MEAL_LIBRARY) {
  for (const normalizedName of meal.normalizedNames) {
    if (!MEAL_BY_NAME.has(normalizedName)) {
      MEAL_BY_NAME.set(normalizedName, meal);
    }
  }
}

function normalizeName(name: string): string {
  return name
    .toLocaleLowerCase()
    .replace(/[\s]+/g, " ")
    .replace(/["'’]/g, "")
    .trim();
}

export function getSeasonalVegetables(date: Date): string[] {
  const month = date.getMonth();

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

function getSeason(date: Date): Season {
  const month = date.getMonth();
  if (month === 11 || month === 0 || month === 1) return "winter";
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  return "fall";
}

function coerceLanguage(language: string | undefined): SupportedLanguage {
  return language === "en" || language === "it" ? language : DEFAULT_LANGUAGE;
}

function withinProteinLimit(
  protein: ProteinType,
  counts: Record<ProteinType, number>
): boolean {
  const limit = PROTEIN_LIMITS[protein];
  return typeof limit === "number" ? counts[protein] < limit : true;
}

function scoreMealOption(
  meal: MealOption,
  slot: MealSlot,
  counts: Record<ProteinType, number>,
  recentMealNames: Set<string>,
  lastProtein: ProteinType | null
): number {
  let score = 0;

  if (slot === "lunch") {
    if (meal.weight === "light") score += 1.2;
    if (meal.weight === "hearty") score -= 1;
  } else {
    if (meal.weight === "hearty") score += 0.6;
    if (meal.weight === "light") score -= 0.6;
  }

  if (counts[meal.protein] === 0) {
    score += 0.8;
  }

  const remainingTarget = (MINIMUM_TARGETS[meal.protein] || 0) - counts[meal.protein];
  if (remainingTarget > 0) {
    score += 1.2;
  }

  if (meal.normalizedNames.some((name) => recentMealNames.has(name))) {
    score -= 2.5;
  }

  if (lastProtein && meal.protein === lastProtein) {
    score -= 1.5;
  }

  score += Math.random() * 0.3;

  return score;
}

function buildInitialCounts(): Record<ProteinType, number> {
  return {
    legumes: 0,
    white_meat: 0,
    red_meat: 0,
    fresh_cheese: 0,
    fish: 0,
    eggs: 0,
  };
}

function getMostRecentProteinFromPast(pastMeals: PastMeal[]): ProteinType | null {
  const sorted = [...pastMeals].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  for (const meal of sorted) {
    const matched = MEAL_BY_NAME.get(normalizeName(meal.name));
    if (matched) {
      return matched.protein;
    }
  }
  return null;
}

export interface PastMeal {
  name: string;
  day: string;
  type: "lunch" | "dinner";
  createdAt: Date;
}

export async function generateMealPlan(
  pastMeals: PastMeal[] = [],
  language: string = DEFAULT_LANGUAGE
): Promise<WeeklyMealPlan> {
  const currentDate = new Date();
  const season = getSeason(currentDate);
  const seasonalMeals = SEASONAL_MEAL_LIBRARY.filter((meal) =>
    meal.seasons.includes("all") || meal.seasons.includes(season)
  );
  const fallbackMeals = seasonalMeals.length > 0
    ? seasonalMeals
    : SEASONAL_MEAL_LIBRARY;

  const normalizedLanguage = coerceLanguage(language);

  const recentMealNames = new Set(
    [...pastMeals]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((meal) => normalizeName(meal.name))
  );

  const usedMealIds = new Set<string>();
  const counts = buildInitialCounts();
  let lastProtein: ProteinType | null = getMostRecentProteinFromPast(pastMeals);

  const plan = {
    monday: { lunch: { name: "" }, dinner: { name: "" } },
    tuesday: { lunch: { name: "" }, dinner: { name: "" } },
    wednesday: { lunch: { name: "" }, dinner: { name: "" } },
    thursday: { lunch: { name: "" }, dinner: { name: "" } },
    friday: { lunch: { name: "" }, dinner: { name: "" } },
    saturday: { lunch: { name: "" }, dinner: { name: "" } },
    sunday: { lunch: { name: "" }, dinner: { name: "" } },
  } as WeeklyMealPlan;

  const slots: { day: DayKey; type: MealSlot }[] = DAYS.flatMap((day) => [
    { day, type: "lunch" as MealSlot },
    { day, type: "dinner" as MealSlot },
  ]);

  for (const slot of slots) {
    const candidate = selectMealForSlot({
      slot,
      meals: fallbackMeals,
      counts,
      usedMealIds,
      lastProtein,
      recentMealNames,
    });

    const translation = candidate.translations[normalizedLanguage];

    plan[slot.day][slot.type] = {
      name: translation.name,
      description: translation.description,
    };

    usedMealIds.add(candidate.id);
    counts[candidate.protein] += 1;
    lastProtein = candidate.protein;
  }

  WeeklyMealPlanSchema.parse(plan);
  return plan;
}

type SelectionContext = {
  slot: { day: DayKey; type: MealSlot };
  meals: MealOption[];
  counts: Record<ProteinType, number>;
  usedMealIds: Set<string>;
  lastProtein: ProteinType | null;
  recentMealNames: Set<string>;
};

function selectMealForSlot(context: SelectionContext): MealOption {
  const { slot, meals, counts, usedMealIds, lastProtein, recentMealNames } =
    context;

  const suitableMeals = meals.filter((meal) =>
    meal.suitableFor.includes(slot.type)
  );

  const filterStages: ((meal: MealOption) => boolean)[] = [
    (meal) =>
      !usedMealIds.has(meal.id) &&
      !meal.normalizedNames.some((name) => recentMealNames.has(name)) &&
      meal.protein !== lastProtein &&
      withinProteinLimit(meal.protein, counts),
    (meal) =>
      !usedMealIds.has(meal.id) &&
      meal.protein !== lastProtein &&
      withinProteinLimit(meal.protein, counts),
    (meal) =>
      !usedMealIds.has(meal.id) &&
      withinProteinLimit(meal.protein, counts),
    (meal) => withinProteinLimit(meal.protein, counts),
  ];

  for (const filter of filterStages) {
    const filtered = suitableMeals.filter(filter);
    if (!filtered.length) {
      continue;
    }

    const scored = filtered
      .map((meal) => ({
        meal,
        score: scoreMealOption(
          meal,
          slot.type,
          counts,
          recentMealNames,
          lastProtein
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const bestCandidate = scored[0]?.meal;
    if (bestCandidate) {
      return bestCandidate;
    }
  }

  const suitableWithinLimit = suitableMeals.find((meal) =>
    withinProteinLimit(meal.protein, counts)
  );
  if (suitableWithinLimit) {
    return suitableWithinLimit;
  }

  const anyWithinLimit = meals.find((meal) =>
    withinProteinLimit(meal.protein, counts)
  );
  if (anyWithinLimit) {
    return anyWithinLimit;
  }

  throw new Error("No meals available to build the plan");
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

  const parsedResponse = JSON.parse(
    response?.choices?.[0]?.message?.content || ""
  );

  return GroceryListSchema.parse(parsedResponse);
}
