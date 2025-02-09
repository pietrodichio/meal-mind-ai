"use client";

import { useState } from "react";
import { type MealPlan } from "@/lib/types";
import { DayRow } from "./DayRow";
import { useToast } from "@/hooks/use-toast";
import { Mail, ShoppingBasket, Share2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { GroceryList } from "@/lib/meal-generator";
import { mealPlanApi } from "@/lib/api-client";

interface MealPlanGridProps {
  mealPlan?: MealPlan;
  onUpdate?: (mealPlan: MealPlan) => void;
  onDelete?: (mealPlan: MealPlan) => void;
}

export function MealPlanGrid({
  mealPlan,
  onUpdate,
  onDelete,
}: MealPlanGridProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingGroceryList, setIsLoadingGroceryList] = useState(false);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [isEditingGroceryList, setIsEditingGroceryList] = useState(false);
  const [editedCategories, setEditedCategories] = useState<
    GroceryList["categories"] | null
  >(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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

    // Create optimistically updated meal plan
    const updatedMealPlan = {
      ...mealPlan,
      meals:
        mealPlan.meals?.map((m) =>
          m.day === day && m.type === meal ? { ...m, name: value } : m
        ) || [],
    };

    // Optimistically update the UI
    onUpdate?.(updatedMealPlan);
    setIsEditing(null);

    try {
      const serverUpdatedMealPlan = await mealPlanApi.update(mealPlan.id, {
        plan: {
          [day]: {
            [meal]: { name: value },
          },
        },
      });

      // Update with server response to ensure consistency
      onUpdate?.(serverUpdatedMealPlan);
    } catch (error) {
      // Revert to original state on error
      onUpdate?.(mealPlan);
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

  const handleDelete = async () => {
    if (!mealPlan?.id) return;
    setIsDeleting(true);

    try {
      await mealPlanApi.delete(mealPlan.id);
      onDelete?.(mealPlan);
      toast({
        title: "Success",
        description: "Meal plan deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meal plan",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateGroceryList = async () => {
    if (!mealPlan?.id) return;
    setIsLoadingGroceryList(true);

    try {
      const data = await mealPlanApi.getGroceryList(mealPlan.id);
      setGroceryList(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate grocery list",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGroceryList(false);
    }
  };

  const handleSendEmail = async () => {
    if (!mealPlan?.id) return;
    setIsSendingEmail(true);

    try {
      await mealPlanApi.sendEmail(mealPlan.id);
      toast({
        title: "Success",
        description: "Meal plan sent to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyGroceryList = () => {
    if (!groceryList) return;

    const formattedList = Object.entries(groceryList.categories)
      .map(([category, items]) => {
        return `${category}:\n${items
          .map(
            (item) =>
              `- ${item.item}${item.quantity ? ` - ${item.quantity}` : ""}${
                item.note ? ` (${item.note})` : ""
              }`
          )
          .join("\n")}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(formattedList);
    toast({
      title: "Success",
      description: "Grocery list copied to clipboard",
    });
  };

  const handleSaveGroceryList = async () => {
    if (!mealPlan?.id || !editedCategories) return;

    try {
      const updatedList = await mealPlanApi.updateGroceryList(
        mealPlan.id,
        editedCategories
      );
      setGroceryList(updatedList);
      setIsEditingGroceryList(false);
      toast({
        title: "Success",
        description: "Grocery list saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save grocery list",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (
    category: string,
    index: number,
    field: "item" | "quantity" | "note",
    value: string
  ) => {
    if (!editedCategories) return;

    const newCategories = { ...editedCategories };
    newCategories[category][index] = {
      ...newCategories[category][index],
      [field]: value,
    };
    setEditedCategories(newCategories);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 border rounded-lg p-4 relative">
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGenerateGroceryList}
              disabled={isLoadingGroceryList}
            >
              <ShoppingBasket className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-scroll">
            <SheetHeader>
              <SheetTitle>Grocery List</SheetTitle>
              <SheetDescription>
                Here&apos;s what you need for this meal plan
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {groceryList ? (
                <>
                  <div className="space-y-4">
                    {Object.entries(
                      isEditingGroceryList
                        ? editedCategories!
                        : groceryList.categories
                    ).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="font-semibold mb-2">{category}</h3>
                        <ul className="list-disc pl-4 space-y-1">
                          {items.map((item, index) => (
                            <li key={index}>
                              {isEditingGroceryList ? (
                                <div className="flex gap-2 items-center">
                                  <input
                                    className="flex-1 bg-background"
                                    value={item.item}
                                    onChange={(e) =>
                                      handleEditItem(
                                        category,
                                        index,
                                        "item",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <input
                                    className="w-24 bg-background"
                                    value={item.quantity || ""}
                                    onChange={(e) =>
                                      handleEditItem(
                                        category,
                                        index,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Quantity"
                                  />
                                  <input
                                    className="w-24 bg-background"
                                    value={item.note || ""}
                                    onChange={(e) =>
                                      handleEditItem(
                                        category,
                                        index,
                                        "note",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Note"
                                  />
                                </div>
                              ) : (
                                <>
                                  {item.item}
                                  {item.quantity && ` - ${item.quantity}`}
                                  {item.note && ` (${item.note})`}
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {isEditingGroceryList ? (
                      <>
                        <Button onClick={handleSaveGroceryList}>
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingGroceryList(false);
                            setEditedCategories(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            setIsEditingGroceryList(true);
                            setEditedCategories({ ...groceryList.categories });
                          }}
                        >
                          Edit List
                        </Button>
                        <Button onClick={handleCopyGroceryList}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  {isLoadingGroceryList
                    ? "Generating grocery list..."
                    : "Failed to load grocery list"}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSendEmail}
          disabled={isSendingEmail}
        >
          <Mail className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                meal plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

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
