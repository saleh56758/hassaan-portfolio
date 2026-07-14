(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Sticky nav — glassmorphism state on scroll
     --------------------------------------------------------------------- */
  var nav = document.querySelector(".nav");
  function onScroll() {
    if (window.scrollY > 8) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------------- */
  var menuBtn = document.querySelector(".menu-btn");
  var mobileMenu = document.querySelector(".mobile-menu");
  menuBtn.addEventListener("click", function () {
    var isOpen = mobileMenu.classList.toggle("is-open");
    menuBtn.classList.toggle("is-open", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });
  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileMenu.classList.remove("is-open");
      menuBtn.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------------------------------------------------------------------
     Theme toggle — persisted in localStorage, defaults to light
     --------------------------------------------------------------------- */
  var root = document.documentElement;
  var themeToggles = document.querySelectorAll(".theme-toggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* localStorage unavailable — theme just won't persist */
    }
    themeToggles.forEach(function (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    });
  }

  themeToggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") || "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  });

  document.querySelectorAll(".screenshot-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  document.querySelectorAll("img[data-fallback-src]").forEach(function (img) {
    img.addEventListener("error", function () {
      var fallbackSrc = img.getAttribute("data-fallback-src");
      if (!fallbackSrc || img.getAttribute("src") === fallbackSrc) return;

      img.setAttribute("src", fallbackSrc);
      var link = img.closest("a");
      if (link) link.setAttribute("href", fallbackSrc);
    });
  });

  /* ---------------------------------------------------------------------
     Scroll reveal — replaces Framer Motion's whileInView
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -80px 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------------------------------------------------------------------     Project card hover animations — smooth mockup scrolling
     -----------------------------------------------------------------------*/
  var projectCards = document.querySelectorAll(".project-card");
  projectCards.forEach(function (card) {
    var scrollTimeout;
    
    card.addEventListener("mouseenter", function () {
      clearTimeout(scrollTimeout);
      var images = card.querySelectorAll(".mockup-image[data-scrollable='true']");
      images.forEach(function (img) {
        img.style.animation = "none";
        setTimeout(function () {
          img.style.animation = "";
        }, 10);
      });
    });

    card.addEventListener("mouseleave", function () {
      var images = card.querySelectorAll(".mockup-image[data-scrollable='true']");
      images.forEach(function (img) {
        img.style.animation = "none";
        img.style.transform = "translateY(0)";
      });
    });
  });

  /* ---------------------------------------------------------------------
     Project archive filters + progressive reveal
     --------------------------------------------------------------------- */
  var archive = document.querySelector(".project-archive");
  if (archive) {
    var filterButtons = archive.querySelectorAll(".archive-filter");
    var archiveCards = Array.prototype.slice.call(archive.querySelectorAll(".archive-card"));
    var moreButton = archive.querySelector(".archive-more");
    var archiveActions = archive.querySelector(".archive-actions");
    var visibleLimit = 6;
    var activeFilter = "all";
    var expanded = false;

    function getFilteredCards() {
      return archiveCards.filter(function (card) {
        if (activeFilter === "all") return true;
        return (card.getAttribute("data-category") || "").split(" ").indexOf(activeFilter) !== -1;
      });
    }

    function renderArchive() {
      var filteredCards = getFilteredCards();

      archiveCards.forEach(function (card) {
        card.classList.add("is-hidden");
      });

      filteredCards.forEach(function (card, index) {
        if (expanded || index < visibleLimit) {
          card.classList.remove("is-hidden");
        }
      });

      if (!moreButton || !archiveActions) return;

      if (filteredCards.length <= visibleLimit) {
        archiveActions.classList.add("is-hidden");
        return;
      }

      archiveActions.classList.remove("is-hidden");
      moreButton.textContent = expanded ? "Show fewer projects" : "Show more projects";
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeFilter = button.getAttribute("data-filter") || "all";
        expanded = false;

        filterButtons.forEach(function (item) {
          var isActive = item === button;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });

        renderArchive();
      });
    });

    if (moreButton) {
      moreButton.addEventListener("click", function () {
        expanded = !expanded;
        renderArchive();
      });
    }

    renderArchive();
  }

  /* -----------------------------------------------------------------------     Contact form — Web3Forms submission
     --------------------------------------------------------------------- */
  var form = document.querySelector(".contact-form");
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var status = form.querySelector(".form-status");

    var ACCESS_KEY = "7dff58bd-242e-4074-8dd9-284b3bdb9bbd";
    var ENDPOINT = "https://api.web3forms.com/submit";

    var isSubmitting = false;

    function setStatus(text, visible) {
      if (!status) return;
      status.textContent = text || "";
      if (visible === false) status.classList.remove("is-visible");
      else status.classList.add("is-visible");
    }

    function setLoading(loading) {
      if (!submitBtn) return;

      submitBtn.disabled = !!loading;
      submitBtn.setAttribute("aria-busy", loading ? "true" : "false");

      if (loading) {
        if (!submitBtn.dataset.originalText) {
          submitBtn.dataset.originalText = submitBtn.textContent;
        }
        submitBtn.textContent = "Sending...";
      } else {
        if (submitBtn.dataset.originalText) {
          submitBtn.textContent = submitBtn.dataset.originalText;
        }
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (isSubmitting) return;
      isSubmitting = true;

      var nameEl = form.querySelector("#name");
      var emailEl = form.querySelector("#email");
      var msgEl = form.querySelector("#message");

      var name = nameEl ? nameEl.value.trim() : "";
      var email = emailEl ? emailEl.value.trim() : "";
      var message = msgEl ? msgEl.value.trim() : "";

      // Keep browser-required behavior, but guard against empty values.
      if (!name || !email || !message) {
        setStatus("Please fill in all fields before sending.", true);
        isSubmitting = false;
        setLoading(false);
        return;
      }

      setStatus("Sending your message...", true);
      setLoading(true);

      (async function () {
        try {
          var formData = new FormData();
          formData.append("access_key", ACCESS_KEY);
          formData.append("name", name);
          formData.append("email", email);
          formData.append("message", message);

          var response = await fetch(ENDPOINT, {
            method: "POST",
            body: formData
          });

          var data = await response.json().catch(function () {
            return null;
          });

          if (!response.ok) {
            throw new Error(
              (data && (data.message || data.error)) ||
                "Submission failed. Please try again."
            );
          }

          if (data && data.success === false) {
            throw new Error(data.message || "Submission failed. Please try again.");
          }

          setStatus("Message sent successfully — I’ll get back to you soon.", true);

          // Clear all fields on success
          if (nameEl) nameEl.value = "";
          if (emailEl) emailEl.value = "";
          if (msgEl) msgEl.value = "";
        } catch (err) {
          var msg = err && err.message ? err.message : "Something went wrong. Please try again.";
          setStatus("Error: " + msg, true);
        } finally {
          isSubmitting = false;
          setLoading(false);
        }
      })();
    });
  }
})();
