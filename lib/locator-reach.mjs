// konspekt locator reachability — the network half of the locator rules.
//
// SERIALIZATION.md § Sources: "a validator ... reports an unreachable locator as
// a warning, never an error, because the excerpt is already stored." The
// offline rules (shape, kind, retrievedAt, host in project.md locators.allow)
// live in ./conformance.mjs, which stays synchronous and does no I/O beyond the
// instance directory. This module performs the one check that needs the
// network; lib/validate.mjs runs it unless given --no-check-locators.
//
// Only locators that pass the offline rules are fetched: a malformed URI or a
// host outside locators.allow is already reported by the checker, and the
// allow-list also bounds which hosts this module contacts.

const ENTITY_LISTS = ["nodes", "concepts", "noteworthy", "artifacts", "waypoints"];

// Collect the well-formed, allowed locators of a loadInstance() result,
// grouped by URI so each URI is requested once however many entities cite it.
// Returns [{ uri, refs: [{ entityType, id, index }] }] in first-seen order.
export function collectLocators(result) {
  const allow = Array.isArray(result.project?.locators?.allow)
    ? result.project.locators.allow.map(String)
    : [];
  const byUri = new Map();
  for (const list of ENTITY_LISTS) {
    for (const e of result[list] || []) {
      const locators = e.provenance?.locators;
      if (!Array.isArray(locators)) continue;
      locators.forEach((l, i) => {
        if (!l || typeof l !== "object" || !l.uri) return;
        let url;
        try { url = new URL(String(l.uri)); } catch { return; }
        if (url.protocol !== "http:" && url.protocol !== "https:") return;
        if (!allow.includes(url.hostname)) return;
        const uri = String(l.uri);
        if (!byUri.has(uri)) byUri.set(uri, { uri, refs: [] });
        byUri.get(uri).refs.push({ entityType: e.entityType, id: e.id, index: i + 1 });
      });
    }
  }
  return [...byUri.values()];
}

// Request one URI. HEAD first; a server that rejects HEAD (405, 501) is asked
// again with GET, whose body is discarded. Redirects are followed. Returns
// { ok, detail } where detail names the status or the network error.
export async function probe(uri, { fetchImpl = globalThis.fetch, timeoutMs = 10000 } = {}) {
  const attempt = async (method) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(uri, { method, redirect: "follow", signal: ctl.signal });
      if (res.body) await res.body.cancel().catch(() => {});
      return { status: res.status };
    } catch (err) {
      const detail = ctl.signal.aborted
        ? `no response within ${timeoutMs} ms`
        : (err?.cause?.code || err?.code || err?.message || String(err));
      return { error: detail };
    } finally {
      clearTimeout(timer);
    }
  };
  let r = await attempt("HEAD");
  if (r.status === 405 || r.status === 501) r = await attempt("GET");
  if (r.error) return { ok: false, detail: r.error };
  return { ok: r.status < 400, detail: `HTTP ${r.status}` };
}

// Probe every collected locator with at most `concurrency` requests in flight.
// Returns { checked, problems }: problems are in the checker's shape, one
// locator-unreachable warning per citing entity locator, so the report
// attributes an unreachable URI to each entity that cites it.
export async function checkLocatorReach(result, opts = {}) {
  const { concurrency = 4 } = opts;
  const targets = collectLocators(result);
  const outcomes = new Array(targets.length);
  let next = 0;
  const worker = async () => {
    while (next < targets.length) {
      const i = next++;
      outcomes[i] = await probe(targets[i].uri, opts);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));

  const problems = [];
  targets.forEach((t, i) => {
    if (outcomes[i].ok) return;
    for (const r of t.refs) {
      problems.push({
        severity: "warning",
        code: "locator-unreachable",
        message: `${r.entityType} "${r.id}" locator ${r.index} at ${t.uri} is unreachable (${outcomes[i].detail})`,
        ref: r.id,
      });
    }
  });
  return { checked: targets.length, problems };
}
