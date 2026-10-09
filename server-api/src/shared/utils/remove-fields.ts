
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeFields<T extends Record<string, any>>(obj: T, fieldsToRemove: string[]): Partial<T> {
  // Create a new object that includes only the fields not in fieldsToRemove
  const filteredObj: Partial<T> = Object.keys(obj)
    .filter((key) => !fieldsToRemove.includes(key))
    .reduce((acc, key) => {
      acc[key as keyof T] = obj[key];
      return acc;
    }, {} as Partial<T>);

  return filteredObj;
}

// Utility function to remove fields with null values
export function removeNullFields<T>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null)) as Partial<T>;
}
