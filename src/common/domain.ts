export function getRootDomain(url: string): string {
  const { hostname } = new URL(url);
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}
