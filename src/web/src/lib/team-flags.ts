const TEAM_TO_COUNTRY: Record<string, string> = {
  // Full names
  india: "in",
  australia: "au",
  england: "gb",
  "south africa": "za",
  "new zealand": "nz",
  pakistan: "pk",
  "sri lanka": "lk",
  bangladesh: "bd",
  "west indies": "jm",
  afghanistan: "af",
  ireland: "ie",
  zimbabwe: "zw",
  netherlands: "nl",
  scotland: "gb",
  nepal: "np",
  oman: "om",
  namibia: "na",
  "united arab emirates": "ae",
  uae: "ae",
  italy: "it",
  qatar: "qa",
  bahrain: "bh",
  usa: "us",
  "united states": "us",
  canada: "ca",

  // Short codes
  ind: "in",
  aus: "au",
  eng: "gb",
  rsa: "za",
  sa: "za",
  nz: "nz",
  pak: "pk",
  sl: "lk",
  ban: "bd",
  wi: "jm",
  afg: "af",
  ire: "ie",
  zim: "zw",
  ned: "nl",
  sco: "gb",
  nep: "np",
  nam: "na",
  oma: "om",
  ita: "it",
  qat: "qa",
  bhr: "bh",
  can: "ca",
  us: "us",
};

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*women\s*/g, " ")
    .replace(/\s*u-?19\s*/g, " ")
    .replace(/\s*a$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCountryCode(teamName?: string, shortName?: string): string | null {
  const normalizedName = normalizeTeamName(teamName ?? "");
  const normalizedShort = normalizeTeamName(shortName ?? "");

  if (normalizedShort && TEAM_TO_COUNTRY[normalizedShort]) {
    return TEAM_TO_COUNTRY[normalizedShort];
  }

  if (normalizedName && TEAM_TO_COUNTRY[normalizedName]) {
    return TEAM_TO_COUNTRY[normalizedName];
  }

  for (const [key, countryCode] of Object.entries(TEAM_TO_COUNTRY)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return countryCode;
    }
  }

  return null;
}

function countryCodeToEmoji(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export function getTeamFlagUrl(
  teamName: string,
  shortName?: string,
  size: number = 40,
): string | null {
  const code = getCountryCode(teamName, shortName);
  return code ? `https://flagcdn.com/w${size}/${code}.png` : null;
}

export function getTeamFlagEmoji(
  teamName: string,
  shortName?: string,
): string | null {
  const code = getCountryCode(teamName, shortName);
  return code ? countryCodeToEmoji(code) : null;
}

export function getTeamInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";

  const words = cleaned.split(/\s+/);
  if (words.length === 1) {
    return cleaned.slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function getInitialColor(name: string): string {
  const colors = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#ea580c",
    "#7c3aed",
    "#0891b2",
    "#4f46e5",
    "#be123c",
  ];

  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
