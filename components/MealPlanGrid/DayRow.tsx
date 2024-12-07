import { DayMeals, DayOfWeek } from "@/lib/types";
import { MealCell } from "./MealCell";

interface DayRowProps {
  day: DayOfWeek;
  meals: DayMeals;
  isEditing: string | null;
  onEdit: (meal: "lunch" | "dinner") => void;
  onSave: (meal: "lunch" | "dinner", value: string) => void;
}

export function DayRow({ day, meals, isEditing, onEdit, onSave }: DayRowProps) {
  return (
    <div>
      {/* Mobile day header */}
      <h3 className="font-medium capitalize mb-2 md:hidden">{day}</h3>

      {/* Desktop row */}
      <div className="grid grid-cols-2 md:grid-cols-[200px_1fr_1fr] gap-4 items-center">
        {/* Day label - Only visible on desktop */}
        <div className="hidden md:block font-medium capitalize">{day}</div>

        {/* Lunch */}
        <div>
          <div className="text-sm text-muted-foreground mb-1 md:hidden">
            Lunch
          </div>
          <MealCell
            value={meals?.lunch?.name}
            isEditing={isEditing === `${day}-lunch`}
            onEdit={() => onEdit("lunch")}
            onSave={(value) => onSave("lunch", value)}
          />
        </div>

        {/* Dinner */}
        <div>
          <div className="text-sm text-muted-foreground mb-1 md:hidden">
            Dinner
          </div>
          <MealCell
            value={meals?.dinner?.name}
            isEditing={isEditing === `${day}-dinner`}
            onEdit={() => onEdit("dinner")}
            onSave={(value) => onSave("dinner", value)}
          />
        </div>
      </div>
    </div>
  );
}
