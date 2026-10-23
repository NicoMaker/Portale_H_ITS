// Entry point pagina Gestione Materie (con i docenti che le insegnano)
import { subjectsApi, teachersApi } from "../../shared/api.js";
import { createCatalogPage } from "../catalog/catalogPage.js";

createCatalogPage({
  api: subjectsApi,
  icon: "📖",
  singolare: "materia",
  genere: "f",
  delNome: "della materia",
  unNome: "una materia",
  singolareMaiuscolo: "Materia",
  etichettaNome: "Materia",
  relation: {
    api: teachersApi,
    idsField: "teacher_ids",
    namesField: "teacher_names",
    sendField: "teacher_ids",
    label: "Docenti che la insegnano",
    icon: "👨‍🏫",
    vuoto: "Nessun docente assegnato",
    filtroPlaceholder: "Tutti i docenti",
    filtroRicerca: "Cerca docente…",
    formPlaceholder: "Seleziona i docenti che la insegnano",
  },
});
