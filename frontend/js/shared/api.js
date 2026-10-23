// Client API condiviso: tutte le chiamate al backend passano da qui.
// Le API di scrittura ritornano il testo della risposta ("OK" o messaggio d'errore),
// coerentemente con il contratto del backend.

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function postJson(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r;
}

async function postJsonText(url, body) {
  return (await postJson(url, body)).text();
}

export const usersApi = {
  lista: () => getJson("/api/users"),
  crea: (dati) => postJsonText("/api/users", dati),
  modifica: async (id, dati) => {
    const r = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });
    return r.text();
  },
  elimina: (id) => fetch(`/api/users/${id}`, { method: "DELETE" }),
  promuovi: (id) => fetch(`/api/users/${id}/promote`, { method: "POST" }),
  retrocedi: (id) => fetch(`/api/users/${id}/demote`, { method: "POST" }),
  assegnaCorso: (id, courseId) =>
    postJsonText(`/api/users/${id}/assign_course`, { course_id: courseId }),
};

export const coursesApi = {
  lista: () => getJson("/api/courses"),
  crea: (dati) => postJsonText("/api/courses", dati),
  modifica: async (id, dati) => {
    const r = await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });
    return r.text();
  },
  elimina: (id) => fetch(`/api/courses/${id}`, { method: "DELETE" }),
};

export const schedulesApi = {
  lista: () => getJson("/api/schedules"),
  crea: (dati) => postJsonText("/api/schedules", dati),
  modifica: async (id, dati) => {
    const r = await fetch(`/api/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });
    return r.text();
  },
  elimina: (id) => fetch(`/api/schedules/${id}`, { method: "DELETE" }),
};

// Anagrafiche: docenti, aule, materie (ognuna con la propria tabella sul server).
// Docenti e materie portano anche la relazione "chi insegna cosa":
//   teachers → subject_ids / subject_names     subjects → teacher_ids / teacher_names
const catalogoApi = (percorso) => ({
  lista: () => getJson(`/api/${percorso}`),
  // `dati` = { name, subject_ids? | teacher_ids? } (oppure solo il nome come stringa)
  // Ritorna { ok, voce?, errore? }
  crea: async (dati) => {
    const corpo = typeof dati === "string" ? { name: dati } : dati;
    const r = await postJson(`/api/${percorso}`, corpo);
    return r.ok
      ? { ok: true, voce: await r.json() }
      : { ok: false, errore: await r.text() };
  },
  // Ritornano il testo della risposta: "OK" oppure il messaggio d'errore
  modifica: async (id, dati) => {
    const r = await fetch(`/api/${percorso}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });
    return r.text();
  },
  elimina: async (id) =>
    (await fetch(`/api/${percorso}/${id}`, { method: "DELETE" })).text(),
});

export const teachersApi = catalogoApi("teachers");
export const roomsApi = catalogoApi("rooms");
export const subjectsApi = catalogoApi("subjects");

export const userApi = {
  corrente: () => getJson("/user/current"),
  corsi: () => getJson("/user/courses"),
  orari: () => getJson("/user/schedules"),
  // Ritorna { success, message? }
  aggiornaProfilo: async (dati) =>
    (await postJson("/user/profile", dati)).json(),
};

export const statsApi = {
  admin: () => getJson("/admin/stats"),
};
