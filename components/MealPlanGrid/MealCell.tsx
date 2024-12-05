import { useMemo } from "react";

interface MealCellProps {
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
}

export function MealCell({ value, isEditing, onEdit, onSave }: MealCellProps) {
  const fontSize = useMemo(() => {
    const length = value?.length || 0;
    if (length === 0) return "1rem";
    if (length < 20) return "1rem";
    if (length < 30) return "0.875rem";
    if (length < 50) return "0.75rem";
    if (length < 100) return "0.625rem";
    return "0.5rem";
  }, [value]);

  return (
    <div className="aspect-square md:aspect-auto md:h-[120px] bg-card rounded-lg border relative">
      {isEditing ? (
        <textarea
          className="absolute inset-0 h-full w-full resize-none text-center p-4 bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 items-center justify-center"
          style={{ fontSize }}
          defaultValue={value}
          autoFocus
          onBlur={(e) => onSave(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
      ) : (
        <div
          className="absolute inset-0 cursor-pointer hover:bg-accent p-4 rounded-lg flex items-center justify-center"
          onClick={onEdit}
        >
          <div className="w-full text-center" style={{ fontSize }}>
            {value || "Add meal..."}
          </div>
        </div>
      )}
    </div>
  );
}
