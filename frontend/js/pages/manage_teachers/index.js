// Entry point pagina Gestione Docenti (con le materie che ciascuno insegna)
import { teachersApi, subjectsApi } from "../../shared/api.js";
import { createCatalogPage } from "../catalog/catalogPage.js";

createCatalogPage({
  api: teachersApi,
  icon: "👨‍🏫",
  singolare: "docente",
  genere: "m",
  delNome: "del docente",
  unNome: "un docente",
  singolareMaiuscolo: "Docente",
  etichettaNome: "Docente",
  relation: {
    api: subjectsApi,
    idsField: "subject_ids",
    namesField: "subject_names",
    sendField: "subject_ids",
    label: "Materie insegnate",
    icon: "📖",
    vuoto: "Nessuna materia assegnata",
    filtroPlaceholder: "Tutte le materie",
    filtroRicerca: "Cerca materia…",
    formPlaceholder: "Seleziona le materie insegnate",
  },
});
