// Funzione per formattare una data ISO in formato gg/mm/aaaa
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
