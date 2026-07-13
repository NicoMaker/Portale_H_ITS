// Utility DOM condivise tra le pagine: messaggi inline, toast, formattazione

// Messaggio temporaneo dentro un elemento (successo/errore)
export function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.cssText = `padding:.75rem 1rem;border-radius:10px;font-size:.875rem;font-weight:500;margin-top:.75rem;
    background:${type === "success" ? "#f0fdf4" : "#fff5f5"};
    color:${type === "success" ? "#15803d" : "#dc2626"};`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// Toast in basso a destra
export function toast(msg) {
  const t = document.createElement("div");
  t.style.cssText =
    "position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;background:#1e1b4b;color:#e0e7ff;padding:.7rem 1.1rem;border-radius:12px;font-size:.8rem;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none;animation:_toastIn .25s ease;";
  if (!document.getElementById("_toastStyle")) {
    const s = document.createElement("style");
    s.id = "_toastStyle";
    s.textContent =
      "@keyframes _toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(s);
  }
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .35s";
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 350);
  }, 2800);
}

// Data ISO (yyyy-mm-dd) → gg/mm/aaaa
export function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return "-";
  return `${day}/${month}/${year}`;
}

// Evidenzia le occorrenze della query in un testo
export function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<mark class="highlight">$1</mark>',
  );
}

// Normalizza una stringa (rimuove accenti, minuscola) per confronti
export function normalize(str) {
  return str
    ? str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    : "";
}

// Chiude i modali indicati cliccando sull'overlay
export function chiudiModaliSuOverlay(ids, onChiudi = null) {
  window.addEventListener("click", (e) => {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (e.target === el) {
        el.style.display = "none";
        if (onChiudi) onChiudi(id);
      }
    });
  });
}
