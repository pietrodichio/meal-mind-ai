import { Button } from "@/components/ui/button";
import { CalendarDays, ChefHat, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { MealPlanList } from "@/components/MealPlanList";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-6">
        Your Personal AI Meal Planner
      </h1>
      <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl">
        Generate personalized weekly meal plans, get shopping lists, and
        discover new recipes tailored to your preferences and dietary
        requirements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mb-12">
        <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg">
          <CalendarDays className="h-12 w-12 mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Weekly Meal Plans</h2>
          <p className="text-center text-muted-foreground">
            AI-generated meal plans customized to your preferences
          </p>
        </div>

        <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg">
          <ShoppingBasket className="h-12 w-12 mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Shopping Lists</h2>
          <p className="text-center text-muted-foreground">
            Automated shopping lists for your weekly meals
          </p>
        </div>

        <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg">
          <ChefHat className="h-12 w-12 mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Daily Recipes</h2>
          <p className="text-center text-muted-foreground">
            Detailed recipes delivered to your inbox
          </p>
        </div>
      </div>

      <Link href="/register">
        <Button size="lg" className="text-lg">
          Get Started
        </Button>
      </Link>
    </div>
  );
}
