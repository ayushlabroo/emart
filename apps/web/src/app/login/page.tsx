"use client"; // yeh browser mein chalta hai, server pe nahi

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { setAccessToken } from "@/lib/axios";
import { useAuthStore } from "@/lib/store/auth";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,      // input ko form se connect karta hai
    handleSubmit,  // submit pe validation chalaata hai
    formState: { errors, isSubmitting }, // errors + loading state
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema), // Zod validation React Hook Form se connect
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const { data } = await api.post("/auth/login", values);
      setAccessToken(data.data.accessToken);
      // Component ke bahar store access: useAuthStore.getState() (hook nahi hai)
      useAuthStore.getState().setUser(data.data.user);
      router.push("/"); // homepage pe bhejo
    } catch (err: unknown) {
      // API se aaya error message dikhao
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Login fail hua, dobara try karo";
      setServerError(message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Wapas aao!</h1>
          <p className="mt-1 text-sm text-gray-500">EMart mein login karo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="tum@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Account nahi hai?{" "}
          <Link href="/register" className="text-green-600 font-medium hover:underline">
            Register karo
          </Link>
        </p>
      </div>
    </main>
  );
}
