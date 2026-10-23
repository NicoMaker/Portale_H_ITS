// Pagina generica di gestione di un'anagrafica (docenti, aule, materie).
// Le tre pagine differiscono solo per la configurazione: elenco, ricerca, filtro
// per relazione (chi insegna cosa), aggiunta, modifica ed eliminazione.
import { toast, normalize } from "../../shared/dom.js";
import { createMultiSelect } from "../../components/MultiSelect.js";

const $ = (id) => document.getElementById(id);

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// config = {
//   api,                       // teachersApi | roomsApi | subjectsApi
//   singolare, singolareMaiuscolo, genere ("m"|"f"), delNome ("del docente"), unNome ("un docente")
//   relation: null | {         // relazione N:N con un'altra anagrafica
//     api, idsField, namesField, sendField,
//     label, labelSingolare, vuoto, icon, singolareOpt
//   }
// }
export function createCatalogPage(config) {
  const { api, relation } = config;
  const o = config.genere === "f" ? "a" : "o";
  const stato = {
    voci: [],
    relOpzioni: [], // [{ id, name }] dell'anagrafica collegata
    editingId: null,
    deletingId: null,
    relFiltro: null, // MultiSelect del filtro per relazione
    relForm: null, // MultiSelect nel form
  };

  // ── Caricamento ──
  async function carica() {
    const [voci, rel] = await Promise.all([
      api.lista(),
      relation ? relation.api.lista() : Promise.resolve([]),
    ]);
    stato.voci = voci;
    stato.relOpzioni = rel;
    if (relation) {
      const opzioni = rel.map((r) => ({ value: r.id, label: r.name }));
      stato.relFiltro.setOptions(opzioni, { silent: true });
      stato.relForm.setOptions(opzioni, { silent: true });
    }
    render();
  }

  // ── Filtri ──
  function filtrate() {
    const q = normalize($("search").value.trim());
    const rels = relation
      ? new Set(stato.relFiltro.getValue().map(Number))
      : new Set();
    const soloSenza = $("only-empty")?.checked;
    return stato.voci.filter((v) => {
      if (q) {
        const nomi = relation ? v[relation.namesField] : [];
        const testo = normalize([v.name, ...nomi].join(" "));
        if (!testo.includes(q)) return false;
      }
      if (rels.size && !v[relation.idsField].some((id) => rels.has(id)))
        return false;
      if (soloSenza && relation && v[relation.idsField].length) return false;
      return true;
    });
  }

  // ── Rendering ──
  function render() {
    const lista = filtrate();
    const tutte = stato.voci;
    const set = (id, v) => {
      const el = $(id);
      if (el) el.textContent = v;
    };
    set("stat-total", tutte.length);
    set("stat-used", tutte.filter((v) => v.schedules_count > 0).length);
    set("stat-unused", tutte.filter((v) => v.schedules_count === 0).length);
    if (relation) {
      set("stat-empty", tutte.filter((v) => !v[relation.idsField].length).length);
    }
    set("stat-shown", lista.length);

    const q = $("search").value.trim();
    const cont = $("list");
    if (!lista.length) {
      cont.innerHTML = `<div class="p-12 text-center">
        <div class="text-5xl mb-3">${config.icon}</div>
        <p class="font-bold text-gray-700">Nessun risultato</p>
        <p class="text-sm text-gray-400">${tutte.length ? "Modifica la ricerca o i filtri." : `Aggiungi ${config.unNome} con il pulsante in alto.`}</p>
      </div>`;
      return;
    }

    const th = (t, al = "left") =>
      `<th class="px-4 py-3 text-${al} text-xs font-bold uppercase tracking-wider text-indigo-600 whitespace-nowrap">${t}</th>`;

    const evid = (testo) => {
      const e = esc(testo);
      if (!q) return e;
      const idx = normalize(testo).indexOf(normalize(q));
      if (idx < 0 || normalize(testo).length !== testo.length) return e;
      const fine = idx + q.length;
      return `${esc(testo.slice(0, idx))}<mark class="highlight">${esc(testo.slice(idx, fine))}</mark>${esc(testo.slice(fine))}`;
    };

    const righe = lista
      .map((v) => {
        const chips = relation
          ? v[relation.namesField].length
            ? v[relation.namesField]
                .map(
                  (n) =>
                    `<span class="inline-block bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">${evid(n)}</span>`,
                )
                .join(" ")
            : `<span class="text-xs text-amber-600 font-medium">⚠️ ${esc(relation.vuoto)}</span>`
          : "";
        const n = v.schedules_count;
        return `<tr class="border-b border-gray-100 hover:bg-gray-50 align-top">
          <td class="px-4 py-3 font-semibold text-gray-900">${evid(v.name)}</td>
          ${relation ? `<td class="px-4 py-3"><div class="flex flex-wrap gap-1.5 max-w-xl">${chips}</div></td>` : ""}
          <td class="px-4 py-3"><span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold ${n ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}">${n} ${n === 1 ? "orario" : "orari"}</span></td>
          <td class="px-4 py-3 text-center whitespace-nowrap">
            <button data-act="edit" data-id="${v.id}" title="Modifica" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition">✏️</button>
            <button data-act="delete" data-id="${v.id}" title="Elimina" class="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition">🗑️</button>
          </td>
        </tr>`;
      })
      .join("");

    cont.innerHTML = `<div class="overflow-x-auto"><table class="w-full border-collapse">
      <thead><tr class="bg-gradient-to-r from-indigo-50 to-sky-50 border-b-2 border-indigo-100">
        ${th(`${config.icon} ${config.etichettaNome}`)}
        ${relation ? th(`${relation.icon} ${relation.label}`) : ""}
        ${th("📅 Utilizzo")}${th("⚙️ Azioni", "center")}
      </tr></thead><tbody>${righe}</tbody></table></div>`;
  }

  // ── Modale aggiungi / modifica ──
  function messaggio(id, testo, ok) {
    const el = $(id);
    el.textContent = testo;
    el.className = testo
      ? `mt-4 p-3 rounded-lg text-sm ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`
      : "hidden";
  }

  function apriForm(voce = null) {
    stato.editingId = voce ? voce.id : null;
    $("form-title").textContent = voce
      ? `✏️ Modifica ${config.singolare}`
      : `➕ Aggiungi ${config.singolare}`;
    $("form-submit").textContent = voce ? "Salva modifiche" : "Aggiungi";
    $("form-name").value = voce ? voce.name : "";
    if (relation) stato.relForm.setValue(voce ? voce[relation.idsField] : [], { silent: true });
    messaggio("form-msg", "", true);
    $("form-modal").style.display = "flex";
    $("form-name").focus();
  }

  function chiudi(id) {
    $(id).style.display = "none";
  }

  async function inviaForm(e) {
    e.preventDefault();
    const dati = { name: $("form-name").value.trim() };
    if (!dati.name) return messaggio("form-msg", `Inserisci il nome ${config.delNome}.`, false);
    if (relation) dati[relation.sendField] = stato.relForm.getValue();

    if (stato.editingId) {
      const esito = await api.modifica(stato.editingId, dati);
      if (esito !== "OK") return messaggio("form-msg", esito, false);
      toast(`✅ ${config.singolareMaiuscolo} aggiornat${o}`);
    } else {
      const esito = await api.crea(dati);
      if (!esito.ok) return messaggio("form-msg", esito.errore, false);
      if (!esito.voce.creato) {
        return messaggio("form-msg", `Esiste già ${config.unNome} con questo nome.`, false);
      }
      toast(`✅ ${config.singolareMaiuscolo} aggiunt${o}`);
    }
    chiudi("form-modal");
    await carica();
  }

  // ── Eliminazione ──
  function apriElimina(voce) {
    stato.deletingId = voce.id;
    $("delete-name").textContent = voce.name;
    const n = voce.schedules_count;
    messaggio(
      "delete-msg",
      n
        ? `Attenzione: è usato in ${n} ${n === 1 ? "orario" : "orari"}, quindi non potrà essere eliminato finché esistono.`
        : "",
      false,
    );
    $("delete-modal").style.display = "flex";
  }

  async function confermaElimina() {
    const esito = await api.elimina(stato.deletingId);
    if (esito !== "OK") return messaggio("delete-msg", esito, false);
    chiudi("delete-modal");
    toast(`🗑️ ${config.singolareMaiuscolo} eliminat${o}`);
    await carica();
  }

  // ── Avvio ──
  function avvia() {
    if (relation) {
      stato.relFiltro = createMultiSelect($("filter-relation"), {
        placeholder: relation.filtroPlaceholder,
        searchPlaceholder: relation.filtroRicerca,
        ariaLabel: relation.filtroPlaceholder,
        onChange: render,
      });
      stato.relForm = createMultiSelect($("form-relation"), {
        placeholder: relation.formPlaceholder,
        searchPlaceholder: relation.filtroRicerca,
        ariaLabel: relation.label,
        maxChips: 3,
      });
    }

    $("search").addEventListener("input", render);
    $("only-empty")?.addEventListener("change", render);
    $("clear-filters-btn").addEventListener("click", () => {
      $("search").value = "";
      if ($("only-empty")) $("only-empty").checked = false;
      stato.relFiltro?.clear({ silent: true });
      render();
    });

    $("add-btn").addEventListener("click", () => apriForm());
    $("form").addEventListener("submit", inviaForm);
    $("form-cancel").addEventListener("click", () => chiudi("form-modal"));
    $("form-close").addEventListener("click", () => chiudi("form-modal"));
    $("delete-cancel").addEventListener("click", () => chiudi("delete-modal"));
    $("delete-close").addEventListener("click", () => chiudi("delete-modal"));
    $("delete-confirm").addEventListener("click", confermaElimina);

    window.addEventListener("click", (e) => {
      if (e.target === $("form-modal")) chiudi("form-modal");
      if (e.target === $("delete-modal")) chiudi("delete-modal");
    });

    $("list").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b) return;
      const voce = stato.voci.find((v) => v.id === Number(b.dataset.id));
      if (!voce) return;
      if (b.dataset.act === "edit") apriForm(voce);
      else apriElimina(voce);
    });

    if (window.AppSocket) {
      ["catalog_updated", "schedules_updated"].forEach((ev) =>
        AppSocket.on(ev, carica),
      );
    }
    carica().catch((err) => {
      console.error(err);
      $("list").innerHTML = `<p class="p-8 text-center text-red-600">Errore nel caricamento dei dati.</p>`;
    });
  }

  document.addEventListener("DOMContentLoaded", avvia);
}
