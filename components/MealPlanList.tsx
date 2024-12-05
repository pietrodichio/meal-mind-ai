"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { exampleMealPlan, MealPlan } from "@/lib/types";
import { MealPlanGrid } from "./MealPlanGrid";

async function fetchMealPlans({ pageParam = 0 }): Promise<{
  items: MealPlan[];
  nextCursor: number | null;
}> {
  const response = await fetch(`/api/meal-plans?cursor=${pageParam}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

export function MealPlanList() {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["mealPlans"],
      queryFn: fetchMealPlans,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 0,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") return <div>Loading...</div>;
  if (status === "error") return <div>Error loading meal plans</div>;

  return (
    <div className="space-y-16">
      {data.pages.map((page, pageIndex) =>
        page.items.map((mealPlan, index) => {
          const planNumber = pageIndex * 5 + index + 1;
          return (
            <div key={mealPlan.id}>
              <div className="mb-4 text-sm text-muted-foreground text-center">
                Plan {planNumber}
              </div>
              <MealPlanGrid
                mealPlan={mealPlan}
                onUpdate={(updatedPlan) => {
                  // Handle update
                  console.log("Updated plan:", updatedPlan);
                }}
              />
            </div>
          );
        })
      )}

      <div ref={ref} className="h-4" />

      {isFetchingNextPage && (
        <div className="text-center text-muted-foreground">Loading more...</div>
      )}
    </div>
  );
}
