export function normalizeOversValue(
  value: number | string | undefined,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  if (!raw.includes(".")) {
    return raw;
  }

  const [overPart, ballPart] = raw.split(".", 2);
  const overs = Number.parseInt(overPart, 10);
  const balls = Number.parseInt((ballPart ?? "").replace(/\D.*/, ""), 10);

  if (Number.isNaN(overs) || Number.isNaN(balls)) {
    return raw;
  }

  const carry = Math.floor(balls / 6);
  const remainder = balls % 6;
  const adjustedOvers = overs + carry;

  if (remainder === 0) {
    return String(adjustedOvers);
  }

  return `${adjustedOvers}.${remainder}`;
}

export function formatOversLabel(value: number | string | undefined): string {
  const normalized = normalizeOversValue(value);
  return normalized ? `${normalized} Overs` : "-";
}

export function oversToDecimal(
  value: number | string | undefined,
): number | null {
  const normalized = normalizeOversValue(value);

  if (!normalized) {
    return null;
  }

  const [overPart, ballPart] = normalized.split(".", 2);
  const overs = Number.parseInt(overPart ?? "", 10);
  const balls = Number.parseInt(ballPart ?? "0", 10);

  if (Number.isNaN(overs) || Number.isNaN(balls)) {
    return null;
  }

  return overs + balls / 6;
}

export function formatRunRate(
  runsValue: number | string | undefined,
  oversValue: number | string | undefined,
): string {
  const runs = Number(runsValue ?? "");
  const overs = oversToDecimal(oversValue);

  if (!Number.isFinite(runs) || !overs || overs <= 0) {
    return "-";
  }

  return (runs / overs).toFixed(2);
}

export function formatStartDate(epochMs: number | null): string {
  if (!epochMs || !Number.isFinite(epochMs)) {
    return "-";
  }

  return new Date(epochMs).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
