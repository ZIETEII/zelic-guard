export class CanonicalizationError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalizationError";
  }
}

export function canonicalize(value: unknown): string {
  return serialize(value, new Set<object>(), "$");
}

function serialize(
  value: unknown,
  ancestors: Set<object>,
  path: string,
): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new CanonicalizationError(`${path} must be a finite number`);
    }

    return JSON.stringify(value);
  }

  if (typeof value !== "object") {
    throw new CanonicalizationError(`${path} is not canonical JSON data`);
  }

  if (ancestors.has(value)) {
    throw new CanonicalizationError(`${path} contains a cycle`);
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return serializeArray(value, ancestors, path);
    }

    return serializeRecord(value, ancestors, path);
  } finally {
    ancestors.delete(value);
  }
}

function serializeArray(
  value: unknown[],
  ancestors: Set<object>,
  path: string,
): string {
  const customKeys = Object.keys(value).filter(
    (key) => !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length,
  );

  if (customKeys.length > 0 || Object.getOwnPropertySymbols(value).length > 0) {
    throw new CanonicalizationError(`${path} contains non-index array keys`);
  }

  const items: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) {
      throw new CanonicalizationError(`${path}[${index}] is an array hole`);
    }

    items.push(serialize(value[index], ancestors, `${path}[${index}]`));
  }

  return `[${items.join(",")}]`;
}

function serializeRecord(
  value: object,
  ancestors: Set<object>,
  path: string,
): string {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new CanonicalizationError(`${path} must be a plain object`);
  }

  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new CanonicalizationError(`${path} contains symbol keys`);
  }

  const keys = Object.getOwnPropertyNames(value).sort();
  const entries = keys.map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw new CanonicalizationError(
        `${path}.${key} must be an enumerable data property`,
      );
    }

    return `${JSON.stringify(key)}:${serialize(
      descriptor.value,
      ancestors,
      `${path}.${key}`,
    )}`;
  });

  return `{${entries.join(",")}}`;
}
