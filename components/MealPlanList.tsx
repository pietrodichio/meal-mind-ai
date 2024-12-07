"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useRef } from "react";
import { MealPlan } from "@/lib/types";
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
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const lastPlanRef = useRef<HTMLDivElement>(null);

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

  // Scroll to last plan when data changes
  useEffect(() => {
    if (data?.pages) {
      lastPlanRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.pages]);

  if (status === "pending") return <div>Loading...</div>;
  if (status === "error") return <div>Error loading meal plans</div>;

  const allPlans = data.pages.flatMap((page) => page.items);
  const lastPlanIndex = allPlans.length - 1;

  return (
    <div className="space-y-16">
      {data.pages.map((page, pageIndex) =>
        page.items.map((mealPlan, index) => {
          const planNumber = pageIndex * 5 + index + 1;
          const isLastPlan = pageIndex * 5 + index === lastPlanIndex;

          return (
            <div key={mealPlan.id} ref={isLastPlan ? lastPlanRef : undefined}>
              <div className="mb-4 text-sm text-muted-foreground text-center">
                Plan {planNumber}
              </div>
              <MealPlanGrid
                mealPlan={mealPlan}
                onUpdate={(updatedPlan) => {
                  queryClient.setQueryData(["mealPlans"], (oldData: any) => ({
                    pages: oldData.pages.map((page: any) => ({
                      ...page,
                      items: page.items.map((item: any) =>
                        item.id === updatedPlan.id ? updatedPlan : item
                      ),
                    })),
                    pageParams: oldData.pageParams,
                  }));
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
