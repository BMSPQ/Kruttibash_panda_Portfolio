/**
 * KRUTTIBASH PANDA - ULTRA PREMIUM PORTFOLIO
 * THREE.JS 3D ENGINE & INTERACTIVE ANIMATIONS
 * 
 * Features:
 * - Advanced particle system with depth and lighting
 * - Interactive camera with mouse movement and scroll
 * - Rotating 3D objects with custom materials
 * - Performance optimization for smooth rendering
 * - Loading animations and scroll-based effects
 */

// Global variables for Three.js
let scene, camera, renderer, particles, particleGeometry, particleMaterial;
let torus, torusGroup;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let scrollY = 0;
let isLoaded = false;
let animationId;

// Configuration
const config = {
  particleCount: 300,  // Reduced for better performance
  particleSize: 0.8,
  particleColor: 0x00f2ff,
  torusRadius: 5,
  torusTube: 0.5,
  torusSegmentsR: 16,
  torusSegmentsT: 100,
  cameraZ: 20,
  rotationSpeed: 0.005,
  mouseSensitivity: 0.02,
  scrollSensitivity: 0.001
};

// Initialize the 3D scene
function init() {
  // Create scene
  scene = new THREE.Scene();
  
  // Create camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = config.cameraZ;
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.autoClear = false; // Allow overlay content
  
  // Add to DOM
  document.getElementById('canvas-container').appendChild(renderer.domElement);
  
  // Add lighting
  setupLighting();
  
  // Create 3D objects
  createParticles();
  createTorus();
  
  // Event listeners
  setupEventListeners();
  
  // Start animation loop
  animate();
  
  // Initialize UI interactions
  initUI();
}

// Setup advanced lighting system
function setupLighting() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  // Point lights for depth and highlights
  const pointLight1 = new THREE.PointLight(0x00f2ff, 1, 50);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0x8a2be2, 0.8, 50);
  pointLight2.position.set(-10, -10, -10);
  scene.add(pointLight2);
  
  // Spot light for dramatic effect
  const spotLight = new THREE.SpotLight(0xffffff, 0.5);
  spotLight.position.set(0, 0, 20);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 0.5;
  spotLight.castShadow = true;
  scene.add(spotLight);
}

// Create advanced particle system
function createParticles() {
  particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.particleCount * 3);
  const colors = new Float32Array(config.particleCount * 3);
  
  const color1 = new THREE.Color(0x00f2ff);
  const color2 = new THREE.Color(0x8a2be2);
  
  for (let i = 0; i < config.particleCount * 3; i += 3) {
    // Random positions in a sphere
    const radius = 20 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);
    
    // Interpolate colors based on position
    const color = color1.clone().lerp(color2, Math.random());
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
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

// Create rotating torus with custom material
function createTorus() {
  // Create torus geometry
  const geometry = new THREE.TorusGeometry(
    config.torusRadius, 
    config.torusTube, 
    config.torusSegmentsR, 
    config.torusSegmentsT
  );
  
  // Create custom shader material for glowing effect
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
        
        // Animate vertices
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
        // Create gradient based on position
        float gradient = (vPosition.y + 10.0) / 20.0;
        vec3 color = mix(color1, color2, gradient);
        
        // Add pulsing effect
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        color *= pulse;
        
        // Add rim lighting
        float rimPower = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
        color += vec3(1.0) * pow(rimPower, 3.0);
        
        gl_FragColor = vec4(color, 0.8);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  torus = new THREE.Mesh(geometry, material);
  
  // Create group for complex rotation
  torusGroup = new THREE.Group();
  torusGroup.add(torus);
  scene.add(torusGroup);
}

// Setup event listeners
function setupEventListeners() {
  // Mouse movement
  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) / window.innerWidth;
    mouseY = (event.clientY - window.innerHeight / 2) / window.innerHeight;
  });
  
  // Window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Scroll for camera movement
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  });
  
  // Touch events for mobile
  window.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
      mouseX = (event.touches[0].clientX - window.innerWidth / 2) / window.innerWidth;
      mouseY = (event.touches[0].clientY - window.innerHeight / 2) / window.innerHeight;
    }
  });
}

// Animation loop
function animate() {
  animationId = requestAnimationFrame(animate);
  
  // Update time uniform for shaders
  if (torus && torus.material.uniforms) {
    torus.material.uniforms.time.value = performance.now() * 0.001;
  }
  
  // Smooth camera rotation based on mouse
  targetRotationX = mouseY * 2;
  targetRotationY = mouseX * 2;
  
  camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05;
  camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05;
  
  // Scroll-based camera movement
  const scrollOffset = scrollY * 10;
  camera.position.z = config.cameraZ + scrollOffset;
  
  // Animate particles
  if (particles) {
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;
  }
  
  // Animate torus
  if (torusGroup) {
    torusGroup.rotation.x += 0.005;
    torusGroup.rotation.y += 0.01;
    torusGroup.rotation.z += 0.002;
  }
  
  // Render scene
  renderer.render(scene, camera);
}

// Initialize UI interactions
function initUI() {
  // Typing animation for hero section
  initTypingAnimation();
  
  // Scroll animations
  initScrollAnimations();
  
  // Navigation
  initNavigation();
  
  // Contact form
  initContactForm();
  
  // Loading completion
  setTimeout(() => {
    document.getElementById('loader').style.opacity = 0;
    setTimeout(() => {
      document.getElementById('loader').style.display = 'none';
      isLoaded = true;
    }, 500);
  }, 2000);
}

// Typing animation for roles
function initTypingAnimation() {
  const typingElement = document.getElementById('typing-animation');
  const roles = ['Machine Learning Enthusiast', 'Web Developer', 'AI/ML Developer'];
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;
  let deletingSpeed = 50;
  let delayBetweenWords = 2000;
  
  function type() {
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
      typingElement.textContent = currentRole.substring(0, charIndex--);
      typingSpeed = deletingSpeed;
    } else {
      typingElement.textContent = currentRole.substring(0, charIndex++);
      typingSpeed = 100;
    }
    
    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      setTimeout(type, delayBetweenWords);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(type, 500);
    } else {
      setTimeout(type, typingSpeed);
    }
  }
  
  type();
}

// Scroll-based animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);
  
  // Observe all fade-in elements
  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
  
  // Back to top button
  const backToTopBtn = document.getElementById('backToTop');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Navigation functionality
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  
  // Smooth scroll for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Active navigation highlighting
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
  
  // Mobile hamburger menu
  const hamburger = document.querySelector('.hamburger');
  const navLinksContainer = document.querySelector('.nav-links');
  
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
  });
  
  // Close mobile menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinksContainer.classList.remove('active');
    });
  });
}

// Contact form functionality
function initContactForm() {
  const form = document.getElementById('contactForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // we control submission now

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
      const response = await fetch("https://formspree.io/f/xojnbyrl", {
        method: "POST",
        body: new FormData(form),
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        alert("Message sent successfully! 🚀");
        form.reset();
      } else {
        alert("Something went wrong. Try again.");
      }

    } catch (error) {
      alert("Error sending message.");
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });
}

// Performance optimization
function optimizePerformance() {
  // Reduce particle count on low-end devices
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    config.particleCount = 800;
    config.particleSize = 0.5;
  }
  
  // Adjust render quality based on device
  if (window.innerWidth < 768) {
    renderer.setPixelRatio(1);
  }
  
  // Pause animation when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio script loaded successfully');
  
  // Always hide loader after 2 seconds to prevent hanging
  setTimeout(() => {
    hideLoader();
  }, 2000);
  
  // Initialize UI interactions immediately
  initUI();
  
  // Check for WebGL support and Three.js
  if (typeof THREE !== 'undefined' && WEBGL.isWebGLAvailable()) {
    console.log('Three.js detected, initializing 3D engine');
    init();
    optimizePerformance();
  } else {
    console.log('Three.js not available, skipping 3D effects');
    hideLoader();
    // Still initialize basic UI without 3D
    initBasicUI();
  }
});

// Helper function to hide loader
function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.opacity = 0;
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
}

// Initialize basic UI without 3D effects
function initBasicUI() {
  console.log('Initializing basic UI without 3D');
  
  // Initialize UI interactions without 3D
  initTypingAnimation();
  initScrollAnimations();
  initNavigation();
  initContactForm();
  
  // Hide loader immediately
  hideLoader();
}

// Export for potential future use
window.portfolio3D = {
  init,
  animate,
  scene,
  camera,
  renderer
};

