import { jest } from '@jest/globals'

// ESM-friendly fetch mock mapper
export function useMockFetch(map) {
  const fn = jest.fn(async (url, opts) => {
    const entry = map[url];
    if (!entry) throw new Error(`No mock for URL: ${url}`);
    const spec = typeof entry === 'function' ? entry(url, opts) : entry;
    if (spec instanceof Error) throw spec;
    if (spec.ok === false) {
      return {
        ok: false,
        status: spec.status ?? 500,
        json: async () => spec.body ?? { error: 'fail' },
        text: async () => JSON.stringify(spec.body ?? { error: 'fail' }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => spec.json ?? spec,
      text: async () => JSON.stringify(spec.json ?? spec),
    };
  });
  global.fetch = fn;
  return fn;
}
