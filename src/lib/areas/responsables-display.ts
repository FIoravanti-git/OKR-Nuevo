import { formatResponsablesList } from "@/lib/format";

/** Nombres de personas marcadas como responsables en el área (para listados y fichas). */
export function formatResponsablesFromAreaMemberLinks(
  links: { user: { name: string } }[] | null | undefined
): string {
  if (!links?.length) return "";
  return formatResponsablesList(links.map((m) => m.user.name));
}
