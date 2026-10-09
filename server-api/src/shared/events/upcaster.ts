/**
 * Upcasters turn an old stored event payload into the current version (docs/ARCHITECTURE.md §6.3).
 * Register one per (type, fromVersion). Loading applies them in sequence.
 */
export type Upcaster = (payload: any) => any;

const registry = new Map<string, Upcaster>();

export function registerUpcaster(type: string, fromVersion: number, fn: Upcaster): void {
  registry.set(`${type}@${fromVersion}`, fn);
}

export function upcast(type: string, version: number, payload: any): { version: number; payload: any } {
  let v = version;
  let p = payload;
  for (let fn = registry.get(`${type}@${v}`); fn; fn = registry.get(`${type}@${v}`)) {
    p = fn(p);
    v += 1;
  }
  return { version: v, payload: p };
}
