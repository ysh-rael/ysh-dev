import { z } from "zod";

export const planIdSchema = z.enum(["starter", "team10", "team20", "business100"]);

export const plans = {
  starter: { id: "starter", name: "Inicial", machines: 2, amountCents: 3998, badge: "Mínimo 2 máquinas" },
  team10: { id: "team10", name: "Equipe", machines: 10, amountCents: 17991, badge: "10% de desconto" },
  team20: { id: "team20", name: "Equipe 20", machines: 20, amountCents: 34783, badge: "13% de desconto" },
  business100: { id: "business100", name: "Business", machines: 100, amountCents: 149925, badge: "Plano 100" },
} as const;

export type PlanId = keyof typeof plans;

export function formatBRL(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountCents / 100);
}

export function addLicenseTerm(startDate: Date) {
  const expiresAt = new Date(startDate);
  const startDay = expiresAt.getUTCDate();
  expiresAt.setUTCDate(1);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 3);
  const finalDayOfMonth = new Date(Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth() + 1, 0)).getUTCDate();
  expiresAt.setUTCDate(Math.min(startDay, finalDayOfMonth));
  return expiresAt;
}