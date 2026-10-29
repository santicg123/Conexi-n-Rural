/* =========================================================
   PÁGINA COMBINADA — interactividad
   Contiene: selector de proyecto (portada / CampoDirecto /
   AgroPerfil) + la interactividad de cada proyecto, escrita de
   forma genérica para que ambos convivan en la misma página sin
   pisarse (nada de ids fijos compartidos: todo se busca por
   clase, atributo data-* o relación con su propio contenedor).
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =======================================================
     SELECTOR DE PROYECTO (portada / campodirecto / agroperfil)
     ======================================================= */
  const APP_VIEWS = ["home", "campodirecto", "agroperfil"];
  const VIEW_TITLES = {
    home: "Proyectos — CampoDirecto y AgroPerfil",
    campodirecto: "CampoDirecto — Del campo a tu mesa, sin intermediarios",
    agroperfil: "AgroPerfil — Conectamos el campo con el empleo"
  };

  function showView(viewId) {
    if (!APP_VIEWS.includes(viewId)) viewId = "home";

    APP_VIEWS.forEach(id => {
      const el = document.getElementById("view-" + id);
      if (el) el.classList.toggle("is-active", id === viewId);
    });

    document.querySelectorAll(".switcher-btn").forEach(btn => {
      const isActive = btn.getAttribute("data-view") === viewId;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-current", isActive ? "page" : "false");
    });
    const homeBtn = document.querySelector(".switcher-home");
    if (homeBtn) {
      homeBtn.classList.toggle("is-active", viewId === "home");
      homeBtn.setAttribute("aria-current", viewId === "home" ? "page" : "false");
    }

    document.title = VIEW_TITLES[viewId] || VIEW_TITLES.home;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  document.querySelectorAll("[data-view]").forEach(el => {
    el.addEventListener("click", () => showView(el.getAttribute("data-view")));
  });

  showView("home");

  /* ---------- año en los pies de página (una clase, cualquier cantidad) ---------- */
  const currentYear = new Date().getFullYear();
  document.querySelectorAll(".year-now").forEach(el => { el.textContent = currentYear; });

  /* ---------- menús móviles (uno por proyecto, ligados por aria-controls) ---------- */
  const navToggles = Array.from(document.querySelectorAll(".nav-toggle"));
  navToggles.forEach(navToggle => {
    const primaryNav = document.getElementById(navToggle.getAttribute("aria-controls") || "");
    if (!primaryNav) return;
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      primaryNav.classList.toggle("is-open", !isOpen);
    });
    primaryNav.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        primaryNav.classList.remove("is-open");
      });
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    navToggles.forEach(navToggle => {
      const primaryNav = document.getElementById(navToggle.getAttribute("aria-controls") || "");
      if (primaryNav) {
        navToggle.setAttribute("aria-expanded", "false");
        primaryNav.classList.remove("is-open");
      }
    });
  });

  /* ---------- resaltar enlace activo según la sección visible (cada nav con su propia sección) ---------- */
  const navLinks = Array.from(document.querySelectorAll(".primary-nav .nav-link"));
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = "#" + entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(section => sectionObserver.observe(section));
  }

  /* ---------- animación de aparición al hacer scroll (comparte selector .reveal en ambos proyectos) ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(el => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---------- botón "volver arriba" (uno por proyecto, misma clase) ---------- */
  document.querySelectorAll(".back-to-top").forEach(backToTop => {
    const toggleBackToTop = () => {
      backToTop.hidden = window.scrollY < window.innerHeight * 0.6;
    };
    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- los botones del hero preseleccionan un campo del formulario (por id explícito) ---------- */
  document.querySelectorAll("[data-target-input]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.getAttribute("data-target-input"));
      if (input) {
        input.checked = true;
        input.dispatchEvent(new Event("change"));
      }
    });
  });

  /* =======================================================
     CAMPODIRECTO — calculadora de precio justo
     ======================================================= */
  const calcPrecio = document.getElementById("calcPrecio");
  const calcPrecioValor = document.getElementById("calcPrecioValor");
  const barFarmerHoy = document.getElementById("barFarmerHoy");
  const barFarmerDirecto = document.getElementById("barFarmerDirecto");
  const barComprador = document.getElementById("barComprador");
  const valFarmerHoy = document.getElementById("valFarmerHoy");
  const valFarmerDirecto = document.getElementById("valFarmerDirecto");
  const valComprador = document.getElementById("valComprador");

  const cop = new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  });

  function actualizarCalculadora() {
    if (!calcPrecio) return;
    const precioTienda = Number(calcPrecio.value);

    // Estimación ilustrativa: hoy el campesino recibe ~1/5 del precio final
    // (según la diferencia descrita en el proyecto); con CampoDirecto ese
    // reparto se vuelve más justo para ambos lados.
    const ganaHoy = precioTienda * 0.20;
    const ganaDirecto = precioTienda * 0.45;
    const pagasDirecto = precioTienda * 0.65;

    calcPrecioValor.textContent = cop.format(precioTienda);
    valFarmerHoy.textContent = cop.format(ganaHoy);
    valFarmerDirecto.textContent = cop.format(ganaDirecto);
    valComprador.textContent = cop.format(pagasDirecto);

    barFarmerHoy.style.width = (ganaHoy / precioTienda * 100) + "%";
    barFarmerDirecto.style.width = (ganaDirecto / precioTienda * 100) + "%";
    barComprador.style.width = (pagasDirecto / precioTienda * 100) + "%";
  }

  if (calcPrecio) {
    calcPrecio.addEventListener("input", actualizarCalculadora);
    actualizarCalculadora();
  }

  /* ---------- acordeón de preguntas frecuentes (cada uno se cierra dentro de su propio grupo) ---------- */
  document.querySelectorAll(".accordion-trigger").forEach(trigger => {
    const panel = trigger.nextElementSibling;
    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      // cierra los demás paneles del mismo acordeón
      const group = trigger.closest(".accordion");
      if (group) {
        group.querySelectorAll(".accordion-trigger").forEach(other => {
          if (other !== trigger) {
            other.setAttribute("aria-expanded", "false");
            other.nextElementSibling.style.maxHeight = null;
          }
        });
      }

      trigger.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";
    });
  });

  /* =======================================================
     FORMULARIOS "ÚNETE" — genérico, uno por proyecto
     Cada formulario .join-form va seguido en el HTML por su
     propio bloque .join-success (mismo patrón que ya usa el
     acordeón con nextElementSibling), así que un mismo bloque
     de lógica sirve para cualquier cantidad de formularios.
     ======================================================= */
  function capitalizar(texto) {
    return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
  }

  function initJoinForm(form) {
    const successEl = form.nextElementSibling;
    const submitBtn = form.querySelector('button[type="submit"]');
    const successTextEl = successEl ? successEl.querySelector("[data-role='success-text']") : null;
    const resetBtn = successEl ? successEl.querySelector("[data-role='reset']") : null;

    function actualizarCamposPorRol() {
      const rolActivo = form.querySelector('input[name="rol"]:checked')?.value || "";
      form.querySelectorAll("[data-field-for]").forEach(field => {
        const visible = field.getAttribute("data-field-for") === rolActivo;
        field.hidden = !visible;
        field.querySelectorAll("input, textarea").forEach(el => { el.required = visible; });
      });
    }

    form.querySelectorAll('input[name="rol"]').forEach(input => {
      input.addEventListener("change", actualizarCamposPorRol);
    });
    actualizarCamposPorRol();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const rol = form.querySelector('input[name="rol"]:checked')?.value || "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
      }

      // Sin backend: esta es una simulación en el navegador para la demo.
      // Para recibir las respuestas de verdad, conecta este formulario a tu
      // correo, una hoja de cálculo o el servicio que prefieras.
      window.setTimeout(() => {
        form.hidden = true;
        if (successEl) {
          successEl.hidden = false;
          if (successTextEl) {
            successTextEl.textContent = form.dataset["msg" + capitalizar(rol)] ||
              "Nos pondremos en contacto contigo muy pronto.";
          }
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Enviar";
        }
      }, 900);
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        form.reset();
        actualizarCamposPorRol();
        form.hidden = false;
        if (successEl) successEl.hidden = true;
      });
    }
  }

  document.querySelectorAll(".join-form").forEach(initJoinForm);

});