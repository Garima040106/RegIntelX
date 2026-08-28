export function badgeClass(value: string) {
  const normalized = value?.toLowerCase();

  if (normalized === "high" || normalized === "critical") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (normalized === "completed" || normalized === "low") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (normalized === "in_progress" || normalized === "medium") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

export function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
