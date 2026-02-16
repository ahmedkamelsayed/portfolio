/**
 * Portfolio - Main JavaScript
 * Pure vanilla JS, no external dependencies
 * =========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------
   * UTILITY: Touch device detection
   * ------------------------------------------------------- */
  const isTouchDevice = () =>
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;

  /* -------------------------------------------------------
   * UTILITY: Safe element selectors
   * ------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* -------------------------------------------------------
   * 1. PAGE LOADER
   * ------------------------------------------------------- */
  (() => {
    const loader = $('#pageLoader');
    if (!loader) return;

    document.body.style.overflow = 'hidden';

    const hideLoader = () => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';

      loader.addEventListener('transitionend', () => {
        loader.remove();
      }, { once: true });

      // Fallback removal if transitionend never fires
      setTimeout(() => {
        if (loader.parentNode) loader.remove();
      }, 1500);
    };

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader, { once: true });
    }
  })();

  /* -------------------------------------------------------
   * 1b. THEME TOGGLE (light/dark)
   * ------------------------------------------------------- */
  (() => {
    const toggle = $('#themeToggle');
    const STORAGE_KEY = 'portfolio-theme';

    const getPreferred = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    };

    const apply = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEY, theme);
    };

    // Apply saved/preferred theme immediately
    apply(getPreferred());

    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        apply(current === 'light' ? 'dark' : 'light');
      });
    }

    // Listen for OS-level theme changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        apply(e.matches ? 'light' : 'dark');
      }
    });
  })();

  /* -------------------------------------------------------
   * 2. CUSTOM CURSOR (desktop only)
   * ------------------------------------------------------- */
  (() => {
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');

    if (!dot || !ring || isTouchDevice()) {
      if (dot) dot.style.display = 'none';
      if (ring) ring.style.display = 'none';
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    const LERP = 0.15;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    }, { passive: true });

    const animateRing = () => {
      ringX += (mouseX - ringX) * LERP;
      ringY += (mouseY - ringY) * LERP;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animateRing);
    };
    requestAnimationFrame(animateRing);

    // Grow ring on interactive element hover
    const hoverTargets = $$('a, button, [data-tilt]');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'), { passive: true });
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'), { passive: true });
    });

    // Hide cursor elements when mouse leaves the viewport
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    }, { passive: true });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    }, { passive: true });
  })();

  /* -------------------------------------------------------
   * SCROLL ENGINE: Single rAF-throttled scroll handler
   * All scroll-dependent features register here instead
   * of attaching individual scroll listeners.
   * ------------------------------------------------------- */
  let scrollTicking = false;
  const scrollCallbacks = [];

  const registerScrollHandler = (fn) => scrollCallbacks.push(fn);

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        for (let i = 0; i < scrollCallbacks.length; i++) {
          scrollCallbacks[i](scrollY, docHeight);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* -------------------------------------------------------
   * 3. SCROLL PROGRESS BAR
   * ------------------------------------------------------- */
  (() => {
    const bar = $('#scrollProgress');
    if (!bar) return;

    registerScrollHandler((scrollY, docHeight) => {
      const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      bar.style.width = `${pct}%`;
    });
  })();

  /* -------------------------------------------------------
   * 4. NAVBAR
   * ------------------------------------------------------- */
  (() => {
    const navbar = $('.navbar');
    const navToggle = $('#navToggle');
    const navLinks = $('#navLinks');
    const navItems = $$('.nav-link');
    const sections = $$('section[id]');

    // Add 'scrolled' class when page is scrolled past 50px
    if (navbar) {
      registerScrollHandler((scrollY) => {
        navbar.classList.toggle('scrolled', scrollY > 50);
      });
    }

    // Mobile hamburger toggle
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
      });
    }

    // Close mobile menu when a nav link is clicked
    navItems.forEach((link) => {
      link.addEventListener('click', () => {
        if (navToggle) navToggle.classList.remove('active');
        if (navLinks) navLinks.classList.remove('active');
      });
    });

    // Active section tracking on scroll
    if (sections.length && navItems.length) {
      registerScrollHandler((scrollY) => {
        const offset = navbar ? navbar.offsetHeight + 80 : 80;
        let currentId = '';

        // Walk sections bottom-up to find the one currently in view
        for (let i = sections.length - 1; i >= 0; i--) {
          if (scrollY >= sections[i].offsetTop - offset) {
            currentId = sections[i].getAttribute('id');
            break;
          }
        }

        navItems.forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${currentId}`
          );
        });
      });
    }
  })();

  /* -------------------------------------------------------
   * 5. SMOOTH SCROLL for anchor links
   * ------------------------------------------------------- */
  (() => {
    const navbar = $('.navbar');

    // Delegated click handler for all hash links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    });
  })();

  /* -------------------------------------------------------
   * 6. TYPING EFFECT
   * ------------------------------------------------------- */
  (() => {
    const typedEl = $('#typedText');
    if (!typedEl) return;

    const strings = [
      'Senior QA Engineer',
      'AI Testing Innovator',
      'ISTQB Certified Tester',
      'Automation Specialist',
      'Quality Advocate',
    ];

    const TYPE_DELAY = 80;
    const DELETE_DELAY = 40;
    const PAUSE_AFTER_TYPE = 2000;
    const PAUSE_AFTER_DELETE = 500;

    let strIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const tick = () => {
      const current = strings[strIdx];

      if (!isDeleting) {
        charIdx++;
        typedEl.textContent = current.substring(0, charIdx);

        if (charIdx === current.length) {
          isDeleting = true;
          setTimeout(tick, PAUSE_AFTER_TYPE);
          return;
        }
        setTimeout(tick, TYPE_DELAY);
      } else {
        charIdx--;
        typedEl.textContent = current.substring(0, charIdx);

        if (charIdx === 0) {
          isDeleting = false;
          strIdx = (strIdx + 1) % strings.length;
          setTimeout(tick, PAUSE_AFTER_DELETE);
          return;
        }
        setTimeout(tick, DELETE_DELAY);
      }
    };

    tick();
  })();

  /* -------------------------------------------------------
   * 7. WAVING HAND
   * The .wave class on the emoji element triggers the CSS
   * keyframe animation. No JavaScript action required.
   * ------------------------------------------------------- */

  /* -------------------------------------------------------
   * 8. FADE-IN ON SCROLL (IntersectionObserver)
   * ------------------------------------------------------- */
  (() => {
    const fadeEls = $$('.fade-in, .fade-in-left, .fade-in-right, .scale-up');
    if (!fadeEls.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    fadeEls.forEach((el) => observer.observe(el));
  })();

  /* -------------------------------------------------------
   * 9. ANIMATED COUNTERS with easeOutExpo
   * ------------------------------------------------------- */
  (() => {
    const statsSection = $('#stats');
    if (!statsSection) return;

    let counted = false;

    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target)) return;

      const duration = 2000;
      const startTime = performance.now();

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOutExpo(progress) * target);

        el.textContent = value;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target;
        }
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !counted) {
            counted = true;
            $$('.stat-number', statsSection).forEach(animateCounter);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(statsSection);
  })();

  /* -------------------------------------------------------
   * 10. SKILL BARS
   * ------------------------------------------------------- */
  (() => {
    const skillBars = $$('.skill-bar');
    if (!skillBars.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const fill = entry.target.querySelector('.skill-bar-fill');
            const width = entry.target.getAttribute('data-width');
            if (fill && width) {
              fill.style.width = width;
            }
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    skillBars.forEach((bar) => observer.observe(bar));
  })();

  /* -------------------------------------------------------
   * 11. LANGUAGE BARS
   * ------------------------------------------------------- */
  (() => {
    const langFills = $$('.lang-fill');
    if (!langFills.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Try data-width on parent first, then on element itself
            const parent = entry.target.parentElement;
            const width =
              (parent && parent.getAttribute('data-width')) ||
              entry.target.getAttribute('data-width');

            if (width) {
              entry.target.style.width = width;
            }
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    langFills.forEach((bar) => observer.observe(bar));
  })();

  /* -------------------------------------------------------
   * 12. BACK TO TOP
   * ------------------------------------------------------- */
  (() => {
    const btn = $('#backToTop');
    if (!btn) return;

    registerScrollHandler((scrollY) => {
      btn.classList.toggle('visible', scrollY > 500);
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  /* -------------------------------------------------------
   * 14. TOAST NOTIFICATION
   * Defined before contact form so it can be called there.
   * ------------------------------------------------------- */
  const showToast = (message, type = 'success') => {
    const toast = $('#toast');
    if (!toast) return;

    // Update message content
    const msgEl = toast.querySelector('.toast-message') || toast;
    msgEl.textContent = message;

    // Swap type classes and show
    toast.classList.remove('success', 'error');
    toast.classList.add(type, 'show');

    // Auto-hide after 5 seconds
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 5000);
  };

  // Toast close button
  (() => {
    const closeBtn = $('.toast-close');
    const toast = $('#toast');
    if (closeBtn && toast) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        clearTimeout(toast._hideTimer);
      });
    }
  })();

  /* -------------------------------------------------------
   * 13. CONTACT FORM
   * ------------------------------------------------------- */
  (() => {
    const form = $('#contactForm');
    if (!form) return;

    const submitBtn = $('#submitBtn');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const setError = (field, msg) => {
      const group = field.closest('.form-group');
      if (!group) return;
      group.classList.add('error');
      const errorEl = group.querySelector('.form-error');
      if (errorEl) errorEl.textContent = msg;
    };

    const clearError = (field) => {
      const group = field.closest('.form-group');
      if (!group) return;
      group.classList.remove('error');
      const errorEl = group.querySelector('.form-error');
      if (errorEl) errorEl.textContent = '';
    };

    const validate = () => {
      let valid = true;

      const name = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const subject = form.querySelector('[name="subject"]');
      const message = form.querySelector('[name="message"]');

      if (name) {
        if (!name.value.trim()) {
          setError(name, 'Please enter your name.');
          valid = false;
        } else {
          clearError(name);
        }
      }

      if (email) {
        if (!emailRegex.test(email.value.trim())) {
          setError(email, 'Please enter a valid email address.');
          valid = false;
        } else {
          clearError(email);
        }
      }

      if (subject) {
        if (!subject.value) {
          setError(subject, 'Please select a subject.');
          valid = false;
        } else {
          clearError(subject);
        }
      }

      if (message) {
        if (!message.value.trim()) {
          setError(message, 'Please enter a message.');
          valid = false;
        } else {
          clearError(message);
        }
      }

      return valid;
    };

    // Real-time validation: clear error on input/change
    $$('input, textarea, select', form).forEach((field) => {
      field.addEventListener('input', () => clearError(field), { passive: true });
      field.addEventListener('change', () => clearError(field), { passive: true });
    });

    // Form submission via Web3Forms API
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validate()) return;

      if (submitBtn) submitBtn.classList.add('loading');

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          showToast('Message sent successfully! I\'ll get back to you soon.', 'success');
          form.reset();
        } else {
          throw new Error(result.message || 'Submission failed.');
        }
      } catch (_err) {
        showToast('Something went wrong. Please try again or email me directly.', 'error');
      } finally {
        if (submitBtn) submitBtn.classList.remove('loading');
      }
    });
  })();

  /* -------------------------------------------------------
   * 15. SCROLL INDICATOR
   * ------------------------------------------------------- */
  (() => {
    const indicator = $('#scrollIndicator');
    if (!indicator) return;

    registerScrollHandler((scrollY) => {
      indicator.style.opacity = scrollY > 200 ? '0' : '1';
      indicator.style.pointerEvents = scrollY > 200 ? 'none' : '';
    });
  })();

  /* -------------------------------------------------------
   * 16. TILT EFFECT on project cards
   * ------------------------------------------------------- */
  (() => {
    const cards = $$('.project-card[data-tilt]');
    if (!cards.length || isTouchDevice()) return;

    cards.forEach((card) => {
      let tiltRaf = null;

      card.addEventListener('mousemove', (e) => {
        if (tiltRaf) cancelAnimationFrame(tiltRaf);

        tiltRaf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          // Subtle tilt: max ~8 degrees
          const rotateX = ((y - centerY) / centerY) * -8;
          const rotateY = ((x - centerX) / centerX) * 8;

          card.style.transform =
            `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          tiltRaf = null;
        });
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        if (tiltRaf) cancelAnimationFrame(tiltRaf);
        card.style.transform =
          'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      }, { passive: true });
    });
  })();

  /* -------------------------------------------------------
   * 17. PARALLAX on floating badges
   * ------------------------------------------------------- */
  (() => {
    const badges = $$('.photo-float-badge');
    if (!badges.length || isTouchDevice()) return;

    registerScrollHandler((scrollY) => {
      for (let i = 0; i < badges.length; i++) {
        const speed = 0.03 + i * 0.015;
        const yOffset = scrollY * speed;
        badges[i].style.transform = `translateY(${yOffset}px)`;
      }
    });
  })();

  /* -------------------------------------------------------
   * INIT: Run all scroll callbacks once to set initial state
   * (navbar class, scroll progress, back-to-top visibility)
   * ------------------------------------------------------- */
  (() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    for (let i = 0; i < scrollCallbacks.length; i++) {
      scrollCallbacks[i](scrollY, docHeight);
    }
  })();

});
