import { Decimal } from '@prisma/client/runtime/library';

export function decimalToNumber(value: Decimal | number | string | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return Number(value.toString());
}

export function serializePlan<T extends { price: unknown }>(plan: T): T & { price: number } {
  return { ...plan, price: Number((plan.price as Decimal)?.toString?.() ?? plan.price) };
}

export function serializePlans<T extends { price: unknown }>(plans: T[]): Array<T & { price: number }> {
  return plans.map(serializePlan);
}
