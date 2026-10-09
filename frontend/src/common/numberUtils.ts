export function toNumber(value: string | number) {
  return typeof value === 'string' ? parseInt(value) : value;
}
