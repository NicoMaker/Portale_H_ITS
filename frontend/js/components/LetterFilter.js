// Componente: filtro per lettera iniziale a selezione multipla (A–Z + «Tutti»).
//   const lf = createLetterFilter(host, { onChange: (setLettere) => ... });
//   lf.getValue() → Set di lettere (vuoto = tutte)   lf.clear({ silent })
// Clic su una lettera: la aggiunge/toglie. «Tutti» azzera la selezione.
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function createLetterFilter(
  host,
  { onChange = () => {}, lettere = ALFABETO } = {},
) {
  if (!host) throw new Error("createLetterFilter: contenitore non trovato");
  const selezionate = new Set();

  host.setAttribute("role", "group");
  host.innerHTML =
    `<button type="button" class="letter-btn letter-all" data-letter="" style="width:auto;padding:0 .6rem">Tutti</button>` +
    lettere
      .map(
        (l) =>
          `<button type="button" class="letter-btn" data-letter="${l}">${l}</button>`,
      )
      .join("");

  function sync() {
    host.querySelectorAll(".letter-btn").forEach((btn) => {
      const attivo = btn.dataset.letter
        ? selezionate.has(btn.dataset.letter)
        : selezionate.size === 0;
      btn.classList.toggle("active", attivo);
      btn.setAttribute("aria-pressed", String(attivo));
    });
  }

  host.addEventListener("click", (e) => {
    const btn = e.target.closest(".letter-btn");
    if (!btn) return;
    const l = btn.dataset.letter;
    if (!l) selezionate.clear();
    else if (selezionate.has(l)) selezionate.delete(l);
    else selezionate.add(l);
    sync();
    onChange(new Set(selezionate));
  });

  sync();
  return {
    getValue: () => new Set(selezionate),
    clear({ silent = false } = {}) {
      selezionate.clear();
      sync();
      if (!silent) onChange(new Set());
    },
  };
}
