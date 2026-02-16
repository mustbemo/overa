type BalancedChunk = {
  objectText: string;
  endIndex: number;
};

export function extractBalancedObject(
  source: string,
  startIndex: number,
): BalancedChunk | null {
  const openToken = source[startIndex];
  const closeToken = openToken === "{" ? "}" : openToken === "[" ? "]" : null;

  if (!closeToken) {
    return null;
  }

  let depth = 0;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === openToken) {
      depth += 1;
    } else if (char === closeToken) {
      depth -= 1;
      if (depth === 0) {
        return {
          objectText: source.slice(startIndex, index + 1),
          endIndex: index + 1,
        };
      }
    }
  }

  return null;
}

export function parseEscapedJsonObject<T>(rawObjectText: string): T | null {
  const normalized = rawObjectText.replace(/\\"/g, '"');

  try {
    return JSON.parse(normalized) as T;
  } catch {
    return null;
  }
}

function collectEscapedByKey<T>(
  html: string,
  key: string,
  openToken: "{" | "[",
): T[] {
  const tokens =
    openToken === "{"
      ? [`\\"${key}\\":{`, `"${key}":{`]
      : [`\\"${key}\\":[`, `"${key}":[`];
  const results: T[] = [];

  for (const token of tokens) {
    let searchFrom = 0;

    while (searchFrom < html.length) {
      const tokenIndex = html.indexOf(token, searchFrom);

      if (tokenIndex < 0) {
        break;
      }

      const objectStart = html.indexOf(openToken, tokenIndex + token.length - 1);

      if (objectStart < 0) {
        break;
      }

      const balanced = extractBalancedObject(html, objectStart);

      if (!balanced) {
        searchFrom = tokenIndex + token.length;
        continue;
      }

      const parsed = parseEscapedJsonObject<T>(balanced.objectText);
      if (parsed) {
        results.push(parsed);
      }

      searchFrom = balanced.endIndex;
    }
  }

  return results;
}

export function pickAllEscapedObjectsByKey<T>(html: string, key: string): T[] {
  return collectEscapedByKey<T>(html, key, "{");
}

export function pickEscapedObjectByKey<T>(html: string, key: string): T | null {
  return pickAllEscapedObjectsByKey<T>(html, key).at(0) ?? null;
}

export function pickAllEscapedArraysByKey<T>(html: string, key: string): T[][] {
  return collectEscapedByKey<T[]>(html, key, "[");
}

export function pickEscapedArrayByKey<T>(
  html: string,
  key: string,
): T[] | null {
  return pickAllEscapedArraysByKey<T>(html, key).at(0) ?? null;
}
