// Comportamenti dei form: ora di fine automatica, giorno automatico,
// e aggiunta di nuovi docenti/aule/materie alle rispettive tabelle.
import { toast } from "../../shared/dom.js";
import { teachersApi, roomsApi, subjectsApi } from "../../shared/api.js";
import { state, addOneHourToTime, getDayOfWeek } from "./state.js";
import { fetchCatalogs } from "./data.js";

const $ = (id) => document.getElementById(id);

// Imposta l'ora di fine a +1h quando cambia l'inizio (se non modificata a mano)
export function setupAutoEndTime() {
  const collega = (startId, endId) => {
    const start = $(startId);
    const end = $(endId);
    let endModified = false;
    start.addEventListener("change", () => {
      if (!endModified && start.value)
        end.value = addOneHourToTime(start.value);
      endModified = false;
    });
    end.addEventListener("input", () => {
      endModified = true;
    });
  };
  collega("add-start", "add-end");
  collega("edit-start", "edit-end");
}

// Calcola il giorno della settimana dalla data
export function setupAutoDayOfWeek() {
  $("add-date").addEventListener("change", () => {
    $("add-day").value = $("add-date").value
      ? getDayOfWeek($("add-date").value)
      : "";
  });
  $("edit-date").addEventListener("change", () => {
    $("edit-day").textContent = $("edit-date").value
      ? getDayOfWeek($("edit-date").value)
      : "";
  });
}

// Campo del form → anagrafica corrispondente nello stato / sul server
const ANAGRAFICA = {
  teacher: { lista: "teachers", api: teachersApi, etichetta: "Docente" },
  room: { lista: "rooms", api: roomsApi, etichetta: "Aula" },
  subject: { lista: "subjects", api: subjectsApi, etichetta: "Materia" },
};

const chiaveNome = (v) => v.trim().replace(/\s+/g, " ").toLowerCase();

// Mostra il pulsante "+" se il valore digitato non esiste ancora nell'anagrafica
export function toggleAddButtonVisibility(modalType, field) {
  const input = $(`${modalType}-${field}`);
  const button = $(`${modalType}-${field}-btn`);
  const value = chiaveNome(input.value);
  const esiste = state[ANAGRAFICA[field].lista].some(
    (v) => chiaveNome(v.name) === value,
  );
  button.style.display = value && !esiste ? "block" : "none";
}

// Crea il nuovo docente/aula/materia nella sua tabella e lo rende selezionabile
async function handleAdd(field, modalType) {
  const input = $(`${modalType}-${field}`);
  const value = input.value.trim().replace(/\s+/g, " ");
  if (!value) return;
  const { api, etichetta } = ANAGRAFICA[field];
  const esito = await api.crea(value);
  if (!esito.ok) {
    toast(`⚠️ ${esito.errore || `Impossibile aggiungere: ${etichetta.toLowerCase()}`}`);
    return;
  }
  await fetchCatalogs();
  input.value = esito.voce.name;
  toggleAddButtonVisibility(modalType, field);
  toast(`✅ ${etichetta} aggiunto: ${esito.voce.name}`);
}

// Collega i listener dei campi con aggiunta dinamica
export function setupDynamicFields() {
  const campi = ["teacher", "room", "subject"];
  ["add", "edit"].forEach((modalType) => {
    campi.forEach((field) => {
      $(`${modalType}-${field}-btn`).onclick = () => handleAdd(field, modalType);
      $(`${modalType}-${field}`).addEventListener("input", () =>
        toggleAddButtonVisibility(modalType, field),
      );
    });
  });
}
