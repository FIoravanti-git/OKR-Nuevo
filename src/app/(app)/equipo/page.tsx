import { redirect } from "next/navigation";

/** Ruta histórica: el módulo vive ahora en `/usuarios`. */
export default function EquipoRedirectPage() {
  redirect("/usuarios");
}
