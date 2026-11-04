// Eliminazione multipla condivisa: checkbox sulle righe, "seleziona tutti",
// barra "Elimina selezionati" e riepilogo finale. Vengono eliminati solo gli
// elementi eliminabili; gli altri vengono saltati e mostrati con il motivo.
//
// Uso (in ogni pagina):
//   registerBulk("courses", { endpoint, singolare, plurale, anchor, onDone })
//   bulkCell("courses", id)      → <td> con checkbox da mettere nella riga
//   bulkAfterRender("courses")   → da chiamare dopo ogni render della tabella

const registry = {};

const esc = (t) =>
  String(t).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const CB_STYLE = "width:16px;height:16px;cursor:pointer;accent-color:#ef4444;";

export function registerBulk(entity, cfg) {
  registry[entity] = cfg;
  const anchor = cfg.anchor();
  if (!anchor || document.getElementById(`bulkToolbar-${entity}`)) return;

  const bar = document.createElement("div");
  bar.id = `bulkToolbar-${entity}`;
  bar.style.cssText =
    "display:none;align-items:center;gap:.6rem;flex-wrap:wrap;margin:0 0 .75rem;padding:.6rem 1rem;border-radius:12px;background:#fef2f2;border:1px solid #fecaca;";
  bar.innerHTML = `
    <span id="bulkCount-${entity}" style="font-weight:700;font-size:.875rem;color:#374151;margin-right:auto;"></span>
    <button type="button" onclick="bulkDelete('${entity}')"
      style="padding:.45rem .9rem;border:none;border-radius:8px;background:#ef4444;color:#fff;font-weight:600;font-size:.8rem;cursor:pointer;">🗑️ Elimina selezionati</button>
    <button type="button" onclick="bulkClear('${entity}')"
      style="padding:.45rem .9rem;border:1.5px solid #e5e7eb;border-radius:8px;background:#fff;color:#6b7280;font-weight:600;font-size:.8rem;cursor:pointer;">✕ Deseleziona</button>`;
  anchor.parentNode.insertBefore(bar, anchor);
}

// <th> con "seleziona tutti" (per tabelle generate via JS)
export function bulkHeaderCell(entity) {
  return `<th style="padding:.75rem 1rem;width:40px;text-align:center;"><input type="checkbox" id="bulkAll-${entity}" onchange="bulkToggleAll('${entity}', this)" title="Seleziona tutti" style="${CB_STYLE}"></th>`;
}

// <td> con checkbox da inserire come prima cella di ogni riga
export function bulkCell(entity, id) {
  return `<td style="padding:.75rem 1rem;width:40px;text-align:center;"><input type="checkbox" class="bulk-cb" data-entity="${entity}" data-id="${id}" onchange="bulkUpdateToolbar('${entity}')" title="Seleziona" style="${CB_STYLE}"></td>`;
}

const selected = (entity) =>
  Array.from(
    document.querySelectorAll(`.bulk-cb[data-entity="${entity}"]:checked`),
  ).map((cb) => parseInt(cb.dataset.id));

export function bulkUpdateToolbar(entity) {
  const bar = document.getElementById(`bulkToolbar-${entity}`);
  const count = document.getElementById(`bulkCount-${entity}`);
  const all = document.getElementById(`bulkAll-${entity}`);
  const boxes = document.querySelectorAll(`.bulk-cb[data-entity="${entity}"]`);
  const n = selected(entity).length;
  if (bar) bar.style.display = n > 0 ? "flex" : "none";
  if (count)
    count.textContent = n + (n === 1 ? " selezionato" : " selezionati");
  if (all) {
    all.checked = n > 0 && n === boxes.length;
    all.indeterminate = n > 0 && n < boxes.length;
  }
}

export function bulkAfterRender(entity) {
  bulkUpdateToolbar(entity);
}

export function bulkToggleAll(entity, source) {
  document
    .querySelectorAll(`.bulk-cb[data-entity="${entity}"]`)
    .forEach((cb) => (cb.checked = source.checked));
  bulkUpdateToolbar(entity);
}

export function bulkClear(entity) {
  document
    .querySelectorAll(`.bulk-cb[data-entity="${entity}"]`)
    .forEach((cb) => (cb.checked = false));
  bulkUpdateToolbar(entity);
}

// Modale generico (conferma o riepilogo). Ritorna una Promise<boolean>.
function modal({ title, html, conferma }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:10000;background:rgba(17,24,39,.5);display:flex;align-items:center;justify-content:center;padding:1rem;";
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;max-width:460px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,.3);overflow:hidden;">
        <div style="padding:1rem 1.25rem;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:1rem;color:#111827;">${esc(title)}</div>
        <div style="padding:1.25rem;font-size:.9rem;line-height:1.6;color:#374151;max-height:60vh;overflow:auto;">${html}</div>
        <div style="padding:.9rem 1.25rem;border-top:1px solid #f3f4f6;display:flex;gap:.6rem;justify-content:flex-end;">
          ${conferma ? `<button data-r="0" style="padding:.5rem 1.1rem;border:1.5px solid #e5e7eb;border-radius:8px;background:#fff;color:#6b7280;font-weight:600;cursor:pointer;">Annulla</button>` : ""}
          <button data-r="1" style="padding:.5rem 1.1rem;border:none;border-radius:8px;background:${conferma ? "#ef4444" : "#4f46e5"};color:#fff;font-weight:600;cursor:pointer;">${conferma ? "Conferma" : "OK"}</button>
        </div>
      </div>`;
    const chiudi = (v) => {
      overlay.remove();
      resolve(v);
    };
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) chiudi(false);
      const r = e.target.dataset?.r;
      if (r !== undefined) chiudi(r === "1");
    });
    document.body.appendChild(overlay);
  });
}

export async function bulkDelete(entity) {
  const cfg = registry[entity];
  const ids = selected(entity);
  if (!cfg || ids.length === 0) return;

  const nome = ids.length === 1 ? cfg.singolare : cfg.plurale;
  const ok = await modal({
    title: `Elimina ${cfg.plurale}`,
    html:
      `Stai per eliminare <strong>${ids.length}</strong> ${nome}.` +
      (cfg.avviso ? `<br><br>${cfg.avviso}` : "") +
      `<br><br>Verranno eliminati solo quelli eliminabili: gli altri verranno saltati.<br>Confermi?`,
    conferma: true,
  });
  if (!ok) return;

  try {
    const res = await fetch(`${cfg.endpoint}/elimina-multiple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error((await res.text()) || "Errore eliminazione");
    const data = await res.json();

    const n = data.eliminati.length;
    const k = data.saltati.length;
    let html = "";
    if (n > 0)
      html += `<div>✅ Eliminati <strong>${n}</strong> ${n === 1 ? cfg.singolare : cfg.plurale}.</div>`;
    if (k > 0) {
      html += `<div style="margin-top:.6rem;">⚠️ <strong>${k}</strong> non eliminabil${k === 1 ? "e" : "i"}:</div><ul style="margin:.4rem 0 0 1.1rem;list-style:disc;">`;
      html += data.saltati
        .map(
          (s) => `<li><strong>${esc(s.nome)}</strong> — ${esc(s.motivo)}</li>`,
        )
        .join("");
      html += "</ul>";
    }
    bulkClear(entity);
    if (typeof cfg.onDone === "function") await cfg.onDone();
    await modal({ title: "Eliminazione multipla", html, conferma: false });
  } catch (err) {
    await modal({
      title: "Errore",
      html: `❌ ${esc(err.message)}`,
      conferma: false,
    });
  }
}

// Gli onclick/onchange inline delle righe richiedono funzioni globali
window.bulkUpdateToolbar = bulkUpdateToolbar;
window.bulkToggleAll = bulkToggleAll;
window.bulkClear = bulkClear;
window.bulkDelete = bulkDelete;
