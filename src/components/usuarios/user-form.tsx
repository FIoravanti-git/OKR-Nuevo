"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { UserRole } from "@/generated/prisma";
import { createUser, updateUser } from "@/lib/users/actions";
import { userCreateFormSchema, userUpdateFormSchema } from "@/lib/users/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };

export type UserFormFields = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyId: string;
  isActive: boolean;
};

type UserFormProps = {
  mode: "create" | "edit";
  userId?: string;
  sessionUserId: string;
  viewerRole: UserRole;
  viewerCompanyId: string | null;
  companies: CompanyOption[];
  allowedRoles: UserRole[];
  defaultValues: UserFormFields;
  cancelHref: string;
};

export function UserForm({
  mode,
  userId,
  sessionUserId,
  viewerRole,
  viewerCompanyId,
  companies,
  allowedRoles,
  defaultValues,
  cancelHref,
}: UserFormProps) {
  const router = useRouter();
  const schema = mode === "create" ? userCreateFormSchema : userUpdateFormSchema;
  const resolver = useMemo(() => zodResolver(schema) as Resolver<UserFormFields>, [schema]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormFields>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const role = watch("role");
  const lockActiveToggle = mode === "edit" && userId === sessionUserId;

  useEffect(() => {
    if (role === "SUPER_ADMIN") {
      setValue("companyId", "");
    }
  }, [role, setValue]);

  useEffect(() => {
    if (lockActiveToggle) {
      setValue("isActive", true);
    }
  }, [lockActiveToggle, setValue]);

  async function onSubmit(values: UserFormFields) {
    const r =
      mode === "create" ? await createUser(values) : await updateUser(userId!, values);

    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) {
            setError(key as keyof UserFormFields, { message: msg });
          }
        }
      }
      toast.error(r.message);
      return;
    }

    toast.success(mode === "create" ? "Usuario creado" : "Cambios guardados");
    router.push("/usuarios");
    router.refresh();
  }

  const showCompanySelect = viewerRole === "SUPER_ADMIN" && role !== "SUPER_ADMIN";
  const lockCompany = viewerRole === "ADMIN_EMPRESA";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Identidad</CardTitle>
          <CardDescription>Nombre y correo de acceso.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input
              id="user-name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              className={cn(errors.name && "border-destructive")}
              {...register("name")}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="user-email">Correo</Label>
            <Input
              id="user-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={cn(errors.email && "border-destructive")}
              {...register("email")}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="user-password">
              {mode === "create" ? "Contraseña" : "Nueva contraseña (opcional)"}
            </Label>
            <Input
              id="user-password"
              type="password"
              autoComplete={mode === "create" ? "new-password" : "new-password"}
              aria-invalid={!!errors.password}
              className={cn(errors.password && "border-destructive")}
              placeholder={mode === "edit" ? "Dejar en blanco para no cambiar" : undefined}
              {...register("password")}
            />
            {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
            {mode === "create" ? (
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Rol y organización</CardTitle>
          <CardDescription>Permisos y empresa (obligatoria salvo super administrador de plataforma).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="user-role">Rol</Label>
            <select
              id="user-role"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("role")}
            >
              {allowedRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
            {errors.role ? <p className="text-xs text-destructive">{errors.role.message}</p> : null}
          </div>

          {lockCompany ? (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <input type="hidden" {...register("companyId")} />
              <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground">
                {companies.find((c) => c.id === viewerCompanyId)?.name ?? viewerCompanyId}
              </p>
              <p className="text-xs text-muted-foreground">Los usuarios que creás pertenecen siempre a tu organización.</p>
            </div>
          ) : null}

          {showCompanySelect ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="user-company">Empresa</Label>
              <select
                id="user-company"
                className="flex h-8 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("companyId")}
              >
                <option value="">Seleccionar empresa…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.companyId ? <p className="text-xs text-destructive">{errors.companyId.message}</p> : null}
            </div>
          ) : null}

          {viewerRole === "SUPER_ADMIN" && role === "SUPER_ADMIN" ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Los super administradores de plataforma no requieren empresa asignada.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Estado</CardTitle>
          <CardDescription>Los usuarios inactivos no pueden iniciar sesión.</CardDescription>
        </CardHeader>
        <CardContent>
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm",
              lockActiveToggle && "cursor-default opacity-90"
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input"
              disabled={lockActiveToggle}
              {...register("isActive")}
            />
            <span>
              <span className="font-medium text-foreground">Cuenta activa</span>
              <span className="mt-0.5 block text-muted-foreground">
                {lockActiveToggle
                  ? "No podés desactivar tu propia cuenta desde aquí."
                  : "Desactivá cuentas que no deban acceder temporalmente."}
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando…
            </>
          ) : mode === "create" ? (
            "Crear usuario"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
