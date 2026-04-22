export const KEY_SIGNATURE_OPTIONS = [
  { value: "", label: "未设置" },
  { value: "C", label: "C调" },
  { value: "D", label: "D调" },
  { value: "E", label: "E调" },
  { value: "F", label: "F调" },
  { value: "G", label: "G调" },
  { value: "A", label: "A调" },
  { value: "B", label: "B调" },
  { value: "Bb", label: "降B调" },
  { value: "Eb", label: "降E调" },
  { value: "Ab", label: "降A调" },
  { value: "Db", label: "降D调" },
  { value: "Gb", label: "降G调" },
] as const;

const LEGACY_MINOR_TO_KEY: Record<string, string> = {
  Am: "A",
  Em: "E",
  Bm: "B",
  Dm: "D",
  Gm: "G",
  Cm: "C",
};

const VALID_KEYS: Set<string> = new Set(
  KEY_SIGNATURE_OPTIONS.map((option) => option.value).filter(Boolean)
);

export function normalizeKeySignature(input?: string | null): string | null {
  if (!input) return null;

  const raw = input.trim();
  if (!raw) return null;

  if (LEGACY_MINOR_TO_KEY[raw]) {
    return LEGACY_MINOR_TO_KEY[raw];
  }

  const canonical = raw
    .replace(/♭/g, "b")
    .replace(/\s+/g, "")
    .replace(/^([a-g])/, (s) => s.toUpperCase());

  if (VALID_KEYS.has(canonical)) {
    return canonical;
  }

  return null;
}

export function getKeySignatureLabel(input?: string | null): string {
  const normalized = normalizeKeySignature(input);
  if (!normalized) return "未设置";
  return (
    KEY_SIGNATURE_OPTIONS.find((option) => option.value === normalized)?.label ||
    `${normalized}调`
  );
}