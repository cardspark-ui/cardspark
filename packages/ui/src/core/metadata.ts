export function getSetShortText(set: string, setCode?: string) {
  const normalizedSetCode = setCode?.trim();

  if (normalizedSetCode) {
    return normalizedSetCode;
  }

  return getSetAcronym(set);
}

function getSetAcronym(set: string) {
  const normalized = set.trim();

  if (/^\d+$/.test(normalized)) {
    return normalized;
  }

  return (
    normalized
      .match(/[\p{L}\p{N}]+/gu)
      ?.map((part) => (/^\d+$/.test(part) ? part : part[0].toUpperCase()))
      .join("") ?? normalized
  );
}
