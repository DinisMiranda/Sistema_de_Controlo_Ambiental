export function toInt(value: string): number | null {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}
