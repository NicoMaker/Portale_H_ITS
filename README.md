# Portale H ITS — v3.2

Portale di gestione corsi, utenti e orari per un ITS, con aggiornamenti in tempo reale via Socket.IO. Stesse funzionalità della v1, ma tutto il codice — backend e frontend — è stato diviso in componenti con una sola responsabilità ciascuno.

## Avvio

```bash
cd backend
npm install
npm start          # oppure: npm run dev (nodemon)
npm run seed       # (opzionale) popola il database con dati di esempio (interattivo)
```

Seed non interattivo: `node src/scripts/seed.js --defaults` oppure con parametri
`--admins=2 --enrolled=40 --unenrolled=10 --courses-with=4 --courses-without=2 --per-course=15 [--year=2026]`.

Al primo avvio viene creato l'admin predefinito: **Admin / Admin123!**. Il database SQLite è generato in `backend/db/database.db`.

## Novità della v3.2

- **Pagine separate per ogni anagrafica**: oltre a Utenti, Corsi e Orari ci sono ora **Gestione Docenti** (`manage_teachers.html`), **Gestione Materie** (`manage_subjects.html`) e **Gestione Aule** (`manage_rooms.html`), ciascuna con ricerca, filtri, aggiunta, modifica ed eliminazione. La barra di navigazione e la dashboard admin le raggiungono tutte.
- **Chi insegna cosa**: nuova tabella `teacher_subjects` (relazione N:N docente ↔ materia). In *Gestione Materie* si scelgono i docenti che la insegnano; in *Gestione Docenti* si vedono (e si possono modificare) le materie di ciascun docente. Entrambe le pagine mostrano la relazione e permettono di filtrarla.
- **Form orari intelligenti**: materia e docente sono selettori collegati. Scegliendo la materia compaiono solo i docenti che la insegnano (e se ce n'è uno solo si compila da solo); scegliendo il docente compaiono solo le sue materie (se ne ha una sola si compila da sola). Il backend rifiuta le combinazioni non coerenti.
- **Regole di integrità**: non si elimina un docente/aula/materia usato in almeno un orario, e non si toglie l'associazione docente ↔ materia se esistono orari che la usano.
- **Migrazione automatica**: sui database esistenti `teacher_subjects` viene popolata dalle coppie docente/materia già presenti negli orari.
- **Seed**: assegna a ogni materia 1–3 docenti e crea gli orari solo con docenti che la insegnano.
- Nuove API (solo admin): `PUT/DELETE /api/teachers/:id`, `/api/rooms/:id`, `/api/subjects/:id`. `POST/PUT` di docenti accettano `subject_ids`, quelle di materie `teacher_ids`. Gli orari accettano `teacher_id`, `room_id`, `subject_id` (i nomi restano supportati).

## Novità della v3.1

- **Anagrafiche in tabelle proprie**: `teachers`, `rooms` e `subjects` (nome unico, senza distinzione maiuscole/minuscole). `schedules` le referenzia con `teacher_id`, `room_id`, `subject_id`; la data resta solo in `schedules` e il giorno è ricavato dalla data dal server.
- **Migrazione automatica**: al primo avvio un database vecchio (con docente/aula/materia come testo) viene convertito senza perdere orari.
- **Nuove API** (solo admin): `GET/POST /api/teachers`, `/api/rooms`, `/api/subjects`. Le API orari accettano ancora i nomi e creano al volo le voci mancanti.
- **Selettori con ricerca e selezione multipla** (`frontend/js/components/MultiSelect.js`, senza dipendenze da CDN) in Gestione Orari e nella dashboard utente.
- **Gestione Corsi**: la lettera iniziale è a selezione multipla (clic per aggiungere/togliere, «Tutti» azzera).
- **Seed**: usa le nuove tabelle, evita nomi duplicati, calcola i festivi dell'anno corrente e funziona anche da riga di comando.
- Schema ER aggiornato in `backend/Schema/` (`Schema.mmd` e `Schema.png`).

## Novità della v3.0

- **Sicurezza sessioni**: cookie `sid` con `SameSite=Lax`, `Secure` in produzione (`NODE_ENV=production`) e scadenza a 8 ore; le sessioni scadute vengono ripulite in automatico.
- **Socket.IO**: il `sid` viene letto dal cookie `httpOnly` nell'handshake. Il cookie `sid_client` leggibile da JavaScript è stato rimosso.
- **Header di sicurezza** di base (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) e `x-powered-by` disattivato.
- **Chiusura ordinata** del server su `SIGINT`/`SIGTERM` e gestione degli errori di avvio.
- **Pulizia repository**: rimossi i vecchi `backend/routes`, `backend/configuration` e il riferimento a `js/tailwind.js` (file inesistente). Lo schema ER si trova in `backend/Schema/`.
- **Tema**: nuovo `frontend/CSS/theme.css` con modalità scura automatica, focus da tastiera visibile e rispetto di `prefers-reduced-motion`.
- **Dipendenze** aggiornate; `nodemon` spostato in `devDependencies`; Node ≥ 20.

> Nota: le sessioni restano in memoria, quindi un riavvio del server le azzera. Per più istanze serve uno store condiviso (es. Redis).

## Architettura backend

Flusso di ogni richiesta: **route → controller → service → repository → DB**. Nessun layer scavalca quello sotto.

```
backend/
├── server.js                    → entry point: DB + Socket.IO + HTTP
└── src/
    ├── app.js                   → composizione Express
    ├── config/
    │   ├── database.js          → connessione SQLite + helper Promise (get/all/run)
    │   └── schema.js            → tabelle, migrazioni, admin predefinito
    ├── scripts/
    │   └── seed.js              → popolamento dati di esempio
    ├── routes/                  → solo mappatura URL → controller
    │   ├── index.js             → aggregatore
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── courseRoutes.js
    │   ├── scheduleRoutes.js
    │   └── dashboardRoutes.js
    ├── controllers/             → traducono HTTP ⇄ service (niente logica)
    ├── services/                → regole di business e validazione
    │   ├── authService.js
    │   ├── usersService.js
    │   ├── coursesService.js
    │   ├── schedulesService.js
    │   ├── catalogService.js
    │   └── sessionService.js    → sessioni in-memory
    ├── repositories/            → unico punto di accesso al DB (tutto l'SQL)
    │   ├── usersRepository.js
    │   ├── coursesRepository.js
    │   ├── schedulesRepository.js
    │   ├── catalogRepository.js → teachers / rooms / subjects / teacher_subjects
    │   └── statsRepository.js
    ├── middleware/
    │   ├── auth.js              → requireAdmin / requireUser / requireAuth
    │   └── errorHandler.js      → HttpError + catchErrors + handler centrale
    ├── realtime/
    │   └── socket.js           → unico modulo che conosce Socket.IO (broadcast, forceLogout)
    └── utils/
        └── network.js          → IP locale/pubblico, health check
```

Punti chiave del refactor:

- Tutte le query SQL vivono solo nei **repository**. Cambiare tabella significa toccare un file solo.
- La logica "ultimo admin non eliminabile", il force-logout su cambio credenziali/ruolo e gli eventi realtime stanno nei **service**, non sparsi nelle route.
- Socket.IO è isolato in `realtime/socket.js`: i service chiamano `broadcast()` / `forceLogout()` senza sapere come funziona il trasporto.
- Gli errori si sollevano come `HttpError(status, messaggio)` e vengono formattati in un unico posto.

## Architettura frontend

Moduli ES nativi (nessun build step). Ogni pagina HTML carica un solo entry point con `<script type="module">`.

```
frontend/js/
├── shared/                      → riusato da tutte le pagine
│   ├── api.js                   → tutte le fetch verso il backend
│   ├── dom.js                   → toast, messaggi, formato date, highlight
│   └── password.js              → regole password condivise
├── components/                  → componenti UI riusabili (nessuna dipendenza esterna)
│   ├── MultiSelect.js           → selettore multiplo con ricerca
│   ├── FilterGroup.js           → gruppo di MultiSelect da configurazione
│   └── LetterFilter.js          → filtro A–Z a selezione multipla
├── realtime/
│   └── socket-client.js         → client Socket.IO globale (window.AppSocket)
└── pages/                       → una cartella per pagina, un file per responsabilità
    ├── admin_dashboard/         → stats · editProfile · uiEffects · index
    ├── manage_users/            → state · data · render · modals · index
    ├── manage_courses/          → state · filters · render · modals · index
    ├── catalog/                 → catalogPage.js: pagina generica delle anagrafiche
    ├── manage_teachers/ · manage_subjects/ · manage_rooms/ → index (solo configurazione)
    ├── manage_schedules/        → state · data · filters · render · formHelpers · modals · index
    └── user_dashboard/          → state · filters · render · editProfile · index
```

Ogni pagina segue lo stesso schema: `state` (dati) → `data`/`filters` (logica) → `render` (DOM) → `modals` (dialog) → `index` (collega tutto e avvia). Gli handler richiamati dagli `onclick` inline generati nelle tabelle vengono esposti su `window` solo nell'entry point.

## Tempo reale

Il client apre una connessione Socket.IO e si registra con il proprio identificativo di sessione. Il backend emette eventi (`users_updated`, `courses_updated`, `schedules_updated`, `schedule_updated`) quando i dati cambiano, e le pagine si aggiornano da sole. Su cambio di credenziali o ruolo il server invia un `force_logout` mirato alla sessione interessata.

## API principali (invariate)

- `POST /login`, `GET /logout`, `GET /api/session`
- `GET /user/current`, `POST /user/profile`, `GET /user/courses`, `GET /user/schedules`
- `GET/POST /api/users`, `PUT/DELETE /api/users/:id`, `POST /api/users/:id/{promote,demote,assign_course,edit}`
- `GET/POST /api/courses`, `PUT/DELETE /api/courses/:id`
- `GET/POST /api/schedules`, `PUT/DELETE /api/schedules/:id`, `GET /api/schedules/meta`
- `GET/POST /api/teachers`, `/api/rooms`, `/api/subjects` · `PUT/DELETE /api/{teachers|rooms|subjects}/:id`
- `GET /admin/stats`, `GET /admin/analytics`
