"use client";

import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

async function createMealPlan() {
  const response = await fetch("/api/meal-plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to create meal plan");
  }

  return response.json();
}

export function CreateNewPlanButton() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: createMealPlan,
    onSuccess: (newPlan) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      toast({
        title: "Success",
        description: "New meal plan created",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create meal plan",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      size="lg"
      className="text-lg"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "Creating..." : "Create New Plan"}
    </Button>
  );
}
