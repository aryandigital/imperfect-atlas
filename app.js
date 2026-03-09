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
  const allowCursor = window.matchMedia('(pointer: fine)').matches && window.innerWidth > 960;

  if (cursor && cursorNeedle && allowCursor && !prefersReducedMotion) {
    body.classList.add('cursor-enabled');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let renderX = targetX;
    let renderY = targetY;
    let frame = 0;

    const renderCursor = () => {
      renderX += (targetX - renderX) * 0.22;
      renderY += (targetY - renderY) * 0.22;
      cursor.style.transform = `translate(${renderX.toFixed(1)}px, ${renderY.toFixed(1)}px)`;

      if (Math.abs(targetX - renderX) > 0.1 || Math.abs(targetY - renderY) > 0.1) {
        frame = window.requestAnimationFrame(renderCursor);
      } else {
        frame = 0;
      }
    };

    const onPointerMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add('active');
      if (!frame) {
        frame = window.requestAnimationFrame(renderCursor);
      }

      const angle = Math.atan2(event.movementY || 0, event.movementX || 0) * (180 / Math.PI) + 90;
      if (Number.isFinite(angle)) {
        cursorNeedle.style.transform = `translate(-50%, -50%) rotate(${angle.toFixed(2)}deg)`;
      }

      if (compassStage && !prefersReducedMotion) {
        setCompassFromPoint(event.clientX, event.clientY);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', () => cursor.classList.add('interact'));
    window.addEventListener('pointerup', () => cursor.classList.remove('interact'));

    document.querySelectorAll(interactiveTargets).forEach((node) => {
      node.addEventListener('mouseenter', () => cursor.classList.add('interact'));
      node.addEventListener('mouseleave', () => cursor.classList.remove('interact'));
    });
  } else {
    body.classList.remove('cursor-enabled');
  }
})();