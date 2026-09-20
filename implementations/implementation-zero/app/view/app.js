// implementation_zero view — Changes / Stats / Goals over the local server.
// Read-only: every panel is a projection of /api/*; nothing here writes.

const $ = (id) => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const stColor = { open: "var(--st-open)", active: "var(--st-active)", resolved: "var(--st-resolved)", abandoned: "var(--st-abandoned)" };
const stDot = { ...stColor };

const state = {
  tab: "changes",
  kinds: new Set(), statuses: new Set(), reviews: new Set(), q: "", preset: null,
  goal: null, statsLoaded: false, goalsLoaded: false,
};

// ---------- tabs ----------
function selectTab(name) {
  state.tab = name;
  if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
  for (const b of document.querySelectorAll(".tab")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
  $("panel-changes").hidden = name !== "changes";
  $("panel-stats").hidden = name !== "stats";
  $("panel-goals").hidden = name !== "goals";
  if (name === "stats" && !state.statsLoaded) refreshStats();
  if (name === "goals" && !state.goalsLoaded) refreshGoals();
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
  const list = rows.filter(passes); const el = $("rows"); el.innerHTML = "";
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
  const tdU = document.createElement("td"); tdU.className = "upd mono"; tdU.textContent = ago(e.updatedAt); tr.appendChild(tdU);
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
  try {
    const d = await (await fetch("/api/entity?id=" + encodeURIComponent(id), { cache: "no-store" })).json();
    if (d.error) { drawerBody.innerHTML = ""; const p = document.createElement("p"); p.className = "drawer-err"; p.textContent = d.error; drawerBody.appendChild(p); return; }
    let source = null;
    if (d.sourceRef) { try { source = await (await fetch("/api/source?ref=" + encodeURIComponent(d.sourceRef), { cache: "no-store" })).json(); } catch { source = { error: "unreachable" }; } }
    let cmds = [];
    try { cmds = (await (await fetch("/api/commands?entity=" + encodeURIComponent(id), { cache: "no-store" })).json()).commands || []; } catch { /* endpoint may be absent */ }
    renderDrawer(d, source, cmds);
  } catch { drawerBody.innerHTML = '<p class="drawer-err">server unreachable.</p>'; }
}

// The detail drawer is a tab panel: Details (the file), Provenance (the source),
// and Commands — the last shown only when the entity has recorded commands
// (surface follows data). Tabs render for both shells from this one view.
function pre(text) { const p = document.createElement("pre"); p.className = "md"; p.textContent = text; return p; }
function renderDrawer(d, source, cmds) {
  const tabs = [
    { label: "Details", build: () => pre(d.markdown) },
    { label: "Provenance", build: () => {
      const w = document.createElement("div");
      if (d.sourceRef) {
        const lbl = document.createElement("div"); lbl.className = "src-label"; lbl.textContent = "sources/" + d.sourceRef + ".md";
        w.appendChild(lbl); w.appendChild(pre(source && !source.error ? source.markdown : (source && source.error ? "error: " + source.error : "(source unavailable)")));
      } else { const p = document.createElement("p"); p.className = "muted"; p.textContent = "No content-addressed provenance for this entity."; w.appendChild(p); }
      return w;
    } },
  ];
  if (cmds.length) tabs.push({ label: "Commands (" + cmds.length + ")", build: () => {
    const w = document.createElement("div"); w.className = "cmd-list";
    cmds.forEach((c, i) => {
      const lbl = document.createElement("div"); lbl.className = "src-label"; lbl.textContent = (i + 1) + " · commands/" + c.command.slice(0, 10) + "…";
      w.appendChild(lbl); w.appendChild(pre(c.markdown));
    });
    return w;
  } });

  drawerBody.innerHTML = "";
  const strip = document.createElement("div"); strip.className = "drawer-tabs"; strip.setAttribute("role", "tablist");
  const panel = document.createElement("div"); panel.className = "drawer-panel";
  const show = (t, btn) => { strip.querySelectorAll(".dtab").forEach((x) => x.setAttribute("aria-selected", "false")); btn.setAttribute("aria-selected", "true"); panel.innerHTML = ""; panel.appendChild(t.build()); };
  tabs.forEach((t, i) => {
    const b = document.createElement("button"); b.className = "dtab"; b.type = "button"; b.textContent = t.label; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.addEventListener("click", () => show(t, b));
    strip.appendChild(b);
  });
  drawerBody.appendChild(strip); drawerBody.appendChild(panel);
  panel.appendChild(tabs[0].build());
}

function closeDetail() {
  drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); backdrop.hidden = true;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
$("drawerClose").addEventListener("click", closeDetail);
backdrop.addEventListener("click", closeDetail);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("open")) closeDetail(); });

// ---------- live updates ----------
function refreshActive() {
  refreshChanges();
  if (state.tab === "stats") refreshStats();
  if (state.tab === "goals") refreshGoals();
}
function connect() {
  const es = new EventSource("/events");
  es.addEventListener("change", () => refreshActive());
  es.onopen = () => $("pulse").classList.remove("off");
  es.onerror = () => { $("pulse").classList.add("off"); $("syncTxt").textContent = "reconnecting…"; };
}
refreshChanges();
connect();
const initTab = location.hash.slice(1);
if (initTab === "stats" || initTab === "goals") selectTab(initTab);
