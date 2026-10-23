// Selettore multiplo con ricerca interna, senza dipendenze esterne.
//
//   const ms = createMultiSelect(document.getElementById("filter-teacher"), {
//     placeholder: "Tutti i docenti",
//     options: ["Prof. Rossi", { value: 3, label: "Prof. Verdi" }],
//     onChange: (valori) => ...,
//   });
//   ms.getValue()  → array dei valori selezionati (nel tipo originale)
//   ms.setOptions([...])  ms.setValue([...])  ms.clear()  ms.destroy()
//
// Tastiera: Invio/Spazio/↓ aprono; nella ricerca ↑/↓ spostano, Invio seleziona,
// Esc chiude, Tab chiude. Il pannello è nel <body> (portale) così non viene mai
// tagliato da contenitori con overflow nascosto.
import { normalize } from "../shared/dom.js";

let contatore = 0;

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

function evidenzia(label, query) {
  if (!query) return esc(label);
  const idx = normalize(label).indexOf(normalize(query));
  // normalize() può cambiare la lunghezza (accenti): fallback senza evidenziazione
  if (idx < 0 || normalize(label).length !== label.length) return esc(label);
  const fine = idx + query.length;
  return `${esc(label.slice(0, idx))}<mark class="ms-mark">${esc(label.slice(idx, fine))}</mark>${esc(label.slice(fine))}`;
}

function normalizzaOpzioni(opzioni) {
  return opzioni
    .map((o) =>
      typeof o === "object" && o !== null
        ? { value: o.value, label: String(o.label ?? o.value) }
        : { value: o, label: String(o) },
    )
    .filter((o) => o.value !== undefined && o.value !== null && o.label !== "");
}

export function createMultiSelect(host, opts = {}) {
  if (!host) throw new Error("createMultiSelect: contenitore non trovato");
  const id = `ms-${++contatore}`;
  const {
    placeholder = "Tutti",
    searchPlaceholder = "Cerca…",
    emptyText = "Nessun risultato",
    maxChips = 2,
    onChange = () => {},
  } = opts;

  let opzioni = normalizzaOpzioni(opts.options || []);
  let selezionati = []; // chiavi String(value), nell'ordine di selezione
  let query = "";
  let attivo = -1;
  let aperto = false;
  let visibili = [];

  const chiave = (v) => String(v);
  const perChiave = () => new Map(opzioni.map((o) => [chiave(o.value), o]));

  // ── DOM ──
  host.classList.add("ms");
  host.innerHTML = `
    <div class="ms-control" role="combobox" tabindex="0" aria-haspopup="listbox"
         aria-expanded="false" aria-controls="${id}-list"
         ${opts.ariaLabel ? `aria-label="${esc(opts.ariaLabel)}"` : ""}>
      <div class="ms-values"></div>
      <span class="ms-caret" aria-hidden="true">▾</span>
    </div>`;
  const control = host.querySelector(".ms-control");
  const valuesEl = host.querySelector(".ms-values");

  const panel = document.createElement("div");
  panel.className = "ms-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="ms-search-wrap">
      <input type="text" class="ms-search" placeholder="${esc(searchPlaceholder)}"
             autocomplete="off" spellcheck="false" aria-label="${esc(searchPlaceholder)}"
             aria-controls="${id}-list" />
    </div>
    <div class="ms-actions">
      <span class="ms-count"></span>
      <span>
        <button type="button" class="ms-link" data-act="all">Seleziona visibili</button>
        <button type="button" class="ms-link" data-act="none">Pulisci</button>
      </span>
    </div>
    <ul class="ms-list" id="${id}-list" role="listbox" aria-multiselectable="true"></ul>`;
  const search = panel.querySelector(".ms-search");
  const list = panel.querySelector(".ms-list");
  const countEl = panel.querySelector(".ms-count");

  // ── Rendering ──
  function renderControl() {
    const mappa = perChiave();
    const sel = selezionati.map((k) => mappa.get(k)).filter(Boolean);
    host.classList.toggle("ms-has-value", sel.length > 0);
    if (!sel.length) {
      valuesEl.innerHTML = `<span class="ms-placeholder">${esc(placeholder)}</span>`;
    } else {
      const chips = sel
        .slice(0, maxChips)
        .map(
          (o) => `<span class="ms-chip" title="${esc(o.label)}">
            <span class="ms-chip-label">${esc(o.label)}</span>
            <button type="button" class="ms-chip-x" data-key="${esc(chiave(o.value))}"
                    aria-label="Rimuovi ${esc(o.label)}">×</button></span>`,
        )
        .join("");
      const extra =
        sel.length > maxChips
          ? `<span class="ms-chip ms-chip-more" title="${esc(
              sel
                .slice(maxChips)
                .map((o) => o.label)
                .join(", "),
            )}">+${sel.length - maxChips}</span>`
          : "";
      valuesEl.innerHTML = chips + extra;
    }
  }

  function renderList() {
    const q = query.trim();
    visibili = q
      ? opzioni.filter((o) => normalize(o.label).includes(normalize(q)))
      : opzioni.slice();
    if (attivo >= visibili.length) attivo = visibili.length - 1;
    countEl.textContent = selezionati.length
      ? `${selezionati.length} selezionat${selezionati.length === 1 ? "o" : "i"}`
      : `${opzioni.length} opzioni`;
    if (!visibili.length) {
      list.innerHTML = `<li class="ms-empty" role="presentation">${esc(emptyText)}</li>`;
      return;
    }
    const sel = new Set(selezionati);
    list.innerHTML = visibili
      .map((o, i) => {
        const on = sel.has(chiave(o.value));
        return `<li role="option" id="${id}-o${i}" data-i="${i}" aria-selected="${on}"
            class="ms-option${on ? " ms-selected" : ""}${i === attivo ? " ms-active" : ""}">
            <span class="ms-box" aria-hidden="true"></span>
            <span class="ms-text">${evidenzia(o.label, q)}</span></li>`;
      })
      .join("");
    if (attivo >= 0)
      search.setAttribute("aria-activedescendant", `${id}-o${attivo}`);
    else search.removeAttribute("aria-activedescendant");
  }

  function aggiorna() {
    renderControl();
    if (aperto) renderList();
  }

  // ── Posizionamento del pannello ──
  function posiziona() {
    const r = control.getBoundingClientRect();
    const sotto = window.innerHeight - r.bottom;
    const altezza = Math.min(panel.offsetHeight || 320, 340);
    const apriSopra = sotto < altezza + 12 && r.top > sotto;
    panel.style.minWidth = `${r.width}px`;
    panel.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8))}px`;
    panel.style.top = apriSopra
      ? `${Math.max(8, r.top - altezza - 6)}px`
      : `${r.bottom + 6}px`;
  }

  // ── Selezione ──
  function emetti() {
    onChange(getValue());
  }

  function alterna(k) {
    const i = selezionati.indexOf(k);
    if (i >= 0) selezionati.splice(i, 1);
    else selezionati.push(k);
    aggiorna();
    emetti();
  }

  function getValue() {
    const mappa = perChiave();
    return selezionati
      .map((k) => mappa.get(k)?.value)
      .filter((v) => v !== undefined);
  }

  // ── Apertura/chiusura ──
  function apri() {
    if (aperto) return;
    aperto = true;
    query = "";
    search.value = "";
    attivo = -1;
    document.body.appendChild(panel);
    panel.hidden = false;
    control.setAttribute("aria-expanded", "true");
    host.classList.add("ms-open");
    renderList();
    posiziona();
    search.focus({ preventScroll: true });
    document.addEventListener("pointerdown", fuori, true);
    window.addEventListener("resize", posiziona);
    window.addEventListener("scroll", posiziona, true);
  }

  function chiudi(ripristinaFocus = false) {
    if (!aperto) return;
    aperto = false;
    panel.hidden = true;
    panel.remove();
    control.setAttribute("aria-expanded", "false");
    host.classList.remove("ms-open");
    document.removeEventListener("pointerdown", fuori, true);
    window.removeEventListener("resize", posiziona);
    window.removeEventListener("scroll", posiziona, true);
    if (ripristinaFocus) control.focus({ preventScroll: true });
  }

  function fuori(e) {
    if (!host.contains(e.target) && !panel.contains(e.target)) chiudi();
  }

  function muovi(delta) {
    if (!visibili.length) return;
    attivo = (attivo + delta + visibili.length) % visibili.length;
    renderList();
    list.querySelector(".ms-active")?.scrollIntoView({ block: "nearest" });
  }

  // ── Eventi ──
  control.addEventListener("click", (e) => {
    const x = e.target.closest(".ms-chip-x");
    if (x) {
      e.stopPropagation();
      alterna(x.dataset.key);
      return;
    }
    aperto ? chiudi() : apri();
  });

  control.addEventListener("keydown", (e) => {
    if (["Enter", " ", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      apri();
    } else if (e.key === "Backspace" && selezionati.length) {
      alterna(selezionati[selezionati.length - 1]);
    }
  });

  search.addEventListener("input", () => {
    query = search.value;
    attivo = -1;
    renderList(); // ricalcola `visibili`
    attivo = query.trim() && visibili.length ? 0 : -1; // evidenzia il primo risultato
    renderList();
    posiziona();
  });

  search.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      muovi(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (attivo >= 0 && visibili[attivo])
        alterna(chiave(visibili[attivo].value));
    } else if (e.key === "Escape") {
      e.preventDefault();
      chiudi(true);
    } else if (e.key === "Tab") chiudi();
    else if (e.key === "Backspace" && !search.value && selezionati.length) {
      alterna(selezionati[selezionati.length - 1]);
    }
  });

  // mousedown: evita che la ricerca perda il focus
  panel.addEventListener("mousedown", (e) => {
    if (e.target !== search) e.preventDefault();
  });

  list.addEventListener("click", (e) => {
    const li = e.target.closest(".ms-option");
    if (li) alterna(chiave(visibili[Number(li.dataset.i)].value));
  });

  list.addEventListener("mousemove", (e) => {
    const li = e.target.closest(".ms-option");
    if (!li) return;
    const i = Number(li.dataset.i);
    if (i === attivo) return;
    list.querySelector(".ms-active")?.classList.remove("ms-active");
    li.classList.add("ms-active");
    attivo = i;
  });

  panel.querySelector(".ms-actions").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "all") {
      visibili.forEach((o) => {
        if (!selezionati.includes(chiave(o.value)))
          selezionati.push(chiave(o.value));
      });
    } else if (act === "none") {
      selezionati = [];
    } else return;
    aggiorna();
    emetti();
  });

  // ── API pubblica ──
  function setOptions(nuove, { silent = false } = {}) {
    opzioni = normalizzaOpzioni(nuove);
    const validi = new Set(opzioni.map((o) => chiave(o.value)));
    const prima = selezionati.length;
    selezionati = selezionati.filter((k) => validi.has(k));
    aggiorna();
    if (!silent && selezionati.length !== prima) emetti();
  }

  function setValue(valori, { silent = false } = {}) {
    const validi = new Set(opzioni.map((o) => chiave(o.value)));
    selezionati = [...new Set(valori.map(chiave))].filter((k) => validi.has(k));
    aggiorna();
    if (!silent) emetti();
  }

  function clear({ silent = false } = {}) {
    setValue([], { silent });
  }

  function destroy() {
    chiudi();
    host.innerHTML = "";
    host.classList.remove("ms", "ms-has-value", "ms-open");
  }

  renderControl();
  return {
    el: host,
    getValue,
    setOptions,
    setValue,
    clear,
    destroy,
    open: apri,
    close: chiudi,
  };
}
