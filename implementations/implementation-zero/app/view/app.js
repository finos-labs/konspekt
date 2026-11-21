// implementation_zero view — Changes / Stats / Goals over the local server.
// Read-only: every panel is a projection of /api/*; nothing here writes.

const $ = (id) => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const stColor = { open: "var(--st-open)", active: "var(--st-active)", resolved: "var(--st-resolved)", abandoned: "var(--st-abandoned)" };
const stDot = { ...stColor };

const state = {
  tab: "changes",
  kinds: new Set(), statuses: new Set(), reviews: new Set(), q: "", preset: null, sort: "updated", dir: "desc",
  goal: null, asr: null, statsLoaded: false, goalsLoaded: false, decisionsLoaded: false,
};

// ---------- tabs ----------
function selectTab(name) {
  state.tab = name;
  if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
  for (const b of document.querySelectorAll(".tab")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
  $("panel-changes").hidden = name !== "changes";
  $("panel-stats").hidden = name !== "stats";
  $("panel-goals").hidden = name !== "goals";
  $("panel-decisions").hidden = name !== "decisions";
  if (name === "stats" && !state.statsLoaded) refreshStats();
  if (name === "goals" && !state.goalsLoaded) refreshGoals();
  if (name === "decisions" && !state.decisionsLoaded) refreshDecisions();
}
document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => selectTab(b.dataset.tab)));

// ---------- Changes ----------
const KINDS = ["goal", "investigation", "experiment", "topic", "task", "note", "concept", "noteworthy", "artifact", "waypoint"];
const STATUSES = ["open", "active", "resolved", "abandoned"];
const REVIEWS = ["proposed", "accepted"];
let rows = [], prevTs = {}, changedIds = new Set(), lastCursor = "";

function chip(label, on, dotVar) {
  const b = document.createElement("button");
  b.className = "chip"; b.type = "button"; b.setAttribute("aria-pressed", "false"); b.textContent = label;
  if (dotVar) { const d = document.createElement("span"); d.className = "dot"; d.style.background = dotVar; b.prepend(d); }
  b.addEventListener("click", () => { on(b); renderChanges(); });
  return b;
}
const kindWrap = $("kindChips"), statusWrap = $("statusChips"), reviewWrap = $("reviewChips");
KINDS.forEach((k) => kindWrap.appendChild(chip(k, (b) => toggle(state.kinds, k, b))));
STATUSES.forEach((s) => statusWrap.appendChild(chip(s, (b) => toggle(state.statuses, s, b), stDot[s])));
REVIEWS.forEach((r) => reviewWrap.appendChild(chip(r, (b) => toggle(state.reviews, r, b))));

function toggle(set, val, btn) {
  if (set.has(val)) { set.delete(val); btn.setAttribute("aria-pressed", "false"); }
  else { set.add(val); btn.setAttribute("aria-pressed", "true"); }
  clearPreset();
}
$("q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); renderChanges(); });
// Scroll the row window back to the top so a sort change is visible: the first
// rows that actually move can sit below the 10-row fold (created/updated agree
// for the most-recently-touched entities), so without this the list looks inert.
function scrollRowsTop() { const sc = document.querySelector("#panel-changes .tablescroll"); if (sc) sc.scrollTop = 0; }
$("sortSel").addEventListener("change", (e) => { state.sort = e.target.value; renderChanges(); scrollRowsTop(); });
$("sortDir").addEventListener("click", (e) => {
  state.dir = state.dir === "asc" ? "desc" : "asc";
  const asc = state.dir === "asc";
  e.currentTarget.setAttribute("aria-pressed", String(asc));
  e.currentTarget.textContent = asc ? "Oldest first" : "Newest first";
  renderChanges(); scrollRowsTop();
});
document.querySelectorAll(".preset").forEach((p) => p.addEventListener("click", () => applyPreset(p.dataset.preset, p)));
function applyPreset(name, btn) {
  const active = state.preset === name; resetFilters();
  if (!active) {
    state.preset = name; btn.setAttribute("aria-pressed", "true");
    if (name === "work") { state.statuses = new Set(["open"]); state.reviews = new Set(["accepted"]); }
    if (name === "queue") { state.reviews = new Set(["proposed"]); }
    syncChipUI();
  }
  renderChanges();
}
function clearPreset() { state.preset = null; document.querySelectorAll(".preset").forEach((p) => p.setAttribute("aria-pressed", "false")); }
function resetFilters() { state.kinds.clear(); state.statuses.clear(); state.reviews.clear(); state.q = ""; $("q").value = ""; clearPreset(); syncChipUI(); }
function syncChipUI() {
  [[kindWrap, state.kinds], [statusWrap, state.statuses], [reviewWrap, state.reviews]].forEach(([wrap, set]) =>
    wrap.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", set.has(c.textContent.trim()) ? "true" : "false")));
}
$("clearAll").addEventListener("click", () => { resetFilters(); renderChanges(); });

function passes(e) {
  if (state.kinds.size && !state.kinds.has(e.kind)) return false;
  if (state.statuses.size && !(e.status && state.statuses.has(e.status))) return false;
  if (state.reviews.size && !state.reviews.has(e.review)) return false;
  if (state.q && !e.id.toLowerCase().includes(state.q)) return false;
  return true;
}
function ago(iso) {
  if (!iso) return "—"; const t = Date.parse(iso); if (!t) return "—";
  const s = (Date.now() - t) / 1000; if (s < 90) return "just now";
  const m = s / 60; if (m < 90) return Math.round(m) + "m ago";
  const h = m / 60; if (h < 40) return Math.round(h) + "h ago";
  const d = h / 24; if (d < 14) return Math.round(d) + "d ago";
  return iso.slice(0, 10);
}
function renderChanges() {
  const field = state.sort === "created" ? "createdAt" : "updatedAt";
  const dir = state.dir === "asc" ? 1 : -1; // desc (newest first) is the default
  const list = rows.filter(passes)
    .sort((a, b) => dir * ((Date.parse(a[field]) || 0) - (Date.parse(b[field]) || 0)) || (a.id < b.id ? -1 : 1));
  const hdr = $("tsHdr"); if (hdr) hdr.textContent = state.sort === "created" ? "Created" : "Updated";
  const el = $("rows"); el.innerHTML = "";
  if (!list.length) { const tr = document.createElement("tr"); tr.innerHTML = '<td class="empty" colspan="5">No entities match these filters.</td>'; el.appendChild(tr); }
  else for (const e of list) el.appendChild(rowEl(e));
  $("totN").textContent = list.length; $("visN").textContent = Math.min(10, list.length);
  $("clearAll").hidden = !(state.kinds.size || state.statuses.size || state.reviews.size || state.q);
}
function rowEl(e) {
  const tr = document.createElement("tr");
  if (changedIds.has(e.id)) tr.classList.add("changed");
  if (e.status === "abandoned") tr.classList.add("st-abandoned");
  const tdId = document.createElement("td"); tdId.className = "id mono";
  const cell = document.createElement("div"); cell.className = "idcell";
  if (changedIds.has(e.id)) { const nd = document.createElement("span"); nd.className = "newdot"; nd.title = "changed since last reload"; cell.appendChild(nd); }
  const txt = document.createElement("span"); txt.className = "txt"; txt.textContent = e.id; txt.title = e.id; cell.appendChild(txt);
  tdId.appendChild(cell); tr.appendChild(tdId);
  const tdK = document.createElement("td"); const k = document.createElement("span"); k.className = "kind"; k.textContent = e.kind; tdK.appendChild(k); tr.appendChild(tdK);
  const tdS = document.createElement("td");
  if (e.status) { const s = document.createElement("span"); s.className = "status"; const dot = document.createElement("span"); dot.className = "dot"; dot.style.background = stDot[e.status] || "var(--ink-3)"; s.appendChild(dot); s.appendChild(document.createTextNode(e.status)); tdS.appendChild(s); }
  else { const s = document.createElement("span"); s.className = "status none"; s.textContent = "—"; tdS.appendChild(s); }
  tr.appendChild(tdS);
  const tdR = document.createElement("td"); const r = document.createElement("span"); r.className = "rev " + (e.review || ""); r.textContent = e.review || "—"; tdR.appendChild(r); tr.appendChild(tdR);
  const tdU = document.createElement("td"); tdU.className = "upd mono"; tdU.textContent = ago(state.sort === "created" ? e.createdAt : e.updatedAt); tr.appendChild(tdU);
  tr.classList.add("clickable"); tr.tabIndex = 0; tr.setAttribute("role", "button"); tr.title = "Open " + e.id;
  tr.addEventListener("click", () => openDetail(e.id));
  tr.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openDetail(e.id); } });
  return tr;
}
async function refreshChanges() {
  try {
    const snap = await (await fetch("/api/entities", { cache: "no-store" })).json();
    const next = snap.rows || [];
    const firstLoad = lastCursor === ""; changedIds = new Set();
    if (!firstLoad) for (const e of next) if (!(e.id in prevTs) || prevTs[e.id] !== e.updatedAt) changedIds.add(e.id);
    prevTs = {}; for (const e of next) prevTs[e.id] = e.updatedAt;
    rows = next; lastCursor = snap.cursor || "";
    $("err").hidden = !snap.error; if (snap.error) $("err").textContent = "reload error: " + snap.error;
    $("syncTxt").textContent = "synced just now · " + next.length + " entities" + (changedIds.size ? " · " + changedIds.size + " changed" : "");
    $("pulse").classList.remove("off"); renderChanges();
  } catch { $("syncTxt").textContent = "server unreachable — retrying"; $("pulse").classList.add("off"); }
}

// ---------- Stats ----------
async function refreshStats() {
  try {
    const s = await (await fetch("/api/stats", { cache: "no-store" })).json();
    if (s.error) { $("statsBody").innerHTML = '<p class="muted">stats unavailable: ' + s.error + "</p>"; return; }
    state.statsLoaded = true;
    const pct = s.total ? Math.round((s.accepted / s.total) * 100) : 0;
    const tiles = [["Entities", s.total], ["Edges", s.edges], ["Accepted", pct + "%"], ["Open proposals", s.proposed]];
    const maxTotal = Math.max(1, ...s.byKind.map((k) => k.total));
    const bars = s.byKind.map((k) => {
      const aw = (k.accepted / maxTotal) * 100, pw = (k.proposed / maxTotal) * 100;
      return `<div class="kindbar"><span class="kl">${k.kind}</span>
        <div class="bar" role="img" aria-label="${k.kind}: ${k.accepted} accepted, ${k.proposed} proposed">
          ${k.accepted ? `<span class="seg accepted" style="width:${aw}%"></span>` : ""}
          ${k.proposed ? `<span class="seg proposed" style="width:${pw}%"></span>` : ""}
        </div><span class="kn"><b>${k.total}</b> · ${k.accepted} acc · ${k.proposed} prop</span></div>`;
    }).join("");
    const oldest = s.oldest.length
      ? s.oldest.map((o) => `<div class="o"><span class="mono" title="${o.id}">${o.id}</span><span class="kind">${o.kind}</span><span class="age">${o.ageDays}d</span></div>`).join("")
      : '<p class="muted">no unaccepted proposals.</p>';
    $("statsBody").innerHTML = `
      <div class="tiles">${tiles.map(([l, n]) => `<div class="tile"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("")}</div>
      <h3 class="sec-h">By kind — accepted vs proposed</h3>
      <div class="legend-row"><span class="lg"><span class="sw" style="background:var(--bar-accepted)"></span> accepted</span><span class="lg"><span class="sw" style="background:var(--bar-proposed)"></span> proposed</span></div>
      ${bars}
      <h3 class="sec-h">Oldest unaccepted proposals</h3>
      <div class="oldest">${oldest}</div>`;
  } catch { $("statsBody").innerHTML = '<p class="muted">server unreachable.</p>'; }
}

// ---------- Goals ----------
async function refreshGoals() {
  try {
    const goals = await (await fetch("/api/goals", { cache: "no-store" })).json();
    if (goals.error) { $("goalsList").innerHTML = '<p class="muted pad">' + goals.error + "</p>"; return; }
    state.goalsLoaded = true;
    const list = $("goalsList"); list.innerHTML = "";
    for (const g of goals) {
      const b = document.createElement("button"); b.className = "gitem"; b.type = "button"; b.dataset.goal = g.id;
      b.setAttribute("aria-selected", String(state.goal === g.id));
      const st = g.rollup.byStatus || {};
      const parts = Object.keys(st).sort().map((k) => `${st[k]} ${k}`).join(" · ");
      b.innerHTML = `<span class="gt">${g.title}</span><span class="gm">${g.rollup.total} nodes${parts ? " · " + parts : ""}${g.rollup.proposed ? ` · <span class="rp">${g.rollup.proposed} proposed</span>` : ""}${g.review !== "accepted" ? " · (goal proposed)" : ""}</span>`;
      b.addEventListener("click", () => selectGoal(g.id));
      list.appendChild(b);
    }
    if (!state.goal && goals.length) selectGoal(goals[0].id);
    else if (state.goal) selectGoal(state.goal);
  } catch { $("goalsList").innerHTML = '<p class="muted pad">server unreachable.</p>'; }
}
async function selectGoal(id) {
  state.goal = id;
  document.querySelectorAll(".gitem").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.goal === id)));
  try {
    const data = await (await fetch("/api/graph?goal=" + encodeURIComponent(id), { cache: "no-store" })).json();
    if (data.error) { $("graphScroll").innerHTML = '<p class="muted">' + data.error + "</p>"; return; }
    const r = data.root, roll = data.rollup;
    $("graphHead").innerHTML = `<span class="gh-t">${r.title || r.id}</span><span class="gh-r">${roll.total} nodes · ${Object.entries(roll.byStatus || {}).map(([k, v]) => v + " " + k).join(" · ")}${roll.proposed ? " · " + roll.proposed + " proposed" : ""}</span>`;
    renderGraph(data);
    $("graphDetail").textContent = "Click a node to see its title and state.";
  } catch { $("graphScroll").innerHTML = '<p class="muted">server unreachable.</p>'; }
}
function short(id) { return id.length > 22 ? id.slice(0, 21) + "…" : id; }
function renderGraph(data) {
  const nodes = data.nodes.filter((n) => !n.missing);
  const byDepth = {}; nodes.forEach((n) => { (byDepth[n.depth] = byDepth[n.depth] || []).push(n); });
  const depths = Object.keys(byDepth).map(Number).sort((a, b) => a - b);
  const NW = 168, NH = 40, HGAP = 22, VGAP = 60, PAD = 16;
  const width = Math.max(NW + PAD * 2, ...depths.map((d) => byDepth[d].length * (NW + HGAP) - HGAP)) + PAD * 2;
  const height = depths.length * (NH + VGAP) - VGAP + PAD * 2;
  const pos = {};
  depths.forEach((d, di) => {
    const row = byDepth[d]; const rowW = row.length * (NW + HGAP) - HGAP; const startX = (width - rowW) / 2;
    row.forEach((n, ni) => { pos[n.id] = { x: startX + ni * (NW + HGAP), y: PAD + di * (NH + VGAP) }; });
  });
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "dag"); svg.setAttribute("width", width); svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  // edges first
  for (const n of nodes) for (const p of (n.parents || [])) {
    if (!pos[p] || !pos[n.id]) continue;
    const a = pos[p], b = pos[n.id];
    const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y;
    const path = document.createElementNS(SVGNS, "path");
    const my = (y1 + y2) / 2;
    path.setAttribute("d", `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`);
    path.setAttribute("class", "gedge"); svg.appendChild(path);
  }
  // nodes
  for (const n of nodes) {
    const p = pos[n.id]; const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "gnode"); g.setAttribute("transform", `translate(${p.x},${p.y})`);
    const rect = document.createElementNS(SVGNS, "rect");
    rect.setAttribute("width", NW); rect.setAttribute("height", NH); rect.setAttribute("rx", 8);
    rect.setAttribute("style", `stroke:${stColor[n.status] || "var(--ink-3)"}`);
    if (n.review === "proposed") { rect.setAttribute("stroke-dasharray", "4 3"); rect.setAttribute("opacity", "0.92"); }
    g.appendChild(rect);
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", 10); t.setAttribute("y", NH / 2 + 4); t.textContent = short(n.id);
    g.appendChild(t);
    const title = document.createElementNS(SVGNS, "title");
    title.textContent = `${n.id}\n${n.type || ""} · ${n.status || "—"} · ${n.review || "—"}`;
    g.appendChild(title);
    g.addEventListener("click", () => {
      document.querySelectorAll(".gnode.sel").forEach((x) => x.classList.remove("sel"));
      g.classList.add("sel");
      $("graphDetail").innerHTML = `<b>${n.id}</b> — ${n.type || "?"} · ${n.status || "—"} · ${n.review || "—"}${n.title ? " — " + n.title : ""}`;
      openDetail(n.id);
    });
    svg.appendChild(g);
  }
  const scroll = $("graphScroll"); scroll.innerHTML = ""; scroll.appendChild(svg);
}

// ---------- entity detail drawer ----------
const drawer = $("drawer"), backdrop = $("drawerBackdrop"), drawerBody = $("drawerBody");
let lastFocus = null;

async function openDetail(id) {
  lastFocus = document.activeElement;
  $("drawerTitle").textContent = id;
  drawerBody.innerHTML = '<p class="drawer-loading">loading…</p>';
  backdrop.hidden = false; drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false");
  $("drawerClose").focus();
  resetStack(id);
  try {
    const d = await (await fetch("/api/entity?id=" + encodeURIComponent(id), { cache: "no-store" })).json();
    if (d.error) { drawerBody.innerHTML = ""; const p = document.createElement("p"); p.className = "drawer-err"; p.textContent = d.error; drawerBody.appendChild(p); return; }
    let cmds = [];
    try { cmds = (await (await fetch("/api/commands?entity=" + encodeURIComponent(id), { cache: "no-store" })).json()).commands || []; } catch { /* endpoint may be absent */ }
    let chgs = [];
    try { chgs = (await (await fetch("/api/changes?entity=" + encodeURIComponent(id), { cache: "no-store" })).json()).changes || []; } catch { /* endpoint may be absent */ }
    let trans = [];
    if (d.entityType) {
      try { trans = (await (await fetch("/api/transitions?ref=" + encodeURIComponent(d.entityType + ":" + d.id), { cache: "no-store" })).json()).transitions || []; } catch { /* endpoint may be absent */ }
    }
    renderDrawer(d, cmds, chgs, trans);
  } catch { drawerBody.innerHTML = '<p class="drawer-err">server unreachable.</p>'; }
}

// ---------- drawer view stack (source views pushed over the entity) ----------
// stack[0] is the entity view; each opened reference pushes a source view with a
// back button and the path it was opened from (task-ui-clickable-source-refs,
// mockup variant C). Every view is a .drawer-view element inside drawerBody; only
// the top one is shown, so going back restores the entity view's tab and scroll.
let stack = [];
function resetStack(id) { stack = [{ el: null, title: id, crumb: id }]; syncHead(); }
function syncHead() {
  const top = stack[stack.length - 1];
  $("drawerTitle").textContent = top.title;
  const stacked = stack.length > 1;
  $("drawerBack").hidden = !stacked;
  $("drawerCrumb").hidden = !stacked;
  $("drawerCrumb").textContent = stacked ? stack.slice(0, -1).map((v) => v.crumb).concat("").join("  ›  ").trim() : "";
}
function pushView(el, title, crumb) {
  for (const v of stack) if (v.el) v.el.hidden = true;
  el.classList.add("drawer-view"); drawerBody.appendChild(el);
  stack.push({ el, title, crumb: crumb || title }); syncHead();
}
function popView() {
  if (stack.length < 2) return;
  const top = stack.pop(); top.el.remove();
  const cur = stack[stack.length - 1]; if (cur.el) cur.el.hidden = false;
  syncHead();
}
$("drawerBack").addEventListener("click", popView);

// ---------- ni references in drawer text ----------
// An `ni:///sha-256;<43 base64url>` reference, optionally `command:`-prefixed,
// not followed by another base64url character; or a 40-hex SHA-1 (only those in
// the entity's provenance.deprecated block are linked; see `legacy`).
const REF_RE = /(command:)?ni:\/\/\/sha-256;[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])|\b[0-9a-f]{40}\b/g;
// A <pre> of `text` in which each reference is a button that opens it in a
// source view. `legacy` is the set of SHA-1 values to link; `ctx` carries the
// entity (for origin locators) and the crumb the opened view records.
function refPre(text, legacy, ctx) {
  const p = document.createElement("pre"); p.className = "md";
  const s = String(text == null ? "" : text);
  let last = 0;
  for (const m of s.matchAll(REF_RE)) {
    const tok = m[0];
    const isSha1 = !tok.startsWith("ni:") && !tok.startsWith("command:");
    if (isSha1 && !(legacy && legacy.has(tok))) continue;
    if (m.index > last) p.appendChild(document.createTextNode(s.slice(last, m.index)));
    const b = document.createElement("button"); b.type = "button"; b.className = "ref"; b.textContent = tok;
    b.title = "Open " + (tok.startsWith("command:") ? "this command" : "this source");
    b.addEventListener("click", () => openRef(tok, ctx));
    p.appendChild(b); last = m.index + tok.length;
  }
  if (last < s.length) p.appendChild(document.createTextNode(s.slice(last)));
  return p;
}

async function copyText(text, btn) {
  const label = btn.textContent;
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { /* no async clipboard */ }
  if (!ok) {
    // Fallback for a browser without the async clipboard (the plugin's JCEF).
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
  }
  btn.textContent = ok ? "Copied" : "Copy failed";
  setTimeout(() => { btn.textContent = label; }, 1400);
}

// Open one reference in a source view pushed over the drawer. `info` optionally
// carries a title and meta line (from a Provenance index entry). The content is
// read through the server (/api/source, or /api/command for `command:`), so this
// does not depend on the store kind; the server also returns the store location.
async function openRef(ref, ctx, info) {
  const isCmd = ref.startsWith("command:");
  const el = document.createElement("div");
  const body = document.createElement("div"); body.className = "drawer-panel"; el.appendChild(body);
  body.innerHTML = '<p class="drawer-loading">loading…</p>';
  pushView(el, "loading…", null);
  const entry = stack[stack.length - 1];
  let r;
  try {
    const url = (isCmd ? "/api/command?ref=" : "/api/source?ref=") + encodeURIComponent(ref);
    r = await (await fetch(url, { cache: "no-store" })).json();
  } catch { r = { error: "server unreachable" }; }
  body.innerHTML = "";
  const ok = r && !r.error && typeof r.markdown === "string";
  entry.title = ok ? r.path : "unresolved reference";
  entry.crumb = ok ? r.path.split("/").pop().slice(0, 12) + "…" : "unresolved";
  if (stack[stack.length - 1] === entry) syncHead();

  if (info && (info.title || info.meta)) {
    const m = document.createElement("div"); m.className = "src-meta";
    m.textContent = [info.title, info.meta].filter(Boolean).join(" · "); body.appendChild(m);
  }
  const box = document.createElement("div"); box.className = "src-loc";
  const h = document.createElement("span"); h.className = "src-label";
  h.textContent = ok && r.location ? "Location in store (" + r.location.from + ")" : "Reference";
  box.appendChild(h);
  if (ok && r.location && r.location.uri) {
    let href = null;
    if (r.location.link) { try { const u = new URL(r.location.uri); if (u.protocol === "http:" || u.protocol === "https:") href = u.href; } catch { /* not a URL */ } }
    const v = document.createElement(href ? "a" : "span"); v.className = "v"; v.textContent = r.location.uri;
    if (href) { v.href = href; v.target = "_blank"; v.rel = "noopener noreferrer"; }
    box.appendChild(v);
  }
  const rv = document.createElement("span"); rv.className = "r"; rv.textContent = ref; box.appendChild(rv);
  body.appendChild(box);

  if (ok) body.appendChild(refPre(r.markdown, null, ctx));
  else { const p = document.createElement("p"); p.className = "src-missing"; p.textContent = "No such content. The reference does not resolve in this instance."; body.appendChild(p); }

  const acts = document.createElement("div"); acts.className = "src-actions";
  const cRef = document.createElement("button"); cRef.type = "button"; cRef.className = "src-btn"; cRef.textContent = "Copy reference";
  cRef.addEventListener("click", () => copyText(ref, cRef)); acts.appendChild(cRef);
  if (ok && r.location && r.location.uri && !r.location.link) {
    const cLoc = document.createElement("button"); cLoc.type = "button"; cLoc.className = "src-btn"; cLoc.textContent = "Copy location";
    cLoc.addEventListener("click", () => copyText(r.location.uri, cLoc)); acts.appendChild(cLoc);
  }
  body.appendChild(acts);

  // Origin locators describe the entity's extraction excerpt, so they show in
  // that excerpt's source view too.
  const d = ctx && ctx.entity;
  if (ok && !isCmd && d && ref === d.sourceRef && Array.isArray(d.locators) && d.locators.length) {
    const lh = document.createElement("div"); lh.className = "src-label"; lh.textContent = "Origin locators"; body.appendChild(lh);
    body.appendChild(locatorList(d.locators));
  }
}

// Origin locators (SERIALIZATION.md § Sources): where the excerpt was taken from.
// Only an http(s) URI becomes a link; anything else is text.
function locatorList(locs) {
  const ul = document.createElement("ul"); ul.className = "loc-list";
  for (const l of locs) {
    const li = document.createElement("li");
    let href = null; try { const u = new URL(String(l.uri)); if (u.protocol === "http:" || u.protocol === "https:") href = u.href; } catch { /* not a URL */ }
    const name = document.createElement(href ? "a" : "span"); name.textContent = String(l.uri || "");
    if (href) { name.href = href; name.target = "_blank"; name.rel = "noopener noreferrer"; }
    li.appendChild(name);
    const meta = document.createElement("span"); meta.className = "muted"; meta.textContent = "  " + [l.kind, l.retrievedAt].filter(Boolean).join(" · ");
    li.appendChild(meta); ul.appendChild(li);
  }
  return ul;
}

// Disposition bar: the human write actions, offered by the entity's current state.
// Accept shows while the entity is proposed (flip review -> accepted). Resolve
// shows for a work node that is open or active (the `resolve` authority verb ->
// status: resolved). Each action edits the working tree only; the model never does
// this. Renders for both shells from this one view.
function renderDisposition(d, parent) {
  const acts = [];
  if (d.review === "proposed")
    acts.push({ label: "Accept", busy: "Accepting…", url: "/api/accept",
      confirm: "Accept " + d.id + "? This edits the working tree." });
  if (d.entityType === "node" && (d.status === "open" || d.status === "active"))
    acts.push({ label: "Resolve", busy: "Resolving…", url: "/api/resolve",
      confirm: "Resolve " + d.id + "? This sets status: resolved in the working tree." });
  if (!acts.length) return;

  const bar = document.createElement("div"); bar.className = "accept-bar";
  const note = document.createElement("span"); note.className = "accept-note";
  const idle = d.review === "proposed"
    ? "Proposed — awaiting a human disposition."
    : "A human can dispose of this from here.";
  const actions = document.createElement("span"); actions.className = "accept-actions";
  bar.appendChild(note); bar.appendChild(actions); parent.appendChild(bar);

  // Inline confirm — no native window.confirm/alert (the plugin's JCEF browser has
  // no JS-dialog handler, so those silently no-op). Click an action, then Confirm;
  // errors show in the note. On success the entity re-opens with fresh state.
  const showActions = () => {
    note.textContent = idle; actions.innerHTML = "";
    for (const a of acts) {
      const btn = document.createElement("button"); btn.className = "accept-btn"; btn.type = "button"; btn.textContent = a.label;
      btn.addEventListener("click", () => confirmAction(a));
      actions.appendChild(btn);
    }
  };
  const confirmAction = (a) => {
    note.textContent = a.confirm; actions.innerHTML = "";
    const yes = document.createElement("button"); yes.className = "accept-btn"; yes.type = "button"; yes.textContent = "Confirm";
    const no = document.createElement("button"); no.className = "accept-cancel"; no.type = "button"; no.textContent = "Cancel";
    no.addEventListener("click", showActions);
    yes.addEventListener("click", async () => {
      yes.disabled = true; no.disabled = true; yes.textContent = a.busy;
      try {
        const r = await (await fetch(a.url + "?entity=" + encodeURIComponent(d.id), { method: "POST" })).json();
        if (r && r.error) { note.textContent = "Could not " + a.label.toLowerCase() + ": " + r.error; yes.disabled = false; no.disabled = false; yes.textContent = "Confirm"; return; }
        openDetail(d.id);
      } catch { note.textContent = "Server unreachable."; yes.disabled = false; no.disabled = false; yes.textContent = "Confirm"; }
    });
    actions.appendChild(yes); actions.appendChild(no);
  };
  showActions();
}

// When an entity is already accepted, show who accepted it — the `by` of its
// review -> accepted transition row, surfaced by the backend as acceptedBy.
// Renders for both shells from this one view.
function renderAcceptance(d, parent) {
  if (d.review !== "accepted") return;
  const bar = document.createElement("div"); bar.className = "accept-bar accepted";
  const note = document.createElement("span"); note.className = "accept-note";
  note.textContent = d.acceptedBy ? ("Accepted by " + d.acceptedBy + ".") : "Accepted.";
  bar.appendChild(note); parent.appendChild(bar);
}

// The detail drawer is a tab panel: Details (the file, with its references
// linked), Provenance (an index of every reference that bears on the entity),
// Commands, and Changes — the last two shown only when the entity has recorded
// commands / code changes (surface follows data). Tabs render for both shells
// from this one view.
function pre(text) { const p = document.createElement("pre"); p.className = "md"; p.textContent = text; return p; }
function shortTs(iso) { return iso ? String(iso).replace("T", " ").replace(/:\d{2}(\.\d+)?Z$/, "Z") : ""; }

// The Provenance index (mockup variant D), grouped as: the extraction
// (provenance.sourceRef plus any SHA-1 references in provenance.deprecated), the
// entity's transition-log rows, and its origin locators. An entry with a source
// is a button that opens it in the source view; a transition row without a
// source is listed without a click target.
function provenanceGroups(d, trans) {
  const p = d.provenance || {};
  const extraction = [];
  if (d.sourceRef) extraction.push({ title: "provenance.sourceRef",
    meta: [shortTs(p.timestamp), p.conversationId && "conversation " + p.conversationId, p.confidence && "confidence " + p.confidence].filter(Boolean).join(" · "),
    ref: d.sourceRef });
  const dep = d.deprecated;
  if (dep && dep.sourceRef) extraction.push({ title: "provenance.deprecated.sourceRef (SHA-1)", meta: dep.migratedAt ? "migrated " + shortTs(dep.migratedAt) : "", ref: dep.sourceRef });
  if (dep && dep.contentHash && dep.contentHash !== dep.sourceRef) extraction.push({ title: "provenance.deprecated.contentHash (SHA-1)", meta: dep.migratedAt ? "migrated " + shortTs(dep.migratedAt) : "", ref: dep.contentHash });
  const transitions = (trans || []).map((t) => ({
    title: t.field + ": " + (t.from || "(birth)") + " → " + t.to,
    meta: [shortTs(t.timestamp), t.by && "by " + t.by].filter(Boolean).join(" · "),
    ref: t.source || null,
  }));
  return { extraction, transitions };
}
function renderProvenance(d, trans, ctx) {
  const w = document.createElement("div"); w.className = "cmd-list";
  const { extraction, transitions } = provenanceGroups(d, trans);
  const group = (name, items, empty) => {
    const sec = document.createElement("section"); sec.className = "pv-group";
    const h = document.createElement("h3"); h.textContent = name; sec.appendChild(h);
    if (!items.length) { const p = document.createElement("p"); p.className = "muted"; p.textContent = empty; sec.appendChild(p); }
    for (const it of items) {
      const el = document.createElement(it.ref ? "button" : "div");
      el.className = "pv-item" + (it.ref ? "" : " noref");
      if (it.ref) { el.type = "button"; el.addEventListener("click", () => openRef(it.ref, ctx, it)); }
      const t = document.createElement("span"); t.className = "t";
      const tt = document.createElement("span"); tt.textContent = it.title; t.appendChild(tt);
      if (it.ref) { const go = document.createElement("span"); go.className = "go"; go.setAttribute("aria-hidden", "true"); go.textContent = "›"; t.appendChild(go); }
      el.appendChild(t);
      const m = document.createElement("span"); m.className = "m"; m.textContent = it.ref ? it.meta : [it.meta, "no source recorded"].filter(Boolean).join(" · "); el.appendChild(m);
      if (it.ref) { const r = document.createElement("span"); r.className = "r"; r.textContent = it.ref; el.appendChild(r); }
      sec.appendChild(el);
    }
    w.appendChild(sec);
  };
  group("Extraction", extraction, "No content-addressed provenance for this entity.");
  group("Transitions", transitions, "No transition-log rows for this entity.");
  const sec = document.createElement("section"); sec.className = "pv-group";
  const h = document.createElement("h3"); h.textContent = "Origin locators"; sec.appendChild(h);
  const locs = Array.isArray(d.locators) ? d.locators : [];
  if (locs.length) sec.appendChild(locatorList(locs));
  else { const p = document.createElement("p"); p.className = "muted"; p.textContent = "None recorded for this entity."; sec.appendChild(p); }
  w.appendChild(sec);
  return w;
}

function renderDrawer(d, cmds, chgs, trans) {
  chgs = chgs || []; trans = trans || [];
  const dep = d.deprecated || {};
  const legacy = new Set([dep.sourceRef, dep.contentHash].filter(Boolean));
  const ctx = { entity: d };
  const pg = provenanceGroups(d, trans);
  const pvCount = pg.extraction.length + pg.transitions.length;
  const tabs = [
    { label: "Details", build: () => refPre(d.markdown, legacy, ctx) },
    { label: pvCount ? "Provenance (" + pvCount + ")" : "Provenance", build: () => renderProvenance(d, trans, ctx) },
  ];
  if (cmds.length) tabs.push({ label: "Commands (" + cmds.length + ")", build: () => {
    const w = document.createElement("div"); w.className = "cmd-list";
    cmds.forEach((c, i) => {
      const lbl = document.createElement("div"); lbl.className = "src-label"; lbl.textContent = (i + 1) + " · " + (c.path || "commands/" + c.command.slice(0, 10) + "…");
      w.appendChild(lbl); w.appendChild(pre(c.markdown));
    });
    return w;
  } });
  // Changes: the changed-code log grouped by commit. `commit` is an opaque
  // revision token shown as a short label; the files are the change's projection.
  if (chgs.length) tabs.push({ label: "Changes (" + chgs.length + ")", build: () => {
    const w = document.createElement("div"); w.className = "cmd-list";
    chgs.forEach((g, i) => {
      const lbl = document.createElement("div"); lbl.className = "src-label";
      lbl.textContent = (i + 1) + " · commit " + String(g.commit).slice(0, 10) + "…";
      w.appendChild(lbl);
      const ul = document.createElement("ul"); ul.className = "chg-files";
      (g.files || []).forEach((f) => { const li = document.createElement("li"); li.textContent = f; ul.appendChild(li); });
      w.appendChild(ul);
    });
    return w;
  } });

  drawerBody.innerHTML = "";
  const root = document.createElement("div"); root.className = "drawer-view";
  drawerBody.appendChild(root);
  stack = [{ el: root, title: d.id, crumb: d.id }]; syncHead();
  renderDisposition(d, root);
  renderAcceptance(d, root);
  const strip = document.createElement("div"); strip.className = "drawer-tabs"; strip.setAttribute("role", "tablist");
  const panel = document.createElement("div"); panel.className = "drawer-panel";
  // The crumb of a source view names the tab it was opened from.
  const show = (t, btn) => {
    strip.querySelectorAll(".dtab").forEach((x) => x.setAttribute("aria-selected", "false")); btn.setAttribute("aria-selected", "true");
    panel.innerHTML = ""; panel.appendChild(t.build());
    stack[0].crumb = t.label === tabs[0].label ? d.id : d.id + "  ›  " + t.label.replace(/ \(\d+\)$/, "");
  };
  tabs.forEach((t, i) => {
    const b = document.createElement("button"); b.className = "dtab"; b.type = "button"; b.textContent = t.label; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.addEventListener("click", () => show(t, b));
    strip.appendChild(b);
  });
  root.appendChild(strip); root.appendChild(panel);
  panel.appendChild(tabs[0].build());
}

function closeDetail() {
  drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); backdrop.hidden = true;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
$("drawerClose").addEventListener("click", closeDetail);
backdrop.addEventListener("click", closeDetail);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("open")) closeDetail(); });

// ---------- Decisions (ASR/ADR) ----------
const UNDRIVEN = "__undriven__"; // group id for ADRs with no drives edge from an ASR
async function updateDecisionsTab() {
  try {
    const d = await (await fetch("/api/asradr", { cache: "no-store" })).json();
    const btn = document.querySelector('.tab[data-tab="decisions"]');
    if (btn) btn.hidden = !(d.count > 0); // surface follows data, not the persona flag
    if (state.tab === "decisions" && !(d.count > 0)) selectTab("changes");
  } catch { /* leave the tab as-is */ }
}
async function refreshDecisions() {
  try {
    const d = await (await fetch("/api/asradr", { cache: "no-store" })).json();
    if (d.error) { $("asrList").innerHTML = '<p class="muted pad">' + d.error + "</p>"; return; }
    state.decisionsLoaded = true;
    const list = $("asrList"); list.innerHTML = "";
    // ADRs that no ASR drives form one extra group, so the view lists every ADR.
    const groups = d.asrs.slice();
    const undriven = d.undriven || [];
    if (undriven.length) groups.push({ id: UNDRIVEN, label: "Not driven by an ASR", review: null, adrs: undriven, undriven: true });
    if (!groups.length) { list.innerHTML = '<p class="muted pad">No ASRs or ADRs recorded.</p>'; $("asrHead").innerHTML = ""; $("adrList").innerHTML = ""; return; }
    for (const a of groups) {
      const b = document.createElement("button"); b.className = "gitem"; b.type = "button"; b.dataset.asr = a.id;
      b.setAttribute("aria-selected", String(state.asr === a.id));
      b.innerHTML = `<span class="gt">${a.label}</span><span class="gm">${a.adrs.length} ADR${a.adrs.length === 1 ? "" : "s"}${a.review && a.review !== "accepted" ? " · (" + a.review + ")" : ""}</span>`;
      b.addEventListener("click", () => selectAsr(a));
      list.appendChild(b);
    }
    selectAsr(groups.find((a) => a.id === state.asr) || groups[0]);
  } catch { $("asrList").innerHTML = '<p class="muted pad">server unreachable.</p>'; }
}
function selectAsr(a) {
  state.asr = a.id;
  document.querySelectorAll("#asrList .gitem").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.asr === a.id)));
  $("asrHead").innerHTML = `<span class="gh-t">${a.label}</span><span class="gh-r">${a.adrs.length} ADR${a.adrs.length === 1 ? "" : "s"}${a.undriven ? " with no drives edge" : " driven"}</span>`;
  const wrap = $("adrList"); wrap.innerHTML = "";
  if (!a.undriven) { const asrRow = drow("ASR", a.id, a.review, false); asrRow.addEventListener("click", () => openDetail(a.id)); wrap.appendChild(asrRow); }
  if (!a.adrs.length) { const p = document.createElement("p"); p.className = "muted"; p.style.padding = "8px 14px"; p.textContent = "This ASR drives no ADRs yet."; wrap.appendChild(p); }
  for (const adr of a.adrs) { const r = drow("ADR", adr.id, adr.superseded ? "superseded" : adr.review, true); r.addEventListener("click", () => openDetail(adr.id)); wrap.appendChild(r); }
  $("asrDetail").textContent = "Click an ASR or ADR to open its details and provenance.";
}
function drow(kind, id, review, isAdr) {
  const b = document.createElement("button"); b.className = "drow"; b.type = "button";
  const k = document.createElement("span"); k.className = "drow-k" + (isAdr ? " adr" : ""); k.textContent = kind;
  const t = document.createElement("span"); t.className = "mono"; t.textContent = id; t.title = id;
  b.appendChild(k); b.appendChild(t);
  if (review) { const r = document.createElement("span"); r.className = "rev " + review; r.textContent = review; b.appendChild(r); }
  return b;
}

// ---------- live updates ----------
function refreshActive() {
  refreshChanges();
  updateDecisionsTab();
  if (state.tab === "stats") refreshStats();
  if (state.tab === "goals") refreshGoals();
  if (state.tab === "decisions") refreshDecisions();
}
function connect() {
  const es = new EventSource("/events");
  es.addEventListener("change", () => refreshActive());
  es.onopen = () => $("pulse").classList.remove("off");
  es.onerror = () => { $("pulse").classList.add("off"); $("syncTxt").textContent = "reconnecting…"; };
}
refreshChanges();
connect();
updateDecisionsTab();
const initTab = location.hash.slice(1);
if (initTab === "stats" || initTab === "goals" || initTab === "decisions") selectTab(initTab);
