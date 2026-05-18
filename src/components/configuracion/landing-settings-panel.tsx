"use client";

import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LANDING_ICON_OPTIONS } from "@/lib/landing-config/icons";
import {
  saveLandingBenefitsSection,
  saveLandingCtaFooter,
  saveLandingDifferentiatorPoints,
  saveLandingFeaturesSection,
  saveLandingHero,
  saveLandingNav,
  saveLandingPlansSection,
  saveLandingPreviewSection,
  saveLandingTestimonialsSection,
} from "@/lib/landing-config/actions";
import type {
  LandingPageConfig,
  LandingPreviewActivity,
  LandingPreviewArea,
  LandingPreviewBar,
  LandingPreviewKr,
} from "@/lib/landing-config/types";

const TABS = [
  { id: "hero", label: "General / Hero" },
  { id: "nav", label: "Navegación" },
  { id: "benefits", label: "Beneficios" },
  { id: "features", label: "Funcionalidades" },
  { id: "plans", label: "Planes" },
  { id: "testimonials", label: "Testimonios" },
  { id: "cta", label: "CTA / Footer" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  hasPersistedRow: boolean;
  initialConfig: LandingPageConfig;
};

export function LandingSettingsPanel({ hasPersistedRow, initialConfig }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("hero");
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);

  async function runSave(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setSaving(true);
    const r = await fn();
    setSaving(false);
    if (!r.ok) {
      toast.error(r.message ?? "No se pudo guardar");
      return;
    }
    toast.success("Cambios guardados");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">Landing Page</h2>
          <p className="text-sm text-muted-foreground">Editá el contenido público de la página de inicio.</p>
        </div>
        <Button type="button" variant="outline" size="sm" nativeButton={false} render={<a href="/" target="_blank" rel="noreferrer" />}>
          <ExternalLink className="size-4" />
          Vista previa
        </Button>
      </div>

      {!hasPersistedRow ? (
        <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-950 dark:text-amber-100">Sin configuración guardada</CardTitle>
            <CardDescription className="text-amber-900/85 dark:text-amber-100/85">
              La landing usa textos por defecto. Al guardar cualquier pestaña se creará la configuración en base de datos.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hero" ? (
        <HeroTab
          config={config}
          setConfig={setConfig}
          saving={saving}
          onSave={() =>
            runSave(() =>
              saveLandingHero({
                productName: config.productName,
                heroTitle: config.hero.title,
                heroSubtitle: config.hero.subtitle,
                heroPrimaryButtonText: config.hero.primaryButtonText,
                heroPrimaryButtonUrl: config.hero.primaryButtonUrl,
                heroSecondaryButtonText: config.hero.secondaryButtonText,
                heroSecondaryButtonUrl: config.hero.secondaryButtonUrl,
                showSecondaryButton: config.hero.showSecondaryButton,
                heroFootnote: config.hero.footnote ?? "",
                heroBadge1: config.hero.badge1 ?? "",
                heroBadge2: config.hero.badge2 ?? "",
              })
            )
          }
        />
      ) : null}

      {tab === "nav" ? (
        <NavTab
          config={config}
          setConfig={setConfig}
          saving={saving}
          onSave={() =>
            runSave(() =>
              saveLandingNav({
                logoUrl: config.nav.logoUrl ?? "",
                brandName: config.nav.brandName,
                loginButtonText: config.nav.loginButtonText,
                showDemoButton: config.nav.showDemoButton,
                demoButtonText: config.nav.demoButtonText,
                demoButtonUrl: config.nav.demoButtonUrl,
                navLinks: config.nav.links,
              })
            )
          }
        />
      ) : null}

      {tab === "benefits" ? (
        <ListSectionTab
          title="Beneficios"
          section={config.benefits}
          items={config.benefits.items}
          onSectionChange={(s) => setConfig((c) => ({ ...c, benefits: { ...c.benefits, ...s } }))}
          onItemsChange={(items) => setConfig((c) => ({ ...c, benefits: { ...c.benefits, items } }))}
          saving={saving}
          onSave={() =>
            runSave(() =>
              saveLandingBenefitsSection({
                section: { eyebrow: config.benefits.eyebrow, title: config.benefits.title, subtitle: config.benefits.subtitle },
                items: config.benefits.items,
              })
            )
          }
        />
      ) : null}

      {tab === "features" ? (
        <FeaturesTab config={config} setConfig={setConfig} saving={saving} runSave={runSave} />
      ) : null}

      {tab === "plans" ? (
        <PlansTab config={config} setConfig={setConfig} saving={saving} onSave={() => runSave(() => saveLandingPlansSection({ section: { eyebrow: config.pricing.eyebrow, title: config.pricing.title, subtitle: config.pricing.subtitle }, plans: config.pricing.plans }))} />
      ) : null}

      {tab === "testimonials" ? (
        <TestimonialsTab config={config} setConfig={setConfig} saving={saving} onSave={() => runSave(() => saveLandingTestimonialsSection({ section: config.testimonials, items: config.testimonials.items }))} />
      ) : null}

      {tab === "cta" ? (
        <CtaFooterTab
          config={config}
          setConfig={setConfig}
          saving={saving}
          onSave={() =>
            runSave(() =>
              saveLandingCtaFooter({
                ctaTitle: config.cta.title,
                ctaSubtitle: config.cta.subtitle,
                ctaButtonText: config.cta.buttonText,
                ctaButtonUrl: config.cta.buttonUrl,
                ctaSecondaryButtonText: config.cta.secondaryButtonText ?? "",
                ctaSecondaryButtonUrl: config.cta.secondaryButtonUrl ?? "",
                ctaFootnote: config.cta.footnote ?? "",
                footerBrandText: config.footer.brandText,
                footerDescription: config.footer.description,
                contactEmail: config.footer.contactEmail,
                contactWhatsApp: config.footer.contactWhatsApp ?? "",
                copyrightLine: config.footer.copyrightLine ?? "",
                footerTagline: config.footer.tagline ?? "",
                footerLinks: config.footer.links,
              })
            )
          }
        />
      ) : null}
    </div>
  );
}


function SaveBar({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar cambios
      </Button>
    </div>
  );
}

function HeroTab({
  config,
  setConfig,
  saving,
  onSave,
}: {
  config: LandingPageConfig;
  setConfig: Dispatch<SetStateAction<LandingPageConfig>>;
  saving: boolean;
  onSave: () => void;
}) {
  const h = config.hero;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hero principal</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del producto" className="sm:col-span-2" value={config.productName} onChange={(v) => setConfig((c) => ({ ...c, productName: v }))} />
        <Field label="Título principal" className="sm:col-span-2" value={h.title} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, title: v } }))} />
        <TextArea label="Subtítulo" value={h.subtitle} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, subtitle: v } }))} />
        <Field label="Texto botón principal" value={h.primaryButtonText} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, primaryButtonText: v } }))} />
        <Field label="URL botón principal" value={h.primaryButtonUrl} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, primaryButtonUrl: v } }))} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={h.showSecondaryButton} onChange={(e) => setConfig((c) => ({ ...c, hero: { ...c.hero, showSecondaryButton: e.target.checked } }))} />
          Mostrar botón secundario
        </label>
        <Field label="Texto botón secundario" value={h.secondaryButtonText} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, secondaryButtonText: v } }))} />
        <Field label="URL botón secundario" value={h.secondaryButtonUrl} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, secondaryButtonUrl: v } }))} />
        <Field label="Etiqueta destacada 1" value={h.badge1 ?? ""} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, badge1: v || null } }))} />
        <Field label="Etiqueta destacada 2" value={h.badge2 ?? ""} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, badge2: v || null } }))} />
        <TextArea label="Nota al pie" value={h.footnote ?? ""} onChange={(v) => setConfig((c) => ({ ...c, hero: { ...c.hero, footnote: v || null } }))} />
        <SaveBar saving={saving} onSave={onSave} />
      </CardContent>
    </Card>
  );
}

function NavTab({
  config,
  setConfig,
  saving,
  onSave,
}: {
  config: LandingPageConfig;
  setConfig: Dispatch<SetStateAction<LandingPageConfig>>;
  saving: boolean;
  onSave: () => void;
}) {
  const n = config.nav;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Navegación</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="URL del logo (opcional)" className="sm:col-span-2" value={n.logoUrl ?? ""} onChange={(v) => setConfig((c) => ({ ...c, nav: { ...c.nav, logoUrl: v || null } }))} />
        <Field label="Nombre de marca" value={n.brandName} onChange={(v) => setConfig((c) => ({ ...c, nav: { ...c.nav, brandName: v } }))} />
        <Field label="Texto botón de acceso" value={n.loginButtonText} onChange={(v) => setConfig((c) => ({ ...c, nav: { ...c.nav, loginButtonText: v } }))} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={n.showDemoButton} onChange={(e) => setConfig((c) => ({ ...c, nav: { ...c.nav, showDemoButton: e.target.checked } }))} />
          Mostrar botón de demo
        </label>
        <Field label="Texto botón demo" value={n.demoButtonText} onChange={(v) => setConfig((c) => ({ ...c, nav: { ...c.nav, demoButtonText: v } }))} />
        <Field label="URL botón demo" value={n.demoButtonUrl} onChange={(v) => setConfig((c) => ({ ...c, nav: { ...c.nav, demoButtonUrl: v } }))} />
        <div className="sm:col-span-2 space-y-3">
          <Label>Enlaces del menú</Label>
          {n.links.map((link, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <Input value={link.label} placeholder="Etiqueta" onChange={(e) => updateNavLink(setConfig, i, { label: e.target.value })} className="flex-1 min-w-[120px]" />
              <Input value={link.href} placeholder="#sección" onChange={(e) => updateNavLink(setConfig, i, { href: e.target.value })} className="flex-1 min-w-[120px]" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeNavLink(setConfig, i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => addNavLink(setConfig)}>
            <Plus className="size-4" /> Agregar enlace
          </Button>
        </div>
        <SaveBar saving={saving} onSave={onSave} />
      </CardContent>
    </Card>
  );
}

function updateNavLink(setConfig: Dispatch<SetStateAction<LandingPageConfig>>, i: number, patch: Partial<{ href: string; label: string }>) {
  setConfig((c) => {
    const links = [...c.nav.links];
    links[i] = { ...links[i], ...patch };
    return { ...c, nav: { ...c.nav, links } };
  });
}

function addNavLink(setConfig: Dispatch<SetStateAction<LandingPageConfig>>) {
  setConfig((c) => ({ ...c, nav: { ...c.nav, links: [...c.nav.links, { label: "Nuevo", href: "#" }] } }));
}

function removeNavLink(setConfig: Dispatch<SetStateAction<LandingPageConfig>>, i: number) {
  setConfig((c) => ({ ...c, nav: { ...c.nav, links: c.nav.links.filter((_, idx) => idx !== i) } }));
}

function ListSectionTab({
  title,
  section,
  items,
  onSectionChange,
  onItemsChange,
  saving,
  onSave,
}: {
  title: string;
  section: { eyebrow: string; title: string; subtitle: string };
  items: LandingPageConfig["benefits"]["items"];
  onSectionChange: (s: Partial<{ eyebrow: string; title: string; subtitle: string }>) => void;
  onItemsChange: (items: LandingPageConfig["benefits"]["items"]) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SectionHeadFields section={section} onChange={onSectionChange} />
        <ListItemsEditor items={items} onChange={onItemsChange} />
        <SaveBar saving={saving} onSave={onSave} />
      </CardContent>
    </Card>
  );
}

function FeaturesTab({
  config,
  setConfig,
  saving,
  runSave,
}: {
  config: LandingPageConfig;
  setConfig: Dispatch<SetStateAction<LandingPageConfig>>;
  saving: boolean;
  runSave: (fn: () => Promise<{ ok: boolean; message?: string }>) => Promise<void>;
}) {
  const p = config.preview;
  return (
    <div className="space-y-6">
      <ListSectionTab
        title="Funcionalidades"
        section={config.features}
        items={config.features.items}
        onSectionChange={(s) => setConfig((c) => ({ ...c, features: { ...c.features, ...s } }))}
        onItemsChange={(items) => setConfig((c) => ({ ...c, features: { ...c.features, items } }))}
        saving={saving}
        onSave={() =>
          runSave(() =>
            saveLandingFeaturesSection({
              section: { eyebrow: config.features.eyebrow, title: config.features.title, subtitle: config.features.subtitle },
              items: config.features.items,
            })
          )
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vista previa del tablero</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Etiqueta superior" value={p.eyebrow} onChange={(v) => setConfig((c) => ({ ...c, preview: { ...c.preview, eyebrow: v } }))} />
          <Field label="Porcentaje de progreso" value={p.progressPercent} onChange={(v) => setConfig((c) => ({ ...c, preview: { ...c.preview, progressPercent: v } }))} />
          <Field label="Título" className="sm:col-span-2" value={p.title} onChange={(v) => setConfig((c) => ({ ...c, preview: { ...c.preview, title: v } }))} />
          <TextArea label="Subtítulo" value={p.subtitle} onChange={(v) => setConfig((c) => ({ ...c, preview: { ...c.preview, subtitle: v } }))} />
          <Field label="Texto de insignia" className="sm:col-span-2" value={p.badgeText ?? ""} onChange={(v) => setConfig((c) => ({ ...c, preview: { ...c.preview, badgeText: v || null } }))} />
          <JsonListEditor label="Barras de progreso (JSON)" value={JSON.stringify(p.bars, null, 2)} onApply={(parsed) => setConfig((c) => ({ ...c, preview: { ...c.preview, bars: parsed as LandingPreviewBar[] } }))} />
          <JsonListEditor label="Áreas (JSON)" value={JSON.stringify(p.areas, null, 2)} onApply={(parsed) => setConfig((c) => ({ ...c, preview: { ...c.preview, areas: parsed as LandingPreviewArea[] } }))} />
          <JsonListEditor label="KR destacados (JSON)" value={JSON.stringify(p.krs, null, 2)} onApply={(parsed) => setConfig((c) => ({ ...c, preview: { ...c.preview, krs: parsed as LandingPreviewKr[] } }))} />
          <JsonListEditor label="Actividades (JSON)" value={JSON.stringify(p.activities, null, 2)} onApply={(parsed) => setConfig((c) => ({ ...c, preview: { ...c.preview, activities: parsed as LandingPreviewActivity[] } }))} />
          <Field label="Diferencial · etiqueta" value={config.differentiator.eyebrow} onChange={(v) => setConfig((c) => ({ ...c, differentiator: { ...c.differentiator, eyebrow: v } }))} />
          <Field label="Diferencial · título" className="sm:col-span-2" value={config.differentiator.title} onChange={(v) => setConfig((c) => ({ ...c, differentiator: { ...c.differentiator, title: v } }))} />
          <TextArea label="Diferencial · descripción" value={config.differentiator.subtitle} onChange={(v) => setConfig((c) => ({ ...c, differentiator: { ...c.differentiator, subtitle: v } }))} />
          <div className="sm:col-span-2">
            <SaveBar
              saving={saving}
              onSave={() =>
                runSave(() =>
                  saveLandingPreviewSection({
                    previewEyebrow: config.preview.eyebrow,
                    previewTitle: config.preview.title,
                    previewSubtitle: config.preview.subtitle,
                    previewBadgeText: config.preview.badgeText ?? "",
                    previewProgressPercent: config.preview.progressPercent,
                    previewBars: config.preview.bars,
                    previewAreas: config.preview.areas,
                    previewKrs: config.preview.krs,
                    previewActivities: config.preview.activities,
                    differentiatorEyebrow: config.differentiator.eyebrow,
                    differentiatorTitle: config.differentiator.title,
                    differentiatorSubtitle: config.differentiator.subtitle,
                  })
                )
              }
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Puntos del diferencial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListItemsEditor items={config.differentiator.points} onChange={(points) => setConfig((c) => ({ ...c, differentiator: { ...c.differentiator, points } }))} />
          <SaveBar saving={saving} onSave={() => runSave(() => saveLandingDifferentiatorPoints(config.differentiator.points))} />
        </CardContent>
      </Card>
    </div>
  );
}

function PlansTab({
  config,
  setConfig,
  saving,
  onSave,
}: {
  config: LandingPageConfig;
  setConfig: Dispatch<SetStateAction<LandingPageConfig>>;
  saving: boolean;
  onSave: () => void;
}) {
  const plans = config.pricing.plans;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Planes y precios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SectionHeadFields
          section={{ eyebrow: config.pricing.eyebrow, title: config.pricing.title, subtitle: config.pricing.subtitle }}
          onChange={(s) => setConfig((c) => ({ ...c, pricing: { ...c.pricing, ...s } }))}
        />
        {plans.map((plan, i) => (
          <div key={plan.id} className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-semibold">Plan {i + 1}</p>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={plan.status === "ACTIVE"} onChange={(e) => updatePlan(setConfig, i, { status: e.target.checked ? "ACTIVE" : "INACTIVE" })} />
                Visible
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre" value={plan.name} onChange={(v) => updatePlan(setConfig, i, { name: v })} />
              <Field label="Orden" value={String(plan.sortOrder)} onChange={(v) => updatePlan(setConfig, i, { sortOrder: Number(v) || 0 })} />
              <TextArea label="Descripción" value={plan.description} onChange={(v) => updatePlan(setConfig, i, { description: v })} />
              <Field label="Precio" value={plan.priceLabel} onChange={(v) => updatePlan(setConfig, i, { priceLabel: v })} />
              <Field label="Periodo" value={plan.periodLabel ?? ""} onChange={(v) => updatePlan(setConfig, i, { periodLabel: v || null })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={plan.showPrice} onChange={(e) => updatePlan(setConfig, i, { showPrice: e.target.checked })} />
                Mostrar precio
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={plan.isHighlighted} onChange={(e) => updatePlan(setConfig, i, { isHighlighted: e.target.checked })} />
                Destacado
              </label>
              <Field label="Etiqueta destacado" value={plan.highlightLabel ?? ""} onChange={(v) => updatePlan(setConfig, i, { highlightLabel: v || null })} />
              <Field label="Texto botón" value={plan.buttonText} onChange={(v) => updatePlan(setConfig, i, { buttonText: v })} />
              <Field label="URL botón" value={plan.buttonUrl} onChange={(v) => updatePlan(setConfig, i, { buttonUrl: v })} />
              <TextArea
                label="Características (una por línea)"
                value={plan.features.join("\n")}
                onChange={(v) => updatePlan(setConfig, i, { features: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setConfig((c) => ({
              ...c,
              pricing: {
                ...c.pricing,
                plans: [
                  ...c.pricing.plans,
                  {
                    id: `new-${Date.now()}`,
                    name: "Nuevo plan",
                    description: "",
                    priceLabel: "",
                    periodLabel: "/mes",
                    features: ["Característica"],
                    isHighlighted: false,
                    highlightLabel: null,
                    buttonText: "Contactar",
                    buttonUrl: "#contacto",
                    showPrice: true,
                    sortOrder: c.pricing.plans.length,
                    status: "ACTIVE",
                  },
                ],
              },
            }))
          }
        >
          <Plus className="size-4" /> Agregar plan
        </Button>
        <SaveBar saving={saving} onSave={onSave} />
      </CardContent>
    </Card>
  );
}

function updatePlan(setConfig: Dispatch<SetStateAction<LandingPageConfig>>, i: number, patch: Partial<LandingPageConfig["pricing"]["plans"][0]>) {
  setConfig((c) => {
    const plans = [...c.pricing.plans];
    plans[i] = { ...plans[i], ...patch };
    return { ...c, pricing: { ...c.pricing, plans } };
  });
}

function TestimonialsTab({
  config,
  setConfig,
  saving,
  onSave,
}: {
  config: LandingPageConfig;
  setConfig: Dispatch<SetStateAction<LandingPageConfig>>;
  saving: boolean;
  onSave: () => void;
}) {
  const t = config.testimonials;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Testimonios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field label="Etiqueta superior" value={t.eyebrow} onChange={(v) => setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, eyebrow: v } }))} />
        <Field label="Título" value={t.title} onChange={(v) => setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, title: v } }))} />
        <Field label="Subtítulo" value={t.subtitle ?? ""} onChange={(v) => setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, subtitle: v || null } }))} />
        {t.items.map((item, i) => (
          <div key={item.id} className="rounded-xl border border-border/60 p-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" value={item.name} onChange={(v) => updateTestimonial(setConfig, i, { name: v })} />
            <Field label="Cargo y empresa" value={item.roleCompany} onChange={(v) => updateTestimonial(setConfig, i, { roleCompany: v })} />
            <TextArea label="Comentario" value={item.comment} onChange={(v) => updateTestimonial(setConfig, i, { comment: v })} />
            <Field label="Avatar URL" value={item.avatarUrl ?? ""} onChange={(v) => updateTestimonial(setConfig, i, { avatarUrl: v || null })} />
            <Field label="Orden" value={String(item.sortOrder)} onChange={(v) => updateTestimonial(setConfig, i, { sortOrder: Number(v) || 0 })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.status === "ACTIVE"} onChange={(e) => updateTestimonial(setConfig, i, { status: e.target.checked ? "ACTIVE" : "INACTIVE" })} />
              Visible
            </label>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setConfig((c) => ({
              ...c,
              testimonials: {
                ...c.testimonials,
                items: [
                  ...c.testimonials.items,
                  {
                    id: `new-${Date.now()}`,
                    name: "",
                    roleCompany: "",
                    comment: "",
                    avatarUrl: null,
                    sortOrder: c.testimonials.items.length,
                    status: "ACTIVE",
                  },
                ],
              },
            }))
          }
        >
          <Plus className="size-4" /> Agregar testimonio
        </Button>
        <SaveBar saving={saving} onSave={onSave} />
      </CardContent>
    </Card>
  );
}

function updateTestimonial(setConfig: Dispatch<SetStateAction<LandingPageConfig>>, i: number, patch: Partial<LandingPageConfig["testimonials"]["items"][0]>) {
  setConfig((c) => {
    const items = [...c.testimonials.items];
    items[i] = { ...items[i], ...patch };
    return { ...c, testimonials: { ...c.testimonials, items } };
  });
}

function CtaFooterTab({
  config,
  setConfig,
  saving,
  onSave,
}: {
  config: LandingPageConfig;
  setConfig: Dispatch<SetStateAction<LandingPageConfig>>;
  saving: boolean;
  onSave: () => void;
}) {
  const cta = config.cta;
  const foot = config.footer;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CTA final</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" className="sm:col-span-2" value={cta.title} onChange={(v) => setConfig((c) => ({ ...c, cta: { ...c.cta, title: v } }))} />
          <TextArea label="Subtítulo" value={cta.subtitle} onChange={(v) => setConfig((c) => ({ ...c, cta: { ...c.cta, subtitle: v } }))} />
          <Field label="Texto botón" value={cta.buttonText} onChange={(v) => setConfig((c) => ({ ...c, cta: { ...c.cta, buttonText: v } }))} />
          <Field label="URL botón" value={cta.buttonUrl} onChange={(v) => setConfig((c) => ({ ...c, cta: { ...c.cta, buttonUrl: v } }))} />
          <Field label="Texto botón secundario" value={cta.secondaryButtonText ?? ""} onChange={(v) => setConfig((c) => ({ ...c, cta: { ...c.cta, secondaryButtonText: v || null } }))} />
          <Field label="URL botón secundario" value={cta.secondaryButtonUrl ?? ""} onChange={(v) => setConfig((c) => ({ ...c, cta: { ...c.cta, secondaryButtonUrl: v || null } }))} />
          <TextArea label="Nota al pie" value={cta.footnote ?? ""} onChange={(v) => setConfig((c) => ({ ...c, cta: { ...c.cta, footnote: v || null } }))} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pie de página</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Texto de marca" value={foot.brandText} onChange={(v) => setConfig((c) => ({ ...c, footer: { ...c.footer, brandText: v } }))} />
          <Field label="Correo de contacto" value={foot.contactEmail} onChange={(v) => setConfig((c) => ({ ...c, footer: { ...c.footer, contactEmail: v } }))} />
          <Field label="WhatsApp (número o enlace)" value={foot.contactWhatsApp ?? ""} onChange={(v) => setConfig((c) => ({ ...c, footer: { ...c.footer, contactWhatsApp: v || null } }))} />
          <TextArea label="Descripción corta" value={foot.description} onChange={(v) => setConfig((c) => ({ ...c, footer: { ...c.footer, description: v } }))} />
          <Field label="Copyright (usá {year})" value={foot.copyrightLine ?? ""} onChange={(v) => setConfig((c) => ({ ...c, footer: { ...c.footer, copyrightLine: v || null } }))} />
          <Field label="Frase final" value={foot.tagline ?? ""} onChange={(v) => setConfig((c) => ({ ...c, footer: { ...c.footer, tagline: v || null } }))} />
          <div className="sm:col-span-2 space-y-2">
            <Label>Enlaces del pie</Label>
            {foot.links.map((link, i) => (
              <div key={link.id} className="flex flex-wrap gap-2">
                <Input value={link.label} onChange={(e) => updateFooterLink(setConfig, i, { label: e.target.value })} className="flex-1" />
                <Input value={link.href} onChange={(e) => updateFooterLink(setConfig, i, { href: e.target.value })} className="flex-1" />
                <Input value={String(link.sortOrder)} onChange={(e) => updateFooterLink(setConfig, i, { sortOrder: Number(e.target.value) || 0 })} className="w-20" placeholder="Orden" />
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={link.status === "ACTIVE"} onChange={(e) => updateFooterLink(setConfig, i, { status: e.target.checked ? "ACTIVE" : "INACTIVE" })} />
                  Activo
                </label>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setConfig((c) => ({
                  ...c,
                  footer: {
                    ...c.footer,
                    links: [
                      ...c.footer.links,
                      { id: `new-${Date.now()}`, label: "Nuevo", href: "#", sortOrder: c.footer.links.length, status: "ACTIVE" },
                    ],
                  },
                }))
              }
            >
              <Plus className="size-4" /> Agregar enlace
            </Button>
          </div>
          <SaveBar saving={saving} onSave={onSave} />
        </CardContent>
      </Card>
    </div>
  );
}

function updateFooterLink(setConfig: Dispatch<SetStateAction<LandingPageConfig>>, i: number, patch: Partial<LandingPageConfig["footer"]["links"][0]>) {
  setConfig((c) => {
    const links = [...c.footer.links];
    links[i] = { ...links[i], ...patch };
    return { ...c, footer: { ...c.footer, links } };
  });
}

function SectionHeadFields({
  section,
  onChange,
}: {
  section: { eyebrow: string; title: string; subtitle: string };
  onChange: (s: Partial<{ eyebrow: string; title: string; subtitle: string }>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Etiqueta superior" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field label="Título" className="sm:col-span-2" value={section.title} onChange={(v) => onChange({ title: v })} />
      <TextArea label="Subtítulo" value={section.subtitle} onChange={(v) => onChange({ subtitle: v })} />
    </div>
  );
}

function ListItemsEditor({
  items,
  onChange,
}: {
  items: LandingPageConfig["benefits"]["items"];
  onChange: (items: LandingPageConfig["benefits"]["items"]) => void;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id} className="rounded-xl border border-border/60 p-4 grid gap-3 sm:grid-cols-2">
          <Field label="Título" value={item.title} onChange={(v) => patchItem(onChange, items, i, { title: v })} />
          <Field label="Orden" value={String(item.sortOrder)} onChange={(v) => patchItem(onChange, items, i, { sortOrder: Number(v) || 0 })} />
          <div className="space-y-1">
            <Label>Ícono</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={item.iconKey}
              onChange={(e) => patchItem(onChange, items, i, { iconKey: e.target.value })}
            >
              {LANDING_ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={item.status === "ACTIVE"} onChange={(e) => patchItem(onChange, items, i, { status: e.target.checked ? "ACTIVE" : "INACTIVE" })} />
            Visible
          </label>
          <TextArea label="Descripción" value={item.description} onChange={(v) => patchItem(onChange, items, i, { description: v })} />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
              <Trash2 className="size-4" /> Quitar
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...items,
            {
              id: `new-${Date.now()}`,
              title: "",
              description: "",
              iconKey: "layers",
              sortOrder: items.length,
              status: "ACTIVE",
            },
          ])
        }
      >
        <Plus className="size-4" /> Agregar ítem
      </Button>
    </div>
  );
}

function patchItem(
  onChange: (items: LandingPageConfig["benefits"]["items"]) => void,
  items: LandingPageConfig["benefits"]["items"],
  i: number,
  patch: Partial<LandingPageConfig["benefits"]["items"][0]>
) {
  const next = [...items];
  next[i] = { ...next[i], ...patch };
  onChange(next);
}

function JsonListEditor({ label, value, onApply }: { label: string; value: string; onApply: (parsed: unknown) => void }) {
  const [text, setText] = useState(value);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="sm:col-span-2 space-y-1">
      <Label>{label}</Label>
      <textarea
        className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) throw new Error("Debe ser un arreglo");
            onApply(parsed);
            setError(null);
            toast.success("JSON aplicado (guardá la sección para persistir)");
          } catch {
            setError("JSON inválido");
          }
        }}
      >
        Aplicar JSON
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1 sm:col-span-2">
      <Label>{label}</Label>
      <textarea
        className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
