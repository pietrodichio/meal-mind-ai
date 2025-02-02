import { MealPlanList } from "@/components/MealPlanList";
import { CreateNewPlanButton } from "@/components/CreateNewPlanButton";

export default function Plans() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-6">Your Meal Plans</h1>
      <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl">
        View and manage your meal plans here.
      </p>
      <CreateNewPlanButton />
      <div className="w-full my-12 ">
        <MealPlanList />
      </div>
    </div>
  );
}
