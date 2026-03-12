export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function toTrimmedString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function toOptionalString(value: unknown) {
  const text = toTrimmedString(value);
  return text.length > 0 ? text : null;
}

export function toPositiveNumber(value: unknown) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function toOptionalId(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const num = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export function parseBooleanFlag(value: unknown, defaultValue = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === '1' || value === 1 || value === 'true') {
    return true;
  }

  if (value === '0' || value === 0 || value === 'false') {
    return false;
  }

  return defaultValue;
}

export function isRole(value: unknown): value is 'admin' | 'worker' | 'customer' {
  return value === 'admin' || value === 'worker' || value === 'customer';
}
