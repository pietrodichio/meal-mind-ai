"use client";

import { useState } from "react";
import { exampleMealPlan, type MealPlan, DayOfWeek } from "@/lib/types";
import { DayRow } from "./DayRow";

interface MealPlanGridProps {
  mealPlan?: MealPlan;
  onUpdate?: (mealPlan: MealPlan) => void;
}

export function MealPlanGrid({
  mealPlan = exampleMealPlan,
  onUpdate,
}: MealPlanGridProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  const handleEdit = (day: DayOfWeek, meal: "lunch" | "dinner") => {
    setIsEditing(`${day}-${meal}`);
  };

  const handleSave = (
    day: DayOfWeek,
    meal: "lunch" | "dinner",
    value: string
  ) => {
    if (!mealPlan || !onUpdate) return;

    const updatedMealPlan = {
      ...mealPlan,
      [day]: {
        ...mealPlan[day],
        [meal]: { name: value },
      },
    };

    onUpdate(updatedMealPlan);
    setIsEditing(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Headers - Only visible on desktop */}
      <div className="hidden md:grid md:grid-cols-[200px_1fr_1fr] gap-4 mb-4">
        <div></div>
        <div className="font-semibold text-center">Lunch</div>
        <div className="font-semibold text-center">Dinner</div>
      </div>

      {/* Grid rows */}
      <div className="space-y-6">
        {days.map((day) => (
          <DayRow
            key={day}
            day={day}
            meals={mealPlan[day]}
            isEditing={isEditing}
            onEdit={(meal) => handleEdit(day, meal)}
            onSave={(meal, value) => handleSave(day, meal, value)}
          />
        ))}
      </div>
    </div>
  );
}
