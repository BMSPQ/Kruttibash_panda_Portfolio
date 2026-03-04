/**
 * KRUTTIBASH PANDA - PROFESSIONAL PORTFOLIO (UPDATED BACKGROUND)
 *
 * What changed vs your current JS:
 * - Replaced "torus + heavy neon" background with a subtle professional starfield.
 * - No WEBGL helper dependency (safe WebGL check included).
 * - Better performance: reduces stars on low-end + mobile, pauses on tab hidden.
 * - Keeps your UI features: typing, scroll fade, nav active, hamburger, back-to-top, contact form.
 *
 * Works with your updated HTML/CSS:
 * - #loader
 * - #canvas-container
 * - #backToTop
 * - .hamburger (button)
 * - .nav-links
 * - #typing-animation
 * - #contactForm
 */

// ======================
// Global Three.js objects
// ======================
let scene, camera, renderer;
let stars, starGeometry, starMaterial;

// Interaction state
let mouseX = 0, mouseY = 0;
let scrollProgress = 0;

// Animation / lifecycle
let isLoaded = false;
let animationId = null;
let isAnimating = false;

// ======================
// Background configuration (professional / subtle)
// ======================
const bgConfig = {
  starCount: 500,       // will be reduced automatically on low-end/mobile
  starSize: 0.7,
  starOpacity: 0.55,
  depth: 120,
  spread: 80,
  driftSpeed: 0.015,    // slow drift = premium
  parallaxStrength: 0.8,
  cameraZ: 60
};

// ======================
// Feature detection
// ======================
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileLikeDevice() {
  return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
}

/**
 * Safe WebGL check (no WEBGL helper required)
 */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(window.WebGLRenderingContext && gl);
  } catch {
    return false;
  }
}

// ======================
// Loader helpers
// ======================
function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  loader.style.opacity = '0';
  loader.setAttribute('aria-busy', 'false');

  window.setTimeout(() => {
    loader.style.display = 'none';
  }, 500);
}

/**
 * Show loader briefly but never hang forever
 */
function finishLoadingUI() {
  if (isLoaded) return;
  isLoaded = true;
  hideLoader();
}

// ======================
// Three.js init (Professional background)
// ======================
function init3D() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.z = bgConfig.cameraZ;

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const container = document.getElementById('canvas-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
  }

  setupSoftLighting();
  createStarfield();
  setupEventListeners();

  startAnimation();
}

function setupSoftLighting() {
  // Subtle ambient so stars look clean (not neon)
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
}

function createStarfield() {
  starGeometry = new THREE.BufferGeometry();

  const positions = new Float32Array(bgConfig.starCount * 3);
  const colors = new Float32Array(bgConfig.starCount * 3);

  // Soft tints: professional blue + soft purple
  const c1 = new THREE.Color(0x7dd3fc);
  const c2 = new THREE.Color(0xc4b5fd);

  for (let i = 0; i < bgConfig.starCount; i++) {
    const i3 = i * 3;

    positions[i3] = (Math.random() - 0.5) * bgConfig.spread;
    positions[i3 + 1] = (Math.random() - 0.5) * bgConfig.spread;
    positions[i3 + 2] = (Math.random() - 0.5) * bgConfig.depth;

    const t = Math.random();
    const col = c1.clone().lerp(c2, t);
    colors[i3] = col.r;
    colors[i3 + 1] = col.g;
    colors[i3 + 2] = col.b;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  starMaterial = new THREE.PointsMaterial({
    size: bgConfig.starSize,
    transparent: true,
    opacity: bgConfig.starOpacity,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// ======================
// Events
// ======================
function setupEventListeners() {
  window.addEventListener('mousemove', (event) => {
    // Normalize to [-1..1]
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (event.touches && event.touches.length > 0) {
      const t = event.touches[0];
      mouseX = (t.clientX / window.innerWidth) * 2 - 1;
      mouseY = (t.clientY / window.innerHeight) * 2 - 1;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  });

  window.addEventListener('scroll', () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? (window.scrollY / maxScroll) : 0;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimation();
    else if (renderer && scene && camera) startAnimation();
  });
}

// ======================
// Animation loop control
// ======================
function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;
  animate();
}

function stopAnimation() {
  isAnimating = false;
  if (animationId) cancelAnimationFrame(animationId);
  animationId = null;
}

function animate() {
  if (!isAnimating) return;
  animationId = requestAnimationFrame(animate);

  // Subtle parallax
  const targetX = mouseX * bgConfig.parallaxStrength;
  const targetY = -mouseY * bgConfig.parallaxStrength;

  camera.position.x += (targetX - camera.position.x) * 0.03;
  camera.position.y += (targetY - camera.position.y) * 0.03;

  // Gentle scroll zoom
  camera.position.z = bgConfig.cameraZ + scrollProgress * 10;

  // Drift stars (professional, slow) via group rotation for performance
  if (stars) {
    stars.rotation.z += bgConfig.driftSpeed * 0.01;
    stars.rotation.y += bgConfig.driftSpeed * 0.005;
  }

  renderer.render(scene, camera);
}

// ======================
// UI Interactions
// ======================
function initTypingAnimation() {
  const typingElement = document.getElementById('typing-animation');
  if (!typingElement) return;

  const roles = ['Machine Learning Enthusiast', 'Web Developer', 'AI/ML Developer'];
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const typingSpeed = 100;
  const deletingSpeed = 50;
  const delayBetweenWords = 2000;

  function type() {
    if (prefersReducedMotion()) {
      typingElement.textContent = roles[0];
      return;
    }

    const currentRole = roles[roleIndex];

    if (isDeleting) {
      typingElement.textContent = currentRole.substring(0, charIndex--);
    } else {
      typingElement.textContent = currentRole.substring(0, charIndex++);
    }

    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      setTimeout(type, delayBetweenWords);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(type, 500);
    } else {
      setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
    }
  }

  type();
}

function initScrollAnimations() {
  const backToTopBtn = document.getElementById('backToTop');

  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    fadeElements.forEach(el => observer.observe(el));
  }

  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) backToTopBtn.classList.add('visible');
      else backToTopBtn.classList.remove('visible');
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  }
}

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = targetId ? document.querySelector(targetId) : null;

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    });
  });

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 200) current = section.getAttribute('id');
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
  }, { passive: true });

  const hamburger = document.querySelector('.hamburger');
  const navLinksContainer = document.querySelector('.nav-links');

  if (hamburger && navLinksContainer) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      navLinksContainer.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

function setFormStatus(form, message, ok) {
  if (!form) return;

  let el = form.querySelector('[data-form-status]');
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-form-status', 'true');
    el.style.marginTop = '12px';
    el.style.fontSize = '0.95rem';
    form.appendChild(el);
  }

  el.style.color = ok ? '#00f2ff' : '#ff6b6b';
  el.textContent = message;
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      submitBtn.disabled = true;
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        setFormStatus(form, 'Message sent successfully. Thank you!', true);
        form.reset();
      } else {
        setFormStatus(form, 'Something went wrong. Please try again.', false);
      }
    } catch {
      setFormStatus(form, 'Network error. Please check your connection and try again.', false);
    }

    if (submitBtn) {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
    }
  });
}

function initUI() {
  initTypingAnimation();
  initScrollAnimations();
  initNavigation();
  initContactForm();
}

// ======================
// Performance optimization (for background)
// ======================
function optimizePerformance() {
  const lowEndCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

  if (lowEndCpu) {
    bgConfig.starCount = 350;
    bgConfig.starSize = 0.6;
    bgConfig.starOpacity = 0.45;
    bgConfig.driftSpeed = 0.012;
  }

  if (isMobileLikeDevice()) {
    bgConfig.starCount = Math.min(bgConfig.starCount, 300);
    bgConfig.starSize = 0.6;
    bgConfig.starOpacity = Math.min(bgConfig.starOpacity, 0.45);
    bgConfig.driftSpeed = 0.012;
  }

  // Reduce render quality on mobile
  if (isMobileLikeDevice() && renderer) {
    renderer.setPixelRatio(1);
  }
}

// ======================
// Bootstrap
// ======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio script loaded successfully');

  initUI();

  // Always hide loader after short time (avoid hanging)
  window.setTimeout(() => finishLoadingUI(), 1400);

  const canRun3D =
    typeof THREE !== 'undefined' &&
    isWebGLAvailable() &&
    !prefersReducedMotion();

  if (canRun3D) {
    console.log('Three.js available, initializing professional 3D background');
    optimizePerformance(); // adjusts bgConfig before init3D
    init3D();
  } else {
    console.log('3D background disabled (missing WebGL/Three.js or reduced motion preference).');
    finishLoadingUI();
  }
});

// Export for potential future use
window.portfolio3D = {
  init3D,
  startAnimation,
  stopAnimation,
  get scene() { return scene; },
  get camera() { return camera; },
  get renderer() { return renderer; }
};
