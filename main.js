import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// ========================================
// THREE.JS SCENE SETUP
// ========================================

const scene = new THREE.Scene()
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

// Create globe
const earthGeometry = new THREE.SphereGeometry(4.8, 32, 32)
const textureLoader = new THREE.TextureLoader()
const earthTexture = textureLoader.load('2k_earth_nightmap.webp')
const material = new THREE.MeshStandardMaterial({ 
  map: earthTexture, 
})
const earthMesh = new THREE.Mesh(earthGeometry, material)
scene.add(earthMesh)

// Load Satellite
const loader = new GLTFLoader()
loader.load(
  'generated_1ru-genericcubesat.glb',
  function (gltf) {
    const satellite = gltf.scene
    satellite.scale.set(0.3, 0.3, 0.3)
    satellite.name = 'satelliteMesh'
    scene.add(satellite)
  },
  undefined,
  function (error) {
    console.error('Error loading satellite GLB model', error)
  }
)

const satelliteGeometry = new THREE.SphereGeometry(0.1, 1, 1)
const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const satelliteMesh = new THREE.Mesh(satelliteGeometry, satelliteMaterial)
scene.add(satelliteMesh)

// Satellite orbit parameters
const orbitRadius = 6
const orbitSpeed = 0.4

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

// Light
const light1 = new THREE.PointLight(0xffffff, 700, 15)
light1.position.set(0, 10, 10)
const light2 = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(light1)
scene.add(light2)

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 20
scene.add(camera)

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({canvas, alpha: true})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000, 0)
renderer.render(scene, camera)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false
controls.enableZoom = false
controls.autoRotate = true
controls.autoRotateSpeed = 0.8

// Resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Animation loop
const animate = () => {
  window.requestAnimationFrame(animate)
  controls.update()

  // Update satellite position and rotation
  const time = Date.now() * 0.001
  const orbitAngle = time * orbitSpeed
  const orbitTiltAngle = Math.PI / 4

  const satellitePosition = new THREE.Vector3(
    Math.cos(orbitAngle) * orbitRadius,
    Math.sin(orbitAngle) * Math.sin(orbitTiltAngle) * orbitRadius,
    Math.sin(orbitAngle) * Math.cos(orbitTiltAngle) * orbitRadius
  )
  
  const satellite = scene.getObjectByName('satelliteMesh')
  if (satellite) {
    satellite.position.copy(satellitePosition)
    satellite.rotation.y = orbitAngle * 2
    satellite.rotation.x = orbitAngle
    satellite.rotation.z = orbitAngle * 1.5
  }

  renderer.render(scene, camera)
}
animate()

// Timeline animation for globe
const tl = gsap.timeline({defaults: {duration: 1}})
tl.fromTo(earthMesh.scale, {z:0, x:0, y:0}, {z: 1, x: 1, y: 1})

// ========================================
// SATELLITE CLICK HANDLER
// ========================================

window.addEventListener('mousemove', (event) => {
  pointer.x = (event.clientX / sizes.width) * 2 - 1
  pointer.y = -(event.clientY / sizes.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObject(earthMesh)

  if (intersects.length > 0) {
    const filteredIntersects = intersects.filter(intersect => intersect.object !== earthMesh)
    
    if (filteredIntersects.length > 0) {
      const [intersect] = filteredIntersects
      const { point } = intersect
      satelliteMesh.position.copy(point)
    }
  }
})

window.addEventListener('click', (event) => {
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObject(scene, true)

  if (intersects.length > 0) {
    if (intersects[0].object.name.includes("imagetostl")) {
      window.location.href = 'https://www.horizonsat.org/'
    }
  }
})

// ========================================
// NAVIGATION & SCROLL HANDLING
// ========================================

const nav = document.getElementById('main-nav')
const mobileMenuBtn = document.querySelector('.mobile-menu-btn')
const navLinks = document.querySelector('.nav-links')

// Scroll-aware navigation
window.addEventListener('scroll', () => {
  if (window.scrollY > 100) {
    nav.classList.add('scrolled')
  } else {
    nav.classList.remove('scrolled')
  }
})

// Mobile menu toggle
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active')
    navLinks.classList.toggle('active')
  })
}

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuBtn.classList.remove('active')
    navLinks.classList.remove('active')
  })
})

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()
    const targetId = this.getAttribute('href')
    const targetElement = document.querySelector(targetId)
    
    if (targetElement) {
      const navHeight = nav.offsetHeight
      const targetPosition = targetElement.offsetTop - navHeight
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      })
    }
  })
})

// ========================================
// SCROLL REVEAL ANIMATIONS
// ========================================

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
}

const revealOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed')
    }
  })
}, observerOptions)

// Observe all sections
document.querySelectorAll('.section').forEach(section => {
  section.classList.add('reveal-section')
  revealOnScroll.observe(section)
})

// Add reveal animation CSS dynamically
const style = document.createElement('style')
style.textContent = `
  .reveal-section {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .reveal-section.revealed {
    opacity: 1;
    transform: translateY(0);
  }
`
document.head.appendChild(style)

// ========================================
// STARFIELD GENERATION
// ========================================

const starfield = document.getElementById('starfield')
if (starfield) {
  const count = 120
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div')
    star.classList.add('star')
    const size = Math.random() * 2.5 + 1
    star.style.width = `${size}px`
    star.style.height = `${size}px`
    star.style.left = `${Math.random() * 100}%`
    star.style.top = `${Math.random() * 100}%`
    star.style.animationDuration = `${Math.random() * 3 + 2}s`
    star.style.animationDelay = `${Math.random() * 5}s`
    starfield.appendChild(star)
  }

  // Parallax: shift stars opposite to mouse movement
  let starX = 0, starY = 0
  let targetX = 0, targetY = 0

  window.addEventListener('mousemove', (event) => {
    targetX = ((event.clientX / window.innerWidth) - 0.5) * -30
    targetY = ((event.clientY / window.innerHeight) - 0.5) * -30
  })

  const updateStarfield = () => {
    starX += (targetX - starX) * 0.05
    starY += (targetY - starY) * 0.05
    starfield.style.transform = `translate(${starX}px, ${starY}px)`
    requestAnimationFrame(updateStarfield)
  }
  updateStarfield()
}

// ========================================
// LUNAR LANDER SCROLL INDICATOR
// ========================================

const lunarLander = document.getElementById('lunar-lander')
const dustCloud = document.getElementById('dust-cloud')

if (lunarLander) {
  let wasLanded = false
  
  const updateLanderPosition = () => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
    
    // Calculate lander position
    // Start: -60px (above viewport)
    // End: lands precisely on moon surface
    const startPos = -60
    const landerHeight = 48
    const moonHeight = 30
    const moonOffset = 22 // moon extends further past viewport - lander lands lower
    const endPos = window.innerHeight - moonHeight - landerHeight + moonOffset
    const currentPos = startPos + (scrollPercent * (endPos - startPos))
    
    lunarLander.style.top = `${currentPos}px`
    
    // Check if landed (at bottom)
    const isLanded = scrollPercent >= 0.98
    
    if (isLanded && !wasLanded) {
      // Just landed - trigger dust cloud
      lunarLander.classList.add('landed')
      if (dustCloud) {
        dustCloud.classList.remove('active')
        // Force reflow to restart animation
        void dustCloud.offsetWidth
        dustCloud.classList.add('active')
      }
      wasLanded = true
    } else if (!isLanded && wasLanded) {
      // Left landing zone
      lunarLander.classList.remove('landed')
      wasLanded = false
    }
  }
  
  window.addEventListener('scroll', updateLanderPosition, { passive: true })
  window.addEventListener('resize', updateLanderPosition, { passive: true })
  updateLanderPosition() // Initial position
}


