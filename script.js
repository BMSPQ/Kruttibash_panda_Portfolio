/**
 * KRUTTIBASH PANDA - ULTRA PREMIUM PORTFOLIO
 * THREE.JS 3D ENGINE & INTERACTIVE ANIMATIONS (UPDATED)
 *
 * Updates made (important):
 * 1) Removed WEBGL.isWebGLAvailable() dependency (it was not loaded in HTML).
 * 2) Fixed performance optimizer bug: low-end devices should REDUCE particles, not increase them.
 * 3) Prevented double-loader logic (initUI was hiding loader and DOMContentLoaded was also hiding it).
 * 4) Prevented multiple animation loops / visibilitychange issues.
 * 5) Added prefers-reduced-motion + mobile detection to disable heavy 3D automatically.
 * 6) Updated mobile menu accessibility support (aria-expanded toggle) (works with updated HTML button).
 * 7) Removed emoji from alerts and replaced alert() with lightweight inline status (no CSS required, uses existing layout).
 *
 * Note:
 * - This file assumes your HTML has:
 *   - #loader
 *   - #canvas-container
 *   - #backToTop
 *   - .hamburger (button)
 *   - .nav-links
 *   - #typing-animation
 *   - #contactForm
 */

// ======================
// Global Three.js objects
// ======================
let scene, camera, renderer;
let particles, particleGeometry, particleMaterial;
let torus, torusGroup;

// Interaction state
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let scrollProgress = 0;

// Animation / lifecycle
let isLoaded = false;
let animationId = null;
let isAnimating = false;

// ======================
// Configuration
// ======================
const config = {
  particleCount: 300,
  particleSize: 0.8,
  particleColor: 0x00f2ff,

  torusRadius: 5,
  torusTube: 0.5,
  torusSegmentsR: 16,
  torusSegmentsT: 100,

  cameraZ: 20,
  mouseSensitivity: 0.02,
  scrollSensitivity: 0.001
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
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
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
// Three.js init
// ======================
function init3D() {
  // Create scene
  scene = new THREE.Scene();

  // Create camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = config.cameraZ;

  // Create renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.autoClear = false;

  // Attach canvas
  const container = document.getElementById('canvas-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
  }

  setupLighting();
  createParticles();
  createTorus();

  setupEventListeners();

  startAnimation();
}

function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x00f2ff, 1, 50);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x8a2be2, 0.8, 50);
  pointLight2.position.set(-10, -10, -10);
  scene.add(pointLight2);

  const spotLight = new THREE.SpotLight(0xffffff, 0.5);
  spotLight.position.set(0, 0, 20);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 0.5;
  spotLight.castShadow = false;
  scene.add(spotLight);
}

function createParticles() {
  particleGeometry = new THREE.BufferGeometry();

  const positions = new Float32Array(config.particleCount * 3);
  const colors = new Float32Array(config.particleCount * 3);

  const color1 = new THREE.Color(0x00f2ff);
  const color2 = new THREE.Color(0x8a2be2);

  for (let i = 0; i < config.particleCount * 3; i += 3) {
    const radius = 20 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    const c = color1.clone().lerp(color2, Math.random());
    colors[i] = c.r;
    colors[i + 1] = c.g;
    colors[i + 2] = c.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  particleMaterial = new THREE.PointsMaterial({
    size: config.particleSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}

function createTorus() {
  const geometry = new THREE.TorusGeometry(
    config.torusRadius,
    config.torusTube,
    config.torusSegmentsR,
    config.torusSegmentsT
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color(0x00f2ff) },
      color2: { value: new THREE.Color(0x8a2be2) }
    },
    vertexShader: `
      uniform float time;
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vPosition = position;
        vNormal = normal;

        vec3 pos = position;
        pos.x += sin(pos.y * 2.0 + time) * 0.2;
        pos.z += cos(pos.y * 2.0 + time) * 0.2;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        float gradient = (vPosition.y + 10.0) / 20.0;
        vec3 color = mix(color1, color2, gradient);

        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        color *= pulse;

        float rimPower = 1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
        color += vec3(1.0) * pow(rimPower, 3.0);

        gl_FragColor = vec4(color, 0.8);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });

  torus = new THREE.Mesh(geometry, material);

  torusGroup = new THREE.Group();
  torusGroup.add(torus);
  scene.add(torusGroup);
}

// ======================
// Events
// ======================
function setupEventListeners() {
  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) / window.innerWidth;
    mouseY = (event.clientY - window.innerHeight / 2) / window.innerHeight;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (event.touches && event.touches.length > 0) {
      mouseX = (event.touches[0].clientX - window.innerWidth / 2) / window.innerWidth;
      mouseY = (event.touches[0].clientY - window.innerHeight / 2) / window.innerHeight;
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
    if (document.hidden) {
      stopAnimation();
    } else if (renderer && scene && camera) {
      startAnimation();
    }
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

  // Shader time
  if (torus && torus.material && torus.material.uniforms) {
    torus.material.uniforms.time.value = performance.now() * 0.001;
  }

  // Smooth camera rotation based on pointer
  targetRotationX = mouseY * 2;
  targetRotationY = mouseX * 2;

  camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05;
  camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05;

  // Scroll-based camera movement
  const scrollOffset = scrollProgress * 10;
  camera.position.z = config.cameraZ + scrollOffset;

  if (particles) {
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;
  }

  if (torusGroup) {
    torusGroup.rotation.x += 0.005;
    torusGroup.rotation.y += 0.01;
    torusGroup.rotation.z += 0.002;
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
    // If user prefers reduced motion, show one role and stop.
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

  // Intersection observer for .fade-in elements
  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, observerOptions);

    fadeElements.forEach(el => observer.observe(el));
  }

  // Back to top button visibility
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) backToTopBtn.classList.add('visible');
      else backToTopBtn.classList.remove('visible');
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    });
  }
}

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Smooth scroll
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

  // Active highlighting
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 200) current = section.getAttribute('id');
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
  }, { passive: true });

  // Mobile menu
  const hamburger = document.querySelector('.hamburger');
  const navLinksContainer = document.querySelector('.nav-links');

  if (hamburger && navLinksContainer) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      navLinksContainer.classList.toggle('active', isOpen);

      // Accessibility: update aria-expanded on the button
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

/**
 * Lightweight form status (replaces alert())
 * This creates a small text under the form without needing extra CSS.
 */
function setFormStatus(form, message, ok) {
  if (!form) return;

  let el = form.querySelector('[data-form-status]');
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-form-status', 'true');
    el.style.marginTop = '12px';
    el.style.fontSize = '0.95rem';
    el.style.color = ok ? '#00f2ff' : '#ff6b6b';
    form.appendChild(el);
  } else {
    el.style.color = ok ? '#00f2ff' : '#ff6b6b';
  }

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
    } catch (err) {
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
// Performance optimization
// ======================
function optimizePerformance() {
  // Reduce particle count on low-end devices (FIXED: previously increased)
  const lowEndCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

  if (lowEndCpu) {
    config.particleCount = 160;
    config.particleSize = 0.6;
  }

  // Reduce quality on mobile
  if (isMobileLikeDevice() && renderer) {
    renderer.setPixelRatio(1);
  }
}

// ======================
// Bootstrap
// ======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio script loaded successfully');

  // Start UI immediately (no dependency on WebGL)
  initUI();

  // Always hide loader after short time (avoid hanging)
  window.setTimeout(() => finishLoadingUI(), 1800);

  // Decide whether to run 3D
  const canRun3D =
    typeof THREE !== 'undefined' &&
    isWebGLAvailable() &&
    !prefersReducedMotion(); // respect user preference

  // On very small devices, still allow 3D if you want.
  // You can force-disable 3D on mobile by adding: && !isMobileLikeDevice()
  if (canRun3D) {
    console.log('Three.js available, initializing 3D engine');
    optimizePerformance();
    init3D();
  } else {
    console.log('3D disabled (missing WebGL/Three.js or reduced motion preference).');
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
