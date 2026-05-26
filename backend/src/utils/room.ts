export function roomKeyFromLocation(location: string) {
  return String(location)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
