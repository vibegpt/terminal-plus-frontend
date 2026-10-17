export const h: any = { effects: [] as Array<() => any> };
export function useRef(v: any) { return { current: v }; }
export function useCallback(fn: any) { return fn; }
export function useEffect(fn: any) { h.effects.push(fn); }
