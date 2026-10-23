// Componente: gruppo di selettori multipli con ricerca, definiti da una configurazione.
// Usato da Gestione Orari e dalla dashboard utente per evitare codice duplicato.
//
//   const gruppo = createFilterGroup(
//     { teacher: { host: "filter-teacher", placeholder: "Tutti i docenti", search: "Cerca docente…", label: "Filtra per docente" } },
//     onChange,
//   );
//   gruppo.setOptions({ teacher: [{ value: 1, label: "Prof. Rossi" }] });  // mantiene le selezioni valide
//   gruppo.values("teacher")  → Set di stringhe (o trasformate con il 2° argomento)
//   gruppo.clear()
import { createMultiSelect } from "./MultiSelect.js";

export function createFilterGroup(config, onChange = () => {}) {
  const controls = {};
  for (const [chiave, c] of Object.entries(config)) {
    controls[chiave] = createMultiSelect(document.getElementById(c.host), {
      placeholder: c.placeholder,
      searchPlaceholder: c.search,
      ariaLabel: c.label,
      onChange,
    });
  }

  return {
    controls,
    setOptions(opzioniPerChiave) {
      for (const [chiave, opzioni] of Object.entries(opzioniPerChiave)) {
        controls[chiave]?.setOptions(opzioni, { silent: true });
      }
    },
    values(chiave, trasforma = String) {
      return new Set((controls[chiave]?.getValue() || []).map(trasforma));
    },
    clear() {
      Object.values(controls).forEach((ms) => ms.clear({ silent: true }));
    },
  };
}
