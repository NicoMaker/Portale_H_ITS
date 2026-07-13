// Regole password condivise: 8+ caratteri, maiuscola, minuscola, numero

export function requisitiMancanti(valore) {
  const missing = [];
  if (valore.length < 8) missing.push("8+ caratteri");
  if (!/[A-Z]/.test(valore)) missing.push("maiuscola");
  if (!/[a-z]/.test(valore)) missing.push("minuscola");
  if (!/[0-9]/.test(valore)) missing.push("numero");
  return missing;
}

export function passwordValida(valore) {
  return requisitiMancanti(valore).length === 0;
}

// Collega la validazione live a un input, aggiornando l'hint testuale
export function collegaHintPassword(input, hintEl) {
  input.addEventListener("input", () => {
    const missing = requisitiMancanti(input.value);
    hintEl.textContent = missing.length
      ? `Mancano: ${missing.join(", ")}`
      : "✓ Password valida";
    hintEl.style.color = missing.length ? "#ef4444" : "#16a34a";
  });
}
