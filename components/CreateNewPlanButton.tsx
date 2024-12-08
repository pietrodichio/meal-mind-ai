"use client";

import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { mealPlanApi } from "@/lib/api-client";

export function CreateNewPlanButton() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: mealPlanApi.create,
    onSuccess: () => {
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
