"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type TypeaheadOption = {
  value: string;
  label: string;
  keywords?: string;
  disabled?: boolean;
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type TypeaheadSelectProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: TypeaheadOption[];
  placeholder?: string;
  emptyText?: string;
  ariaInvalid?: boolean;
  className?: string;
  disabled?: boolean;
};

export function TypeaheadSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar…",
  emptyText = "Sin coincidencias",
  ariaInvalid,
  className,
  disabled,
}: TypeaheadSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const selected = React.useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.keywords ?? ""}`;
      return normalize(hay).includes(q);
    });
  }, [options, query]);

  const selectByIndex = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= filtered.length) return;
      const option = filtered[index];
      if (option.disabled) return;
      onValueChange(option.value);
      setOpen(false);
    },
    [filtered, onValueChange]
  );

  const handleTypeahead = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!open) return;
      const target = event.target as HTMLElement | null;
      const isTypingField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("contenteditable") === "true");

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.min(prev + 1, filtered.length - 1);
          return next < 0 ? 0 : next;
        });
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const idx = activeIndex >= 0 ? activeIndex : 0;
        selectByIndex(idx);
        return;
      }
      if (event.key === "Escape") {
        if (!isTypingField) setQuery("");
        return;
      }
      if (isTypingField) {
        return;
      }
    },
    [activeIndex, filtered.length, open, selectByIndex]
  );

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(-1);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (!filtered.length) {
      setActiveIndex(-1);
      return;
    }
    const selectedIdx = filtered.findIndex((o) => o.value === value && !o.disabled);
    if (selectedIdx >= 0) {
      setActiveIndex(selectedIdx);
      return;
    }
    const firstEnabled = filtered.findIndex((o) => !o.disabled);
    setActiveIndex(firstEnabled);
  }, [filtered, open, value]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger onKeyDown={handleTypeahead}
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className={cn(
              "h-8 w-full max-w-2xl justify-between gap-2 px-2.5 text-left font-normal",
              "text-foreground data-[placeholder=true]:text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="min-w-0 flex-1 truncate" data-placeholder={!selected}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-(--anchor-width) p-1" onKeyDownCapture={handleTypeahead}>
        <div className="p-1 pb-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => {
                // Prevent DropdownMenu internal typeahead from hijacking text input.
                event.stopPropagation();
                if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
                  handleTypeahead(event);
                }
              }}
              autoFocus
              placeholder="Buscar..."
              className="h-8 rounded-md pl-8 text-sm"
              aria-label="Buscar opción"
            />
          </div>
        </div>
        <div className="pt-1">
          {filtered.length ? (
            filtered.map((o, index) => (
              <DropdownMenuItem
                key={o.value}
                data-disabled={o.disabled ? "" : undefined}
                onClick={() => {
                  if (o.disabled) return;
                  onValueChange(o.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex items-start gap-2 whitespace-normal leading-snug",
                  activeIndex === index && "bg-accent text-accent-foreground"
                )}
              >
                <Check className={cn("mt-0.5 size-4 shrink-0", value === o.value ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0">{o.label}</span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

