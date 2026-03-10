export const DEFAULT_PAGE_SIZE = 20

export function parsePageValue(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number.parseInt(value, 10)
    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      return parsedValue
    }
  }

  return 1
}

export function parsePageSizeValue(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number.parseInt(value, 10)
    if (Number.isInteger(parsedValue) && parsedValue > 0 && parsedValue <= 100) {
      return parsedValue
    }
  }

  return DEFAULT_PAGE_SIZE
}

export function parseQueryValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseEnumValue<const TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallbackValue: TValue,
): TValue {
  return typeof value === 'string' && allowedValues.includes(value as TValue)
    ? value as TValue
    : fallbackValue
}
