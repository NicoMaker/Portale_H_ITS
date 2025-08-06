# 🎓 Portale ITS - Sistema di Gestione Corsi

Un moderno sistema di gestione per Istituti Tecnici Superiori (ITS) con interfaccia web responsive e design glassmorphism.

## 📋 Panoramica

Il Portale ITS è un'applicazione web completa per la gestione di corsi, utenti, orari e attività didattiche. Progettato specificamente per gli Istituti Tecnici Superiori, offre un'interfaccia moderna e intuitiva per amministratori, docenti e studenti.

## ✨ Caratteristiche Principali

### 🔐 Sistema di Autenticazione
- Login sicuro con hash delle password (bcrypt)
- Gestione sessioni con cookie
- Controllo accessi basato sui ruoli (Admin, Docente, Studente)

### 👥 Gestione Utenti
- Creazione, modifica ed eliminazione utenti
- Assegnazione ruoli e permessi
- Profili utente personalizzabili
- Sistema di ricerca e filtri avanzati

### 📚 Gestione Corsi
- CRUD completo per i corsi
- Organizzazione per categorie
- Descrizioni dettagliate e metadati
- Contatore dinamico dei corsi

### 🗓️ Gestione Orari
- Pianificazione orari con interfaccia drag & drop
- Assegnazione docenti, aule e materie
- Filtri avanzati con Select2
- Aggiunta rapida di nuove entità
- Ricerca in tempo reale

### 🎨 Design Moderno
- Interfaccia glassmorphism con effetti di trasparenza
- Design responsive per tutti i dispositivi
- Animazioni fluide e gradienti dinamici
- Icone Lucide per un look professionale
- Tema scuro/chiaro

## 🛠️ Tecnologie Utilizzate

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite3** - Database leggero e veloce
- **bcryptjs** - Hashing delle password
- **cookie-parser** - Gestione cookie

### Frontend
- **HTML5** - Markup semantico
- **Tailwind CSS** - Framework CSS utility-first
- **JavaScript ES6+** - Logica client-side
- **Select2** - Componenti select avanzati
- **Lucide Icons** - Libreria di icone moderne

### Database
- **SQLite** - Database relazionale embedded
- Tabelle: users, courses, schedules, teachers, rooms, subjects

## 📁 Struttura del Progetto

```
Portale_H_ITS/
├── 📁 db/                    # Database SQLite
├── 📁 node_modules/          # Dipendenze npm
├── 📁 public/               # File statici frontend
│   ├── 📁 CSS/              # Fogli di stile personalizzati
│   ├── 📁 js/               # Script JavaScript
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
└── README.md               # Documentazione
```

## 🚀 Installazione e Configurazione

### Prerequisiti
- **Node.js** (versione 14 o superiore)
- **npm** (incluso con Node.js)

### Installazione

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd Portale_H_ITS
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Avvia il server**
   ```bash
   # Modalità produzione
   npm start
   
   # Modalità sviluppo (con auto-reload)
   npm run dev
   ```

4. **Accedi all'applicazione**
   - Apri il browser su `http://localhost:3000`
   - Usa le credenziali di default:
     - **Admin**: admin@its.it / admin123
     - **Docente**: docente@its.it / docente123
     - **Studente**: studente@its.it / studente123

## 📊 Schema Database

### Tabella Users
- `id` - Chiave primaria
- `username` - Nome utente unico
- `email` - Email utente
- `password` - Password hashata
- `role` - Ruolo (admin, teacher, student)
- `created_at` - Data creazione

### Tabella Courses
- `id` - Chiave primaria
- `name` - Nome corso
- `description` - Descrizione dettagliata
- `created_at` - Data creazione

### Tabella Schedules
- `id` - Chiave primaria
- `course_id` - Riferimento al corso
- `teacher` - Nome docente
- `room` - Aula
- `subject` - Materia
- `day` - Giorno della settimana
- `start_time` - Ora inizio
- `end_time` - Ora fine

## 🔧 API Endpoints

### Autenticazione
- `POST /login` - Login utente
- `POST /logout` - Logout utente

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

## 🎨 Caratteristiche UI/UX

### Design System
- **Glassmorphism**: Effetti di vetro smerigliato
- **Gradienti animati**: Sfondi dinamici e colorati
- **Responsive Design**: Ottimizzato per mobile, tablet e desktop
- **Microinterazioni**: Animazioni fluide e feedback visivo

### Componenti Principali
- **Navigation Bar**: Menu di navigazione con glassmorphism
- **Cards**: Contenitori con effetti di trasparenza
- **Modals**: Finestre popup per azioni rapide
- **Forms**: Input moderni con validazione
- **Tables**: Tabelle responsive con azioni inline

## 🔒 Sicurezza

- **Hash delle password** con bcrypt (salt rounds: 10)
- **Validazione input** lato server e client
- **Controllo accessi** basato sui ruoli
- **Sanitizzazione dati** per prevenire SQL injection
- **Gestione sessioni** sicura con cookie HTTP-only

## 🚀 Funzionalità Avanzate

### Gestione Orari
- **Select2 Integration**: Combobox con ricerca e selezione multipla
- **Aggiunta dinamica**: Creazione rapida di docenti, aule, materie
- **Filtri avanzati**: Ricerca per docente, aula, materia, giorno
- **Modal per corsi**: Aggiunta rapida corsi con nome e descrizione

### Dashboard Interattive
- **Statistiche in tempo reale**: Contatori dinamici
- **Grafici e metriche**: Visualizzazione dati
- **Azioni rapide**: Accesso diretto alle funzioni principali
- **Notifiche**: Sistema di feedback per le azioni

## 📱 Compatibilità

- ✅ **Chrome** (versione 90+)
- ✅ **Firefox** (versione 88+)
- ✅ **Safari** (versione 14+)
- ✅ **Edge** (versione 90+)
- ✅ **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 👨‍💻 Autore

**Nicola Marano**  
Studente ITS - Corso Front End Development

## 📞 Supporto

Per supporto o domande:
- 📧 Email: [inserire email]
- 🐛 Issues: [GitHub Issues]
- 📖 Wiki: [GitHub Wiki]

---

## 🔄 Changelog

### v1.0.0 (Attuale)
- ✅ Sistema di autenticazione completo
- ✅ Gestione utenti con CRUD
- ✅ Gestione corsi con interfaccia moderna
- ✅ Gestione orari con Select2 e filtri avanzati
- ✅ Design glassmorphism responsive
- ✅ Dashboard interattive per tutti i ruoli
- ✅ API RESTful complete
- ✅ Database SQLite con relazioni

---

*Sviluppato con ❤️ per l'Istituto Tecnico Superiore*
