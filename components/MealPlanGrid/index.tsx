"use client";

import { useState } from "react";
import { type MealPlan } from "@/lib/types";
import { DayRow } from "./DayRow";
import { useToast } from "@/hooks/use-toast";

interface MealPlanGridProps {
  mealPlan?: MealPlan;
  onUpdate?: (mealPlan: MealPlan) => void;
}

export function MealPlanGrid({ mealPlan, onUpdate }: MealPlanGridProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { toast } = useToast();

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  const handleEdit = (day: string, meal: "lunch" | "dinner") => {
    setIsEditing(`${day}-${meal}`);
  };

  const handleSave = async (
    day: string,
    meal: "lunch" | "dinner",
    value: string
  ) => {
    if (!mealPlan?.id) return;

    try {
      const res = await fetch(`/api/meal-plans/${mealPlan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: {
            [day]: {
              [meal]: { name: value },
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update meal plan");
      }

      const updatedMealPlan = {
        ...mealPlan,
        meals: mealPlan.meals.map((m) =>
          m.day === day && m.type === meal ? { ...m, name: value } : m
        ),
      };

      // Trigger refetch through parent
      onUpdate?.(updatedMealPlan);
      setIsEditing(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMealValue = (day: string, type: "lunch" | "dinner") => {
    return (
      mealPlan?.meals?.find((meal) => meal.day === day && meal.type === type)
        ?.name || ""
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 border rounded-lg p-4">
      {/* Headers - Only visible on desktop */}
      <div className="hidden md:grid md:grid-cols-[200px_1fr_1fr] gap-4 mb-4">
        <div className="text-center font-extralight text-muted-foreground text-xs justify-center flex flex-col items-center">
          <p>
            {mealPlan?.createdAt
              ? `Creation date ${new Date(
                  mealPlan.createdAt
                ).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <div className="font-semibold text-center">Lunch</div>
        <div className="font-semibold text-center">Dinner</div>
      </div>

      {/* Grid rows */}
      <div className="space-y-6">
        {days.map((day) => (
          <DayRow
            key={day}
            day={day}
            meals={{
              lunch: { name: getMealValue(day, "lunch") },
              dinner: { name: getMealValue(day, "dinner") },
            }}
            isEditing={isEditing}
            onEdit={(meal) => handleEdit(day, meal)}
            onSave={(meal, value) => handleSave(day, meal, value)}
          />
        ))}
      </div>
    </div>
  );
}
