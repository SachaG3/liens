export function relationshipScore(lastInteraction: Date | null, frequencyDays: number) {
  if (!lastInteraction) return 15;
  const days = Math.max(0, (Date.now() - lastInteraction.getTime()) / 86_400_000);
  return Math.max(0, Math.min(100, Math.round(100 - (days / Math.max(1, frequencyDays)) * 70)));
}

export function effectiveFrequency(contactFrequency: number, circleFrequencies: number[]) {
  return Math.min(contactFrequency, ...circleFrequencies);
}

export function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
