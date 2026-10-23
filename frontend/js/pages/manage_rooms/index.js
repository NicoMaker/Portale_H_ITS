// Entry point pagina Gestione Aule
import { roomsApi } from "../../shared/api.js";
import { createCatalogPage } from "../catalog/catalogPage.js";

createCatalogPage({
  api: roomsApi,
  icon: "🏫",
  singolare: "aula",
  genere: "f",
  delNome: "dell'aula",
  unNome: "un'aula",
  singolareMaiuscolo: "Aula",
  etichettaNome: "Aula",
  relation: null,
});
