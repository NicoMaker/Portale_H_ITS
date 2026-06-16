# 📚 Course Management App — v2.0

## 🚀 Novità v2.0 — Real-time & Forced Logout

### Socket.IO integrato

Tutte le pagine admin e utente sono connesse via WebSocket. Ogni modifica si propaga automaticamente a tutte le sessioni aperte senza bisogno di refresh manuale:

| Evento                                   | Chi riceve                                                   |
| ---------------------------------------- | ------------------------------------------------------------ |
| Utente creato / modificato / eliminato   | Tutti gli admin su `manage_users`                            |
| Ruolo cambiato (promote/demote)          | Tutti gli admin + **logout forzato** dell'utente interessato |
| Credenziali cambiate (username/password) | Tutti gli admin + **logout forzato** dell'utente interessato |
| Utente eliminato                         | Tutti gli admin + **logout forzato** dell'utente eliminato   |
| Corso creato/modificato/eliminato        | Tutti gli admin su `manage_courses` + utenti interessati     |
| Orario creato/modificato/eliminato       | Tutti gli admin + utenti interessati (refresh automatico)    |
| Corso riassegnato a un utente            | L'utente vede i nuovi orari in tempo reale                   |

### Logout forzato

Quando un admin:

- **modifica username o password** di un utente → quell'utente vede un banner rosso e viene reindirizzato al login
- **promuove o retrocede** un utente → logout forzato (deve ri-loginare col nuovo ruolo)
- **elimina** un utente → logout forzato immediato
- Un utente **modifica il proprio profilo** → logout forzato (deve ri-loginare con le nuove credenziali)

## ⚙️ Installazione

```bash
cd backend
npm install
npm start
# oppure
npm run dev          # con nodemon
npm run start_dati   # con dati demo
```

Il server ascolta su `http://localhost:3000`  
Admin predefinito: `Admin` / `Admin123!`

## 📁 Struttura

```
backend/
  server.js              ← Express + Socket.IO (http.Server)
  configuration/
    auth.js              ← Sessioni in-memory + invalidateUserSessions()
    db.js                ← SQLite setup
    init.js              ← Dati demo
  routes/
    authRoutes.js        ← Login / Logout / /api/session
    userRoutes.js        ← CRUD utenti + forced logout
    courseRoutes.js      ← CRUD corsi + broadcast
    scheduleRoutes.js    ← CRUD orari + broadcast
    dashboardRoutes.js   ← Stats / Analytics

frontend/
  HTML/                  ← Pagine HTML (includono socket.io + socket-client.js)
  CSS/                   ← Stili
  js/
    socket-client.js     ← Logica condivisa Socket.IO (force_logout handler)
    admin_dashboard.js   ← + listener users/courses/schedules_updated
    manage_users.js      ← + listener users_updated + toast notifiche
    manage_courses.js    ← + listener courses_updated
    manage_schedules.js  ← + listener schedules_updated
    user_dashboard.js    ← + listener schedule_updated (refresh orari)
    login.js
```

## 🔌 Architettura Socket.IO

```
Client (browser)
  ↓ socket.emit("register", sid)   ← mappa sid → socketId sul server

Server
  invalidateUserSessions(userId)   ← cancella sessioni in-memory
  forceLogout(sid)                 ← emette "force_logout" al socket del sid
  io.emit("users_updated", {...})  ← broadcast a tutti i client

Client (browser)
  AppSocket.on("force_logout", …)  ← banner rosso + redirect /login.html
  AppSocket.on("users_updated", …) ← fetchUsers() automatico
  AppSocket.on("schedule_updated", …) ← reload orari
```
