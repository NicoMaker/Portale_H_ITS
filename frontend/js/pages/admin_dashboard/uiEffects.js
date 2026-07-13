// Effetti UI della dashboard: smooth scroll, loading nav, animazioni on-scroll

export function initUiEffects() {
  // Smooth scroll per i link interni
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Spinner sulle icone dei link di navigazione
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    link.addEventListener("click", function () {
      if (this.href !== window.location.href) {
        this.querySelector("svg")?.classList.add("animate-spin");
      }
    });
  });

  // Animazioni all'entrata in viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );

  document
    .querySelectorAll(".animate-slide-up, .animate-fade-in")
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
      observer.observe(el);
    });

  document.querySelectorAll(".card-hover").forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
  });
}
