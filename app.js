(() => {
  const doc = document.documentElement;
  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yearNode = document.getElementById('year');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const progressBar = document.querySelector('.scroll-progress');
  const updateScrollProgress = () => {
    if (!progressBar) {
      return;
    }
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / max));
    progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
  };

  updateScrollProgress();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (revealItems.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.18 }
      );

      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  const parallaxItems = Array.from(document.querySelectorAll('[data-parallax]'));
  const updateParallax = () => {
    if (prefersReducedMotion || parallaxItems.length === 0) {
      return;
    }

    parallaxItems.forEach((item) => {
      const speed = Number(item.getAttribute('data-parallax')) || 0.1;
      item.style.setProperty('--parallax-shift', `${window.scrollY * speed}px`);
    });
  };

  updateParallax();
  window.addEventListener('scroll', updateParallax, { passive: true });

  const compassStage = document.getElementById('compassStage');
  const compassCore = document.getElementById('compassCore');
  const compassNeedle = document.getElementById('compassNeedle');

  const setCompassFromPoint = (clientX, clientY) => {
    if (!compassStage || !compassCore || !compassNeedle) {
      return;
    }

    const rect = compassStage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = Math.max(-1, Math.min(1, (clientX - cx) / (rect.width / 2)));
    const dy = Math.max(-1, Math.min(1, (clientY - cy) / (rect.height / 2)));

    const tiltX = -(dy * 13);
    const tiltY = dx * 13;
    compassCore.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

    const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
    compassNeedle.style.transform = `translate(-50%, -100%) rotate(${angle.toFixed(2)}deg)`;
  };

  const resetCompass = () => {
    if (!compassCore || !compassNeedle) {
      return;
    }

    compassCore.style.transform = 'rotateX(0deg) rotateY(0deg)';
    compassNeedle.style.transform = 'translate(-50%, -100%) rotate(0deg)';
  };

  if (compassStage && !prefersReducedMotion) {
    compassStage.addEventListener('pointermove', (event) => {
      setCompassFromPoint(event.clientX, event.clientY);
    });

    compassStage.addEventListener('pointerleave', () => {
      resetCompass();
    });
  }

  const cursor = document.querySelector('.compass-cursor');
  const cursorNeedle = document.querySelector('.cursor-needle');
  const interactiveTargets = 'a, button, input, textarea, .service-card, .research-stop, .map-panel';
  const hasFinePointer = window.matchMedia('(any-pointer: fine)').matches;
  const coarseOnly = window.matchMedia('(any-pointer: coarse)').matches && !hasFinePointer;
  const allowCursor = !coarseOnly;

  if (cursor && cursorNeedle && allowCursor && !prefersReducedMotion) {
    body.classList.add('cursor-enabled');

    let prevX = window.innerWidth / 2;
    let prevY = window.innerHeight / 2;
    let lastAngle = 0;
    let idleTimer = 0;
    const setCursorPosition = (x, y) => {
      cursor.style.left = `${x.toFixed(1)}px`;
      cursor.style.top = `${y.toFixed(1)}px`;
    };
    const scheduleCursorHide = () => {
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
      idleTimer = window.setTimeout(() => {
        cursor.classList.remove('active');
      }, 900);
    };

    const onPointerMove = (event) => {
      cursor.classList.add('active');
      setCursorPosition(event.clientX, event.clientY);
      scheduleCursorHide();

      const dx = event.clientX - prevX;
      const dy = event.clientY - prevY;
      prevX = event.clientX;
      prevY = event.clientY;

      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        lastAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      }

      if (Number.isFinite(lastAngle)) {
        cursorNeedle.style.transform = `translate(-50%, -50%) rotate(${lastAngle.toFixed(2)}deg)`;
      }

      if (compassStage && !prefersReducedMotion) {
        setCompassFromPoint(event.clientX, event.clientY);
      }
    };

    setCursorPosition(prevX, prevY);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerenter', () => {
      cursor.classList.add('active');
      scheduleCursorHide();
    });
    window.addEventListener('pointerleave', () => cursor.classList.remove('active'));
    window.addEventListener('pointerdown', () => cursor.classList.add('interact'));
    window.addEventListener('pointerup', () => cursor.classList.remove('interact'));
    window.addEventListener('blur', () => {
      cursor.classList.remove('active');
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
    });
    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
    });

    document.querySelectorAll(interactiveTargets).forEach((node) => {
      node.addEventListener('mouseenter', () => cursor.classList.add('interact'));
      node.addEventListener('mouseleave', () => cursor.classList.remove('interact'));
    });
  } else {
    body.classList.remove('cursor-enabled');
  }
})();
