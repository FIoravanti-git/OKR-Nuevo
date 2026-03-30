"use client";

import { useEffect } from "react";

type SelectState = {
  query: string;
  resetTimer: number | null;
};

const stateBySelect = new WeakMap<HTMLSelectElement, SelectState>();

function getState(select: HTMLSelectElement): SelectState {
  const current = stateBySelect.get(select);
  if (current) return current;
  const next: SelectState = { query: "", resetTimer: null };
  stateBySelect.set(select, next);
  return next;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function applyTypeahead(select: HTMLSelectElement, query: string) {
  if (!query) return;
  const q = normalize(query);
  let bestMatch: HTMLOptionElement | null = null;

  for (let i = 0; i < select.options.length; i += 1) {
    const option = select.options[i];
    if (option.disabled || option.value === "") continue;
    const label = normalize(option.textContent ?? "");
    if (label.startsWith(q)) {
      bestMatch = option;
      break;
    }
    if (!bestMatch && label.includes(q)) {
      bestMatch = option;
    }
  }

  if (bestMatch && bestMatch.value !== select.value) {
    select.value = bestMatch.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function clearState(select: HTMLSelectElement) {
  const state = getState(select);
  state.query = "";
  if (state.resetTimer) {
    window.clearTimeout(state.resetTimer);
    state.resetTimer = null;
  }
}

export function SelectTypeaheadProvider() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.dataset.noTypeFilter === "true") return;
      if (target.multiple) return;

      const state = getState(target);
      if (state.resetTimer) {
        window.clearTimeout(state.resetTimer);
        state.resetTimer = null;
      }

      if (event.key === "Escape") {
        clearState(target);
        return;
      }

      if (event.key === "Backspace") {
        state.query = state.query.slice(0, -1);
        applyTypeahead(target, state.query);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        state.query += event.key;
        applyTypeahead(target, state.query);
      } else {
        return;
      }

      state.resetTimer = window.setTimeout(() => {
        clearState(target);
      }, 1200);
    };

    const onBlur = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.dataset.noTypeFilter === "true") return;
      clearState(target);
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("blur", onBlur, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("blur", onBlur, true);
    };
  }, []);

  return null;
}
