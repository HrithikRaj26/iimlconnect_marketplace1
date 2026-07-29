export function formatINR(amount: number | string): string {
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(numeric)) return "₹0";
  return `₹${numeric.toLocaleString("en-IN")}`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
