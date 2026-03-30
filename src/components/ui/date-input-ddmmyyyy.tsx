"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

function ymdToDmy(value: string): string {
  const t = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function dmyToYmd(value: string): string | null {
  const t = value.trim();
  if (!t) return "";
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const valid =
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d;
  if (!valid) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function toMaskedDmy(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

type DateInputDdMmYyyyProps = {
  id: string;
  valueYmd: string;
  onChangeYmd: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function DateInputDdMmYyyy({
  id,
  valueYmd,
  onChangeYmd,
  placeholder = "dd/mm/yyyy",
  className,
}: DateInputDdMmYyyyProps) {
  const [display, setDisplay] = useState(ymdToDmy(valueYmd));

  useEffect(() => {
    setDisplay(ymdToDmy(valueYmd));
  }, [valueYmd]);

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      className={className}
      onChange={(e) => {
        const masked = toMaskedDmy(e.target.value);
        setDisplay(masked);

        const maybeYmd = dmyToYmd(masked);
        if (maybeYmd !== null) {
          onChangeYmd(maybeYmd);
          return;
        }
        onChangeYmd("");
      }}
      onBlur={() => {
        const ymd = dmyToYmd(display);
        if (ymd === null) {
          onChangeYmd("");
          return;
        }
        onChangeYmd(ymd);
        setDisplay(ymdToDmy(ymd));
      }}
    />
  );
}

