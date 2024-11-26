"use client";

import { MoonIcon, SunIcon, UtensilsCrossed } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "./ui/button";

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <UtensilsCrossed className="h-6 w-6" />
            <span className="text-xl font-bold">MealMind AI</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/meal-plans" className="hover:text-primary">
              Meal Plans
            </Link>
            <Link href="/settings" className="hover:text-primary">
              Settings
            </Link>
          </nav>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}