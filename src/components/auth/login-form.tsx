"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().min(1, "Ingresá tu correo").email("Formato de correo no válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const emailVal = watch("email");
  const passwordVal = watch("password");

  useEffect(() => {
    setAuthError(null);
  }, [emailVal, passwordVal]);

  async function onSubmit(values: LoginValues) {
    setIsPending(true);
    setAuthError(null);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setAuthError("Correo o contraseña incorrectos, o la cuenta está desactivada.");
        return;
      }
      window.location.assign(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
    } catch {
      setAuthError("No pudimos completar el ingreso. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setIsPending(false);
    }
  }

  const { onBlur: emailOnBlur, ref: emailRef, ...emailReg } = register("email");
  const { onBlur: passwordOnBlur, ref: passwordRef, ...passwordReg } = register("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {authError ? (
        <div
          role="alert"
          className="flex gap-3.5 rounded-2xl border border-destructive/35 bg-destructive/10 px-4 py-3.5 text-sm text-destructive shadow-sm ring-1 ring-destructive/15 dark:border-destructive/40 dark:bg-destructive/15 dark:ring-destructive/20"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <AlertCircle className="size-[1.125rem]" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 pt-1 leading-snug font-medium">{authError}</p>
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-[0.8125rem] font-semibold tracking-wide text-foreground">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 size-[1.0625rem] -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
              aria-hidden
            />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="nombre@empresa.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className="h-12 rounded-xl pl-11 text-[0.9375rem]"
              {...emailReg}
              ref={emailRef}
              onBlur={emailOnBlur}
            />
          </div>
          {errors.email ? (
            <p
              id="login-email-error"
              className="flex items-start gap-2 pl-0.5 text-xs font-medium text-destructive"
            >
              <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-destructive" aria-hidden />
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-[0.8125rem] font-semibold tracking-wide text-foreground">
            Contraseña
          </Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 size-[1.0625rem] -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
              aria-hidden
            />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className="h-12 rounded-xl pr-12 pl-11 text-[0.9375rem]"
              {...passwordReg}
              ref={passwordRef}
              onBlur={passwordOnBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-[1.125rem]" /> : <Eye className="size-[1.125rem]" />}
            </button>
          </div>
          {errors.password ? (
            <p
              id="login-password-error"
              className="flex items-start gap-2 pl-0.5 text-xs font-medium text-destructive"
            >
              <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-destructive" aria-hidden />
              {errors.password.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className={cn(
          "group h-12 w-full rounded-xl text-[0.9375rem] font-semibold tracking-wide shadow-md shadow-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className="relative z-10 flex w-full items-center justify-center gap-2">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Ingresando…
            </>
          ) : (
            <>
              Iniciar sesión
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.25}
                aria-hidden
              />
            </>
          )}
        </span>
      </Button>
    </form>
  );
}
