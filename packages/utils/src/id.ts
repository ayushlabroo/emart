export function formatOrderId(internalId: string): string {
  if (internalId.length < 6) {
    // Defensive — should never happen with real UUIDs/CUIDs,
    // but we shouldn't crash on garbage input.
    return `EMT-${internalId.toUpperCase()}`;
  }

  const suffix = internalId.slice(-6).toUpperCase();
  return `EMT-${suffix}`;
}
