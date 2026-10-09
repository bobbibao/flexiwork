const removeDuplicateArrayObjectByKeys = <T>(arr: T[], keys?: (keyof T)[]): T[] => {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const effectiveKeys = keys && keys.length > 0 ? keys : (Object.keys(item) as (keyof T)[]);
    const keyValues = effectiveKeys.map((key) => item[key]).join('|');
    if (seen.has(keyValues)) {
      return false;
    } else {
      seen.add(keyValues);
      return true;
    }
  });
};

export { removeDuplicateArrayObjectByKeys };
