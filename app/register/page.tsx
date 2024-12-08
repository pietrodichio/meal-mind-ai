"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("Registering is not available yet");
    setIsLoading(false);

    //   const formData = new FormData(e.currentTarget);
    //   const data = {
    //     email: formData.get("email"),
    //     password: formData.get("password"),
    //     name: formData.get("name"),
    //   };

    //   try {
    //     const res = await fetch("/api/register", {
    //       method: "POST",
    //       body: JSON.stringify(data),
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     });

    //     if (!res.ok) {
    //       const error = await res.json();
    //       throw new Error(error.error || "Failed to register");
    //     }

    //     // Automatically sign in after registration
    //     const signInResult = await signIn("credentials", {
    //       email: data.email,
    //       password: data.password,
    //       redirect: false,
    //     });

    //     if (signInResult?.error) {
    //       throw new Error("Failed to sign in");
    //     }

    //     router.push("/");
    //     router.refresh();
    //   } catch (error) {
    //     setError(error instanceof Error ? error.message : "Something went wrong");
    //   } finally {
    //     setIsLoading(false);
    //   }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your details below to create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/90 font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
