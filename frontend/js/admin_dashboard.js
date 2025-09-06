// Dashboard functionality
class AdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
    }

    async loadDashboardData() {
        try {
            // Load basic stats
            const statsResponse = await fetch('/admin/stats');
            const stats = await statsResponse.json();
            this.updateStatsCards(stats);

        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
        }
    }

    updateStatsCards(stats) {
        // Update total users
        const totalUsersEl = document.getElementById('total-users');
        if (totalUsersEl) {
            totalUsersEl.textContent = stats.totalUsers || 0;
        }
        
        const usersAdminEl = document.getElementById('users-admin');
        if (usersAdminEl) {
            usersAdminEl.textContent = `Admin: ${stats.usersByRole?.admin || 0}`;
        }
        
        const usersRegularEl = document.getElementById('users-regular');
        if (usersRegularEl) {
            usersRegularEl.textContent = `Utenti: ${stats.usersByRole?.user || 0}`;
        }

        // Update total courses
        const totalCoursesEl = document.getElementById('total-courses');
        if (totalCoursesEl) {
            totalCoursesEl.textContent = stats.totalCourses || 0;
        }

        // Update total schedules
        const totalSchedulesEl = document.getElementById('total-schedules');
        if (totalSchedulesEl) {
            totalSchedulesEl.textContent = stats.totalSchedules || 0;
        }
    }
}

// Initialize dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Modal functionality
const modal = document.getElementById("edit-profile-modal");
const usernameDisplay = document.getElementById("new_username");
const newPassword = document.getElementById("new_password");
const editHint = document.getElementById("edit-password-hint");
const editMsg = document.getElementById("edit-profile-msg");
const togglePassword = document.getElementById("toggle-password");

// Toggle password visibility
togglePassword.addEventListener("click", () => {
  const type =
    newPassword.getAttribute("type") === "password" ? "text" : "password";
  newPassword.setAttribute("type", type);

  const eyeIcon = togglePassword.querySelector("svg");
  if (type === "text") {
    eyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                `;
  } else {
    eyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                `;
  }
});

// Open modal and load username
document.getElementById("edit-profile-btn").addEventListener("click", () => {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  fetch("/user/current")
    .then((r) => r.json())
    .then((data) => {
      if (data.username) {
        usernameDisplay.value = data.username;
      } else {
        throw new Error("Username non trovato");
      }
    })
    .catch((err) => {
      console.error("Errore nel recupero dello username:", err);
      editMsg.textContent = "Errore nel recupero dello username.";
      editMsg.className = "text-center text-sm font-medium text-red-500";
    });
});

// Close modal
document.getElementById("close-modal").addEventListener("click", () => {
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  editMsg.textContent = "";
  newPassword.value = "";
  editHint.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero.</span>
            `;
  editHint.className = "mt-2 text-sm text-gray-500 flex items-center space-x-2";
});

// Close modal when clicking backdrop
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
});

// Real-time password validation
newPassword.addEventListener("input", () => {
  const val = newPassword.value;
  const requirements = [];

  if (val.length < 8) requirements.push("Almeno 8 caratteri");
  if (!/[A-Z]/.test(val)) requirements.push("Una maiuscola");
  if (!/[a-z]/.test(val)) requirements.push("Una minuscola");
  if (!/[0-9]/.test(val)) requirements.push("Un numero");

  if (requirements.length === 0) {
    editHint.innerHTML = `
                    <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="text-green-500">Password valida!</span>
                `;
  } else {
    editHint.innerHTML = `
                    <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <span class="text-orange-500">Mancano: ${requirements.join(", ")}</span>
                `;
  }
});

// Submit profile edit form
document
  .getElementById("edit-profile-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const val = newPassword.value;
    const isValid =
      val.length >= 8 &&
      /[A-Z]/.test(val) &&
      /[a-z]/.test(val) &&
      /[0-9]/.test(val);

    if (!isValid) {
      editMsg.textContent = "La password non soddisfa tutti i requisiti";
      editMsg.className = "text-center text-sm font-medium text-red-500";
      return false;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = `
                <span class="flex items-center justify-center space-x-2">
                    <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Salvando...</span>
                </span>
            `;
    submitBtn.disabled = true;

    fetch("/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: newPassword.value,
      }),
    })
      .then((r) => r.text())
      .then((msg) => {
        if (msg === "OK") {
          editMsg.innerHTML = `
                            <div class="flex items-center justify-center space-x-2 text-green-500">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <span>Profilo aggiornato con successo!</span>
                            </div>
                        `;
          setTimeout(() => location.reload(), 1500);
        } else {
          editMsg.innerHTML = `
                            <div class="flex items-center justify-center space-x-2 text-red-500">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                <span>${msg}</span>
                            </div>
                        `;
        }
      })
      .catch((err) => {
        console.error("Errore durante il salvataggio:", err);
        editMsg.innerHTML = `
                        <div class="flex items-center justify-center space-x-2 text-red-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <span>Errore durante il salvataggio.</span>
                        </div>
                    `;
      })
      .finally(() => {
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
      });
  });

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add loading states to navigation links
document.querySelectorAll('a[href^="/"]').forEach((link) => {
  link.addEventListener("click", function (e) {
    if (this.href !== window.location.href) {
      const icon = this.querySelector("svg");
      if (icon) {
        icon.classList.add("animate-spin");
      }
    }
  });
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe elements for animation
document
  .querySelectorAll(".animate-slide-up, .animate-fade-in")
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    observer.observe(el);
  });

// Add stagger delay to cards
document.querySelectorAll(".card-hover").forEach((card, index) => {
  card.style.transitionDelay = `${index * 0.1}s`;
});

// Keyboard accessibility
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
});

// Focus management for modal
modal.addEventListener("transitionend", () => {
  if (!modal.classList.contains("hidden")) {
    newPassword.focus();
  }
});
