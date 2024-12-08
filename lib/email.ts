import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface MealPlanEmailProps {
  meals: {
    day: string;
    type: string;
    name: string;
  }[];
  groceryList?: {
    categories: {
      [key: string]: {
        item: string;
        quantity?: string;
        note?: string;
      }[];
    };
  };
}

export async function sendMealPlanEmail(
  to: string,
  { meals, groceryList }: MealPlanEmailProps
) {
  const mealsByDay = meals.reduce((acc, meal) => {
    if (!acc[meal.day]) {
      acc[meal.day] = { lunch: "", dinner: "" };
    }
    acc[meal.day][meal.type as "lunch" | "dinner"] = meal.name;
    return acc;
  }, {} as Record<string, { lunch: string; dinner: string }>);

  const groceryListHtml = groceryList
    ? `
      <h2 style="color: #334155; margin-top: 24px;">Grocery List</h2>
      ${Object.entries(groceryList.categories)
        .map(
          ([category, items]) => `
          <h3 style="color: #475569; margin-top: 16px;">${category}</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${items
              .map(
                (item) =>
                  `<li style="margin: 4px 0;">${item.item}${
                    item.quantity ? ` - ${item.quantity}` : ""
                  }${item.note ? ` (${item.note})` : ""}</li>`
              )
              .join("")}
          </ul>
        `
        )
        .join("")}
    `
    : "";

  const { data, error } = await resend.emails.send({
    from: "MealMind <pietrodichio96@gmail.com>",
    to: [to],
    subject: "Your Weekly Meal Plan",
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e293b; margin-bottom: 24px;">Your Weekly Meal Plan</h1>
        
        ${Object.entries(mealsByDay)
          .map(
            ([day, meals]) => `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #334155; text-transform: capitalize; margin-bottom: 12px;">${day}</h2>
              <div style="margin-left: 16px;">
                <p style="margin: 8px 0;"><strong>Lunch:</strong> ${meals.lunch}</p>
                <p style="margin: 8px 0;"><strong>Dinner:</strong> ${meals.dinner}</p>
              </div>
            </div>
          `
          )
          .join("")}

        ${groceryListHtml}
      </div>
    `,
  });

  if (error) {
    throw error;
  }

  return data;
}
