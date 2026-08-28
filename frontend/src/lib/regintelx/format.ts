export function badgeClass(value: string) {
  const normalized = value?.toLowerCase();

  if (
    normalized === "high" ||
    normalized === "critical" ||
    normalized === "overdue" ||
    normalized === "blocked"
  ) {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (
    normalized === "completed" ||
    normalized === "active" ||
    normalized === "published" ||
    normalized === "healthy" ||
    normalized === "low"
  ) {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (
    normalized === "in_progress" ||
    normalized === "medium" ||
    normalized === "semantic" ||
    normalized === "search"
  ) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (
    normalized === "pending" ||
    normalized === "draft" ||
    normalized === "review" ||
    normalized === "urgent"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-100";
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
