"use client";

/**
 * Admin Login Page — Undangin.studio
 * src/app/(auth)/login/page.tsx
 *
 * Implements a high-end 50/50 split-screen layout mirroring the spec.
 * Uses react-hook-form, zod resolver, and Mantine UI inputs.
 */
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TextInput,
  PasswordInput,
  Button,
  Divider,
  Group,
  Text,
  Title,
  Card,
  Box,
  Alert,
} from "@mantine/core";
import { Mail, Lock, AlertCircle, Sparkles } from "lucide-react";
import { loginAdminAction } from "@/features/auth/actions/login";

// ---------------------------------------------------------------------------
// Form Validation Schema
// ---------------------------------------------------------------------------
const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Get callbackUrl parameter to redirect after successful login
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setGlobalError(null);

    try {
      const result = await loginAdminAction(values);

      if (result.success) {
        // Successful login, redirect to callbackUrl
        router.push(callbackUrl);
        router.refresh();
      } else {
        setGlobalError(result.error);
      }
    } catch (err) {
      console.error("[Login Form] error submitting:", err);
      setGlobalError("Koneksi gagal. Silakan periksa jaringan Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-app p-4 md:p-8">
      {/* Central 50/50 Card Panel */}
      <div
        className="w-full max-w-5xl bg-surface border border-border p-0 flex flex-col md:flex-row overflow-hidden rounded-[12px]"
      >
        {/* ── LEFT SECTION: Hero Panel ────────────────────────────────────── */}
        <div className="hidden md:flex md:w-1/2 bg-linear-to-br from-[#1E2522] to-[#39443c] p-12 flex-col justify-between text-white relative">
          {/* Subtle Decorative Grid */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[16px_16px]" />

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide text-[#b3c7b9] backdrop-blur-sm">
              <Sparkles size={12} />
              SaaS Admin Portal
            </span>
            <Title className="text-4xl font-extrabold tracking-tight leading-tight mt-6 text-white max-w-sm">
              Manage & Craft Exquisite Invitations Today.
            </Title>
            <Text size="sm" className="text-[#b3c7b9] mt-3 max-w-xs">
              Sistem manajemen internal terpadu untuk pengeditan template, invoice pembayaran, dan blast WhatsApp tamu undangan.
            </Text>
          </div>

          {/* Minimalist 3D Graphic Placeholder */}
          <div className="my-8 flex justify-center items-center">
            <svg
              className="w-48 h-48 animate-pulse text-[#7A8F81]"
              viewBox="0 0 200 200"
              fill="none"
            >
              <rect
                x="40"
                y="50"
                width="120"
                height="100"
                rx="16"
                fill="currentColor"
                fillOpacity="0.15"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                d="M 40 66 L 100 110 L 160 66"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="100"
                cy="100"
                r="25"
                fill="#ffffff"
                fillOpacity="0.9"
                className="shadow-sm"
              />
              <path
                d="M 94 100 L 106 100 M 100 94 L 100 106"
                stroke="#1E2522"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Footer Branding */}
          <div className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
            © 2026 undangin.studio. all rights reserved.
          </div>
        </div>

        {/* ── RIGHT SECTION: Login Form Panel ──────────────────────────────── */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Header / Brand Identity */}
            <div className="mb-8">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="h-6 w-6 rounded-lg bg-[#7A8F81] flex items-center justify-center text-white font-bold text-sm">
                  U
                </div>
                <Text className="font-bold tracking-tight text-primary" size="md">
                  undangin<span className="text-[#7A8F81]">.studio</span>
                </Text>
              </div>
              <Title order={2} className="text-2xl font-bold tracking-tight text-primary">
                Admin Portal Access
              </Title>
              <Text size="xs" className="text-secondary mt-1">
                Sign in to manage and build digitized event ecosystems.
              </Text>
            </div>

            {/* Global Error Alert */}
            {globalError && (
              <Alert
                icon={<AlertCircle size={16} />}
                title="Login Gagal"
                color="red"
                variant="light"
                className="mb-6"
                radius="12px"
              >
                {globalError}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email field */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Alamat Email"
                    placeholder="nama@undangin.studio"
                    leftSection={<Mail size={16} className="text-slate-400" />}
                    error={errors.email?.message}
                    size="sm"
                    styles={{
                      input: {
                        borderRadius: "12px",
                        borderColor: "var(--color-border)",
                        transition: "all 0.2s ease",
                      },
                    }}
                  />
                )}
              />

              {/* Password field */}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="Kata Sandi"
                    placeholder="••••••••"
                    leftSection={<Lock size={16} className="text-slate-400" />}
                    error={errors.password?.message}
                    size="sm"
                    styles={{
                      input: {
                        borderRadius: "12px",
                        borderColor: "var(--color-border)",
                        transition: "all 0.2s ease",
                      },
                    }}
                  />
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                fullWidth
                color="sage"
                size="sm"
                className="bg-[#7A8F81] hover:bg-[#627668] transition-colors mt-6 text-white font-semibold"
                styles={{
                  root: {
                    borderRadius: "12px",
                    height: "42px",
                  },
                }}
              >
                Masuk ke Portal
              </Button>
            </form>

            {/* OAuth Separator */}
            <div className="my-6">
              <Divider label="Or" labelPosition="center" className="text-secondary" />
            </div>

            {/* OAuth Integration Placeholders */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="default"
                size="sm"
                leftSection={
                  <span className="text-base font-bold text-red-500">G</span>
                }
                className="border-border text-primary hover:bg-app font-semibold"
                styles={{
                  root: { borderRadius: "12px", height: "40px" },
                }}
              >
                Google
              </Button>
              <Button
                variant="default"
                size="sm"
                leftSection={
                  <span className="text-base font-bold text-primary"></span>
                }
                className="border-border text-primary hover:bg-app font-semibold"
                styles={{
                  root: { borderRadius: "12px", height: "40px" },
                }}
              >
                Apple
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-app p-4 md:p-8">
          <Text className="text-secondary animate-pulse font-semibold">Memuat portal...</Text>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
