/** Collision-safe id with a readable prefix. */
export function createId(prefix: string) {
  const unique =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ?
  crypto.randomUUID() :
  Math.random().toString(36).slice(2);
  return `${prefix}-${unique}`;
}