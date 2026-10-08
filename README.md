# Portale H ITS — v3.0 (modernizzato)

Portale di gestione corsi, utenti e orari per un ITS, con aggiornamenti in tempo reale via Socket.IO. Stesse funzionalità della v1, ma tutto il codice — backend e frontend — è stato diviso in componenti con una sola responsabilità ciascuno.

## Avvio

```bash
cd backend
npm install
npm start          # oppure: npm run dev (nodemon)
npm run seed       # (opzionale) popola il database con dati di esempio
```

Al primo avvio viene creato l'admin predefinito: **Admin / Admin123!**. Il database SQLite è generato in `backend/db/database.db`.

## Novità della v3.0

- **Sicurezza sessioni**: cookie `sid` con `SameSite=Lax`, `Secure` in produzione (`NODE_ENV=production`) e scadenza a 8 ore; le sessioni scadute vengono ripulite in automatico.
- **Socket.IO**: il `sid` viene letto dal cookie `httpOnly` nell'handshake. Il cookie `sid_client` leggibile da JavaScript è stato rimosso.
- **Header di sicurezza** di base (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) e `x-powered-by` disattivato.
- **Chiusura ordinata** del server su `SIGINT`/`SIGTERM` e gestione degli errori di avvio.
- **Pulizia repository**: rimossi i vecchi `backend/routes`, `backend/configuration` e il riferimento a `js/tailwind.js` (file inesistente). Lo schema ER si trova ora in `docs/Schema/`.
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
    │   └── sessionService.js    → sessioni in-memory
    ├── repositories/            → unico punto di accesso al DB (tutto l'SQL)
    │   ├── usersRepository.js
    │   ├── coursesRepository.js
    │   ├── schedulesRepository.js
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
├── realtime/
│   └── socket-client.js         → client Socket.IO globale (window.AppSocket)
└── pages/                       → una cartella per pagina, un file per responsabilità
    ├── admin_dashboard/         → stats · editProfile · uiEffects · index
    ├── manage_users/            → state · data · render · modals · index
    ├── manage_courses/          → state · filters · render · modals · index
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
- `GET /admin/stats`, `GET /admin/analytics`
