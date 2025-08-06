# 🎓 Portale H ITS - Sistema di Gestione Corsi

Un'applicazione web moderna per la gestione di corsi, utenti e orari per l'Istituto Tecnico Superiore (ITS) con design glassmorphism e interfaccia responsive.

## 📋 Indice

- [Panoramica](#panoramica)
- [Struttura del Progetto](#struttura-del-progetto)
- [Tecnologie Utilizzate](#tecnologie-utilizzate)
- [Funzionalità](#funzionalità)
- [Installazione](#installazione)
- [Utilizzo](#utilizzo)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Contributi](#contributi)

## 🌟 Panoramica

Il Portale H ITS è un sistema completo di gestione per istituti formativi che permette di:
- 👥 Gestire utenti (studenti, docenti, amministratori)
- 📚 Organizzare corsi e materie
- 📅 Pianificare orari e lezioni
- 📊 Monitorare dashboard personalizzate

L'applicazione utilizza un design moderno con effetti glassmorphism, gradients animati e un'interfaccia responsive ottimizzata per tutti i dispositivi.

## 📁 Struttura del Progetto

```
Portale_H_ITS/
├── 📁 db/                    # Database SQLite
│   ├── database.db           # File database SQLite
├── 📁 node_modules/          # Dipendenze npm
├── 📁 public/               # File statici frontend
│   ├── 📁 CSS/              # Fogli di stile personalizzati
│   │   ├── style.css            # Foglio di stile principale
│   │   └── styleuser.css        # Foglio di stile utente
│   ├── 📁 js/               # Script JavaScript
│   │   ├── admin_dashboard.js   # Script dashboard amministratore
│   │   ├── login.js             # Script login
│   │   ├── manage_courses.js    # Script gestione corsi
│   │   ├── manage_schedules.js  # Script gestione orari
│   │   ├── manage_users.js      # Script gestione utenti
│   │   ├── tailwind.js          # Script tailwind
│   │   ├── user_dashboard.js    # Script dashboard utente
│   │   └── utils.js             # Script utils
│   ├── admin_dashboard.html  # Dashboard amministratore
│   ├── login.html           # Pagina di login
│   ├── manage_courses.html  # Gestione corsi
│   ├── manage_schedules.html # Gestione orari
│   ├── manage_users.html    # Gestione utenti
│   └── user_dashboard.html  # Dashboard utente
├── 📁 routes/               # Route API Express
│   ├── authRoutes.js        # Autenticazione
│   ├── courseRoutes.js      # API corsi
│   ├── dashboardRoutes.js   # Dashboard
│   ├── scheduleRoutes.js    # API orari
│   └── userRoutes.js        # API utenti
├── auth.js                  # Middleware autenticazione
├── db.js                    # Configurazione database
├── server.js                # Server principale
├── package.json             # Dipendenze e script
├── package-lock.json        # Lock file dipendenze
└── README.md               # Documentazione
```

## �️ Tecnologie Utilizzate

### Backend
- **Node.js** - Runtime JavaScript server-side
- **Express.js** - Framework web minimalista
- **SQLite3** - Database relazionale leggero
- **bcryptjs** - Hashing sicuro delle password
- **cookie-parser** - Gestione cookie HTTP

### Frontend
- **HTML5** - Markup semantico moderno
- **CSS3** - Styling avanzato con glassmorphism
- **JavaScript ES6+** - Logica frontend interattiva
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide Icons** - Libreria icone moderne
- **Select2** - Componenti select avanzati con ricerca

### Strumenti di Sviluppo
- **Nodemon** - Auto-restart del server in sviluppo
- **Git** - Sistema di controllo versione

## ✨ Funzionalità

### 🔐 Sistema di Autenticazione
- Login sicuro con hash delle password
- Gestione sessioni con cookie
- Middleware di protezione delle route
- Ruoli utente (Admin/User)

### 👨‍💼 Dashboard Amministratore
- Panoramica statistiche sistema
- Gestione completa utenti
- Controllo corsi e orari
- Interfaccia moderna con glassmorphism

### 👨‍🎓 Dashboard Utente
- Vista personalizzata per studenti/docenti
- Orari personali
- Corsi assegnati
- Notifiche e aggiornamenti

### 📚 Gestione Corsi
- CRUD completo per i corsi
- Ricerca e filtri avanzati
- Modal per aggiunta/modifica
- Validazione form lato client

### 📅 Gestione Orari
- Pianificazione orari complessa
- Filtri multipli con Select2
- Aggiunta dinamica di docenti, aule, materie
- Integrazione con backend per nuove entità
- Ricerca in tempo reale

### 👥 Gestione Utenti
- Creazione e modifica utenti
- Assegnazione ruoli
- Gestione password sicura
- Interfaccia responsive

## 🚀 Installazione

### Prerequisiti
- Node.js (v14 o superiore)
- npm o yarn
- Git

### Passi di Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/tuousername/Portale_H_ITS.git
   cd Portale_H_ITS
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Avvia il server**
   ```bash
   # Modalità sviluppo (con auto-restart)
   npm run dev
   
   # Modalità produzione
   npm start
   ```

4. **Accedi all'applicazione**
   - Apri il browser su `http://localhost:3000`
   - Usa le credenziali di default per il primo accesso

## 💻 Utilizzo

### Primo Accesso
1. Naviga su `http://localhost:3000`
2. Effettua il login con le credenziali amministratore
3. Configura utenti, corsi e orari dal pannello admin

### Gestione Quotidiana
- **Amministratori**: Accesso completo a tutte le funzionalità
- **Utenti**: Vista limitata ai propri corsi e orari

## � API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/logout` - Logout utente
- `GET /api/auth/check` - Verifica sessione

### Utenti
- `GET /api/users` - Lista utenti
- `POST /api/users` - Crea utente
- `PUT /api/users/:id` - Aggiorna utente
- `DELETE /api/users/:id` - Elimina utente

### Corsi
- `GET /api/courses` - Lista corsi
- `POST /api/courses` - Crea corso
- `PUT /api/courses/:id` - Aggiorna corso
- `DELETE /api/courses/:id` - Elimina corso

### Orari
- `GET /api/schedules` - Lista orari
- `POST /api/schedules` - Crea orario
- `PUT /api/schedules/:id` - Aggiorna orario
- `DELETE /api/schedules/:id` - Elimina orario

### Dashboard
- `GET /api/dashboard/stats` - Statistiche generali
- `GET /api/dashboard/user/:id` - Dati utente specifico

Perfetto! Qui sotto trovi una **versione Markdown completa e migliorata** del tuo schema, in cui viene **spiegato chiaramente cosa significa FK (Foreign Key)**, indicando che si tratta di una **chiave esterna** che **fa riferimento a una chiave primaria di un’altra tabella**.

---

# 🗄️ **Database Schema**

Il sistema utilizza **SQLite3** per la gestione dei dati, con un modello relazionale composto da 4 tabelle principali:

---

## 📋 **Struttura delle Tabelle**

### 1. `users`

Gestisce gli utenti del sistema, sia amministratori che studenti.

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);
```

**Campi:**

* `id`: Chiave primaria auto-incrementale
* `username`: Nome utente univoco
* `password`: Password protetta mediante hash con **bcrypt**
* `role`: Ruolo dell’utente (`admin` o `student`)

---

### 2. `courses`

Contiene i corsi disponibili nel sistema.

```sql
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);
```

**Campi:**

* `id`: Chiave primaria auto-incrementale
* `name`: Nome univoco del corso
* `description`: Descrizione del corso (opzionale)

---

### 3. `user_courses`

Tabella ponte per la relazione **many-to-many** tra utenti e corsi.

```sql
CREATE TABLE IF NOT EXISTS user_courses (
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

**Campi:**

* `user_id`: **Chiave esterna (FK)** → si riferisce a `users.id`, cioè legge la chiave primaria della tabella `users`
* `course_id`: **Chiave esterna (FK)** → si riferisce a `courses.id`, cioè legge la chiave primaria della tabella `courses`
* **Chiave primaria composita**: unione di `user_id` e `course_id`
* **ON DELETE CASCADE**: se un utente o corso viene eliminato, vengono eliminati anche i collegamenti associati

---

### 4. `schedules`

Gestisce gli orari delle lezioni per ogni corso.

```sql
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  teacher TEXT NOT NULL,
  room TEXT NOT NULL,
  subject TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  day TEXT NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

**Campi:**

* `id`: Chiave primaria auto-incrementale
* `course_id`: **Chiave esterna (FK)** → si riferisce a `courses.id`
* `teacher`: Nome del docente
* `room`: Aula in cui si svolge la lezione
* `subject`: Materia insegnata
* `start_time`: Orario di inizio lezione (**HH\:MM**, 24h)
* `end_time`: Orario di fine lezione (**HH\:MM**, 24h)
* `day`: Giorno della settimana
* `date`: Data specifica della lezione (**YYYY-MM-DD**)

---

## 🔗 **Relazioni tra le Tabelle**

```text
users ←→ courses    (many-to-many tramite user_courses)
courses → schedules (one-to-many)
```

* Un **utente** può iscriversi a più **corsi**
* Un **corso** può essere frequentato da più **utenti**
* Ogni **corso** ha più **lezioni** pianificate in `schedules`

---

## 🧩 **Definizione: Cos'è una Foreign Key (FK)?**

Una **Foreign Key** (chiave esterna) è un campo che **fa riferimento alla chiave primaria di un'altra tabella**.
Serve per **collegare logicamente** due tabelle e **mantenere l'integrità referenziale** dei dati.

✅ Una Foreign Key:

* Permette di **associare i dati** tra tabelle diverse
* Impedisce l'inserimento di riferimenti non validi (es: non puoi assegnare un `user_id` che non esiste)
* Può essere configurata con **ON DELETE CASCADE** per eliminare automaticamente i dati collegati

---

## ⚙️ **Vincoli e Caratteristiche del Database**

* 🔐 **Password sicure**: archiviate con algoritmo **bcrypt**
* ✅ **Vincoli di unicità**:

  * `users.username`
  * `courses.name`
* 🔁 **Foreign Key con ON DELETE CASCADE**:

  * I record collegati vengono eliminati automaticamente
* 🔗 **Chiave primaria composita**:

  * Presente in `user_courses (user_id, course_id)`
* 🛠️ **Inizializzazione automatica**:

  * Le tabelle vengono create all’avvio del server tramite `db.js`
* ⏰ **Formati standard**:

  * Orari: `HH:MM` (24 ore)
  * Date: `YYYY-MM-DD` (ISO 8601)

---

## 🎨 Design System

### Colori Principali
- **Primary**: Gradient blu-viola
- **Secondary**: Gradient rosa-arancione
- **Background**: Sfumature scure con glassmorphism
- **Text**: Bianco e grigi per contrasto ottimale

### Componenti UI
- **Cards**: Effetto glassmorphism con backdrop-blur
- **Buttons**: Gradient animati con hover effects
- **Forms**: Input moderni con validazione visiva
- **Modals**: Overlay con blur e animazioni smooth

## 🤝 Contributi

Per contribuire al progetto:

1. Fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## � Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

---