import axios from "axios";
import type { GroceryList } from "./meal-generator";
import type { MealPlan } from "./types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface UpdateMealPayload {
  plan: {
    [key: string]: {
      [key: string]: { name: string };
    };
  };
}

export const mealPlanApi = {
  // Meal Plans
  getAll: async (cursor?: number) => {
    const { data } = await api.get<{
      items: MealPlan[];
      nextCursor: number | null;
    }>(`/meal-plans${cursor ? `?cursor=${cursor}` : ""}`);
    return data;
  },

  create: async () => {
    const { data } = await api.post<MealPlan>("/meal-plans");
    return data;
  },

  update: async (id: string, payload: UpdateMealPayload) => {
    const { data } = await api.patch<MealPlan>(`/meal-plans/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/meal-plans/${id}`);
  },

  // Grocery Lists
  getGroceryList: async (mealPlanId: string) => {
    const { data } = await api.get<GroceryList>(
      `/meal-plans/${mealPlanId}/grocery-list`
    );
    return data;
  },

  updateGroceryList: async (
    mealPlanId: string,
    categories: GroceryList["categories"]
  ) => {
    const { data } = await api.patch<GroceryList>(
      `/meal-plans/${mealPlanId}/grocery-list`,
      {
        categories,
      }
    );
    return data;
  },

  // Email
  sendEmail: async (mealPlanId: string) => {
    await api.post(`/meal-plans/${mealPlanId}/email`);
  },
};

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
