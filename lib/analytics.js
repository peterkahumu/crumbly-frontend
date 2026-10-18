import { backendFetch } from "@/lib/backend";

export async function getBakerAnalytics(bakeryId, filters = {}) {
  const qs = new URLSearchParams();
  if (filters.range) qs.set("range", filters.range);
  if (filters.from) qs.set("from", typeof filters.from === "string" ? filters.from : filters.from.toISOString?.()?.slice(0, 10));
  if (filters.to) qs.set("to", typeof filters.to === "string" ? filters.to : filters.to.toISOString?.()?.slice(0, 10));
  return backendFetch(`/api/analytics/baker?${qs.toString()}`);
}

export async function getPlatformAnalytics(filters = {}) {
  const qs = new URLSearchParams();
  if (filters.range) qs.set("range", filters.range);
  if (filters.from) qs.set("from", typeof filters.from === "string" ? filters.from : filters.from.toISOString?.()?.slice(0, 10));
  if (filters.to) qs.set("to", typeof filters.to === "string" ? filters.to : filters.to.toISOString?.()?.slice(0, 10));
  return backendFetch(`/api/analytics/platform?${qs.toString()}`);
}
