/**
 * KRUTTIBASH PANDA — PREMIUM PORTFOLIO
 * script.js
 *
 * Features:
 *  - Three.js 3D background: circular star particles, wireframe 3D shapes, glowing orbs
 *  - Custom magnetic cursor with lag
 *  - Typing animation
 *  - Scroll reveal (IntersectionObserver)
 *  - 3D card tilt (profile, skill cards, project cards)
 *  - Navbar scroll + active link highlight
 *  - Hamburger mobile menu
 *  - Back-to-top button
 *  - Contact form async submit
 */

/* ============================================================
   LOADER
   ============================================================ */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('done');
  }, 1500);
});

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
(function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let cx = 0, cy = 0;   // actual mouse position
  let rx = 0, ry = 0;   // ring lerp position

  document.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
    // Dot follows instantly
    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';
  });

  // Ring follows with smooth lag
  (function lerpRing() {
    rx += (cx - rx) * 0.14;
    ry += (cy - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(lerpRing);
  })();
})();

/* ============================================================
   THREE.JS — 3D BACKGROUND
   Renders: circular star particles + wireframe shapes + glowing orbs
   NO square particles — uses a Canvas-generated circular texture
   ============================================================ */
(function init3D() {
  if (typeof THREE === 'undefined') return;

  const canvas   = document.getElementById('canvas-bg');
  if (!canvas) return;

  /* --- WebGL check --- */
  try {
    const test = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!test) return;
  } catch (e) { return; }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const cam   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
  cam.position.z = 55;

  /* ── Circular texture (prevents square particles) ── */
  function makeCircleTex() {
    const c   = document.createElement('canvas');
    c.width   = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const g   = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,   'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }
  const ptTex = makeCircleTex();

  /* ── Star / particle field ── */
  const isMobile  = window.innerWidth < 768;
  const N_STARS   = isMobile ? 280 : 600;
  const starGeo   = new THREE.BufferGeometry();
  const sPos      = new Float32Array(N_STARS * 3);
  const sCol      = new Float32Array(N_STARS * 3);
  const palette   = [
    new THREE.Color('#00e5ff'),
    new THREE.Color('#7b2fff'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#a0c8ff'),
    new THREE.Color('#ff3cac'),
  ];

  for (let i = 0; i < N_STARS; i++) {
    sPos[i * 3]     = (Math.random() - 0.5) * 180;
    sPos[i * 3 + 1] = (Math.random() - 0.5) * 180;
    sPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    const col = palette[Math.floor(Math.random() * palette.length)];
    sCol[i * 3]     = col.r;
    sCol[i * 3 + 1] = col.g;
    sCol[i * 3 + 2] = col.b;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(sCol, 3));

  const starMat = new THREE.PointsMaterial({
    size:            0.55,
    map:             ptTex,       // <-- circular texture = no squares
    alphaTest:       0.01,
    transparent:     true,
    opacity:         0.65,
    vertexColors:    true,
    depthWrite:      false,
    blending:        THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  /* ── Glowing orbs ── */
  function addOrb(color, x, y, z, radius) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 24),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.12,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
  const orb1 = addOrb(0x00e5ff,  18,  8, -20, 12);
  const orb2 = addOrb(0x7b2fff, -20, -6, -15, 10);
  const orb3 = addOrb(0xff3cac,   8,-14, -18,  8);

  /* ── Wireframe icosahedron ── */
  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(10, 1),
    new THREE.MeshBasicMaterial({
      color: 0x00e5ff, wireframe: true,
      transparent: true, opacity: 0.055,
      blending: THREE.AdditiveBlending,
    })
  );
  ico.position.set(22, -5, -10);
  scene.add(ico);

  /* ── Wireframe torus ── */
  const tor = new THREE.Mesh(
    new THREE.TorusGeometry(7, 2.5, 16, 48),
    new THREE.MeshBasicMaterial({
      color: 0x7b2fff, wireframe: true,
      transparent: true, opacity: 0.045,
      blending: THREE.AdditiveBlending,
    })
  );
  tor.position.set(-22, 6, -12);
  scene.add(tor);

  /* ── Mouse parallax ── */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Pause when tab hidden ── */
  let paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  /* ── Animation loop ── */
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    if (paused) return;

    const t = clock.getElapsedTime();

    // Smooth camera parallax
    cam.position.x += (mouseX * 0.8  - cam.position.x) * 0.04;
    cam.position.y += (-mouseY * 0.8 - cam.position.y) * 0.04;
    cam.position.z  = 55 + scrollY * 0.012;

    // Rotate 3D shapes
    ico.rotation.x = t * 0.18;
    ico.rotation.y = t * 0.12;
    tor.rotation.x = t * 0.10;
    tor.rotation.z = t * 0.15;

    // Bob orbs
    orb1.position.y =  8  + Math.sin(t * 0.40) * 3;
    orb2.position.y = -6  + Math.cos(t * 0.30) * 3;
    orb3.position.y = -14 + Math.sin(t * 0.50 + 1) * 2;

    // Slowly rotate entire star field
    scene.rotation.y = t * 0.006;

    renderer.render(scene, cam);
  })();
})();

/* ============================================================
   TYPING ANIMATION
   ============================================================ */
(function initTyping() {
  const el = document.getElementById('type-el');
  if (!el) return;

  const roles = [
    'Machine Learning Enthusiast',
    'Web Developer',
    'AI / ML Developer',
    'Problem Solver',
  ];
  let ri = 0, ci = 0, deleting = false;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = roles[0];
    return;
  }

  function tick() {
    const cur = roles[ri];
    el.textContent = deleting ? cur.slice(0, --ci) : cur.slice(0, ++ci);

    if (!deleting && ci === cur.length) {
      deleting = true;
      setTimeout(tick, 2200);
      return;
    }
    if (deleting && ci === 0) {
      deleting = false;
      ri = (ri + 1) % roles.length;
      setTimeout(tick, 500);
      return;
    }
    setTimeout(tick, deleting ? 46 : 92);
  }
  tick();
})();

/* ============================================================
   SCROLL REVEAL (IntersectionObserver)
   ============================================================ */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('vis');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-l, .reveal-r, .fade-in')
    .forEach(el => obs.observe(el));
})();

/* ============================================================
   NAVBAR — scroll state + active link + hamburger
   ============================================================ */
(function initNav() {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const ham      = document.getElementById('ham');
  const navEl    = document.getElementById('navLinks');
  const btt      = document.getElementById('btt');

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;

    // Navbar background
    if (navbar) navbar.classList.toggle('scrolled', sy > 60);

    // Back-to-top visibility
    if (btt) btt.classList.toggle('show', sy > 300);

    // Active link
    let current = '';
    sections.forEach(s => {
      if (sy >= s.offsetTop - 200) current = s.id;
    });
    navLinks.forEach(l => {
      l.classList.remove('active');
      if (l.getAttribute('href') === '#' + current) l.classList.add('active');
    });
  }, { passive: true });

  // Smooth scroll nav clicks
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu
      if (navEl)  navEl.classList.remove('open');
      if (ham)  { ham.classList.remove('open'); ham.setAttribute('aria-expanded', 'false'); }
    });
  });

  // Hamburger toggle
  if (ham && navEl) {
    ham.addEventListener('click', () => {
      const open = ham.classList.toggle('open');
      navEl.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', String(open));
    });
  }
})();

/* ============================================================
   BACK TO TOP
   ============================================================ */
(function initBtt() {
  const btt = document.getElementById('btt');
  if (!btt) return;
  btt.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ============================================================
   3D TILT — Profile card (strong tilt)
   ============================================================ */
(function initProfileTilt() {
  // Skip on touch/mobile
  if (window.matchMedia('(hover: none)').matches) return;
  const card = document.getElementById('profileCard');
  if (!card) return;

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transition = 'transform .08s';
    card.style.transform  = `perspective(800px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) scale(1.03)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .55s cubic-bezier(0.16,1,0.3,1)';
    card.style.transform  = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
  });
})();

/* ============================================================
   3D TILT — Skill categories & Project cards (desktop only)
   ============================================================ */
(function initCardTilts() {
  // Skip on touch/mobile — causes jank, no hover state anyway
  if (window.matchMedia('(hover: none)').matches) return;

  const cards = document.querySelectorAll('.skill-cat, .proj-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transition = 'transform .08s';
      card.style.transform  = `perspective(700px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .5s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform  = '';
    });
  });
})();

/* ============================================================
   CONTACT FORM — async Formspree submit
   ============================================================ */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  function setStatus(msg, ok) {
    let el = form.querySelector('[data-status]');
    if (!el) {
      el = document.createElement('p');
      el.setAttribute('data-status', '');
      el.style.cssText = 'margin-top:12px;font-size:.85rem;font-family:var(--font-mono,monospace);letter-spacing:.05em;';
      form.appendChild(el);
    }
    el.style.color = ok ? 'var(--c1)' : '#f87171';
    el.textContent = msg;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = form.querySelector('button[type="submit"]');
    const orig = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
      btn.disabled  = true;
    }
    try {
      const res = await fetch(form.action, {
        method:  'POST',
        body:    new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('✓ Message sent — thank you!', true);
        form.reset();
      } else {
        setStatus('✕ Something went wrong. Please try again.', false);
      }
    } catch {
      setStatus('✕ Network error. Please check your connection.', false);
    }
    if (btn) {
      btn.innerHTML = orig;
      btn.disabled  = false;
    }
  });
})();
