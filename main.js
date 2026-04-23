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
const isMobile = window.matchMedia('(max-width: 768px)').matches

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

// Disable orbit controls on mobile to prevent scroll interference
if (isMobile) {
  controls.enabled = false
}

// Resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Animation loop (also handles asteroid game when active)
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

  // Asteroid game update
  if (typeof updateAsteroidGame === 'function') updateAsteroidGame()

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

// Touch support for satellite click on mobile
if (canvas) {
  canvas.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      pointer.x = (touch.clientX / sizes.width) * 2 - 1
      pointer.y = -(touch.clientY / sizes.height) * 2 + 1
    }
  }, { passive: true })

  canvas.addEventListener('touchend', () => {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObject(scene, true)
    if (intersects.length > 0) {
      if (intersects[0].object.name.includes("imagetostl")) {
        window.location.href = 'https://www.horizonsat.org/'
      }
    }
  })
}

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
    document.body.classList.toggle('menu-open')
    nav.classList.toggle('menu-open')
  })
}

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuBtn.classList.remove('active')
    navLinks.classList.remove('active')
    document.body.classList.remove('menu-open')
    nav.classList.remove('menu-open')
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
  const count = 100
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div')
    star.classList.add('star')
    const size = Math.random() * 1.5 + 0.5
    star.style.width = `${size}px`
    star.style.height = `${size}px`
    star.style.left = `${Math.random() * 100}%`
    star.style.top = `${Math.random() * 90 + 8}%`
    star.style.animationDuration = `${Math.random() * 4 + 3}s`
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

    const startPos = -60
    const landerHeight = 48
    const moonHeight = 30
    const moonOffset = 22
    const endPos = window.innerHeight - moonHeight - landerHeight + moonOffset
    const currentPos = startPos + (scrollPercent * (endPos - startPos))

    lunarLander.style.top = `${currentPos}px`

    const isLanded = scrollPercent >= 0.98

    if (isLanded && !wasLanded) {
      lunarLander.classList.add('landed')
      if (dustCloud) {
        dustCloud.classList.remove('active')
        void dustCloud.offsetWidth
        dustCloud.classList.add('active')
      }
      wasLanded = true
    } else if (!isLanded && wasLanded) {
      lunarLander.classList.remove('landed')
      wasLanded = false
    }
  }

  window.addEventListener('scroll', updateLanderPosition, { passive: true })
  window.addEventListener('resize', updateLanderPosition, { passive: true })
  updateLanderPosition()
}

// ========================================
// ASTEROID DEFENSE GAME
// ========================================

const heroSection = document.getElementById('hero')
const gameTrigger = document.getElementById('game-trigger')
const gameHud = document.getElementById('game-hud')
const gameScoreEl = document.getElementById('game-score')
const gameLivesEl = document.getElementById('game-lives')
const gameExit = document.getElementById('game-exit')

let gameActive = false
let gameScore = 0
let gameLives = 3
let asteroids = []
let lastSpawnTime = 0
let spawnInterval = 2000
// Rocky asteroid colors
const asteroidColors = [0x8B7355, 0x6B5B45, 0x9C8A6E, 0x5C4E3C, 0x7A6B55]

function createAsteroidGeometry() {
  // Start with icosahedron, then distort vertices for rocky look
  const detail = Math.floor(Math.random() * 2) + 1
  const baseSize = 0.25 + Math.random() * 0.3
  const geo = new THREE.IcosahedronGeometry(baseSize, detail)

  // Distort each vertex randomly to make it lumpy/rocky
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const vertex = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))
    const dist = vertex.length()
    // Push vertices in/out randomly for craters and bumps
    const noise = 1 + (Math.random() - 0.5) * 0.5
    vertex.normalize().multiplyScalar(dist * noise)
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
  geo.computeVertexNormals()
  return geo
}

function createAsteroidMaterial() {
  const color = asteroidColors[Math.floor(Math.random() * asteroidColors.length)]
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  })
}

function spawnAsteroid() {
  const geo = createAsteroidGeometry()
  const mat = createAsteroidMaterial()
  const mesh = new THREE.Mesh(geo, mat)

  // Spawn only from the camera-facing hemisphere (positive z)
  // so asteroids are always visible, never hidden behind Earth
  const angle = (Math.random() - 0.5) * Math.PI * 1.2  // spread across front
  const elevation = (Math.random() - 0.5) * Math.PI * 0.6
  const dist = 14 + Math.random() * 4
  mesh.position.set(
    Math.sin(angle) * Math.cos(elevation) * dist,
    Math.sin(elevation) * dist,
    Math.abs(Math.cos(angle) * Math.cos(elevation)) * dist  // always positive z (toward camera)
  )

  // Direction toward Earth center with slight offset
  const target = new THREE.Vector3(
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.5,
    0
  )
  const dir = target.clone().sub(mesh.position).normalize()
  const speed = 0.02 + Math.random() * 0.015
  const tumbleX = (Math.random() - 0.5) * 0.06
  const tumbleY = (Math.random() - 0.5) * 0.06

  mesh.userData = { dir, speed, alive: true, tumbleX, tumbleY }
  mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
  scene.add(mesh)
  asteroids.push(mesh)
}

function destroyAsteroid(mesh) {
  mesh.userData.alive = false
  // Quick scale-down animation
  gsap.to(mesh.scale, {
    x: 0, y: 0, z: 0,
    duration: 0.2,
    onComplete: () => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
  })
}

function startGame() {
  gameActive = true
  gameScore = 0
  gameLives = 3
  asteroids = []
  lastSpawnTime = Date.now()
  spawnInterval = 2000
  heroSection.classList.add('game-active')
  gameHud.classList.add('active')
  gameScoreEl.textContent = 'Score: 0'
  gameLivesEl.textContent = '❤️'.repeat(gameLives)
  canvas.style.cursor = 'crosshair'
}

function endGame() {
  gameActive = false
  heroSection.classList.remove('game-active')
  gameHud.classList.remove('active')
  canvas.style.cursor = ''
  // Clean up remaining asteroids
  asteroids.forEach(a => {
    scene.remove(a)
    a.geometry.dispose()
    a.material.dispose()
  })
  asteroids = []
}

// Game update function called from the main animate loop
window.updateAsteroidGame = function () {
  if (!gameActive) return

  const now = Date.now()

  // Spawn asteroids
  if (now - lastSpawnTime > spawnInterval) {
    spawnAsteroid()
    lastSpawnTime = now
    spawnInterval = Math.max(600, spawnInterval - 30)
  }

  // Move asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i]
    if (!a.userData.alive) {
      asteroids.splice(i, 1)
      continue
    }

    a.position.add(a.userData.dir.clone().multiplyScalar(a.userData.speed))
    a.rotation.x += a.userData.tumbleX
    a.rotation.y += a.userData.tumbleY

    // Hit Earth
    if (a.position.length() < 5.2) {
      destroyAsteroid(a)
      asteroids.splice(i, 1)
      gameLives--
      gameLivesEl.textContent = '❤️'.repeat(Math.max(0, gameLives))
      earthMesh.material.color.set(0xff4444)
      setTimeout(() => earthMesh.material.color.set(0xffffff), 200)

      if (gameLives <= 0) {
        gameScoreEl.textContent = `Game Over! Score: ${gameScore}`
        setTimeout(endGame, 2000)
      }
    }

    // Too far, remove
    if (a.position.length() > 25) {
      scene.remove(a)
      a.geometry.dispose()
      a.material.dispose()
      asteroids.splice(i, 1)
    }
  }
}

const gameRaycaster = new THREE.Raycaster()
const gamePointer = new THREE.Vector2()

// Click/tap to destroy asteroids
function handleGameClick(clientX, clientY) {
  if (!gameActive) return

  gamePointer.x = (clientX / sizes.width) * 2 - 1
  gamePointer.y = -(clientY / sizes.height) * 2 + 1
  gameRaycaster.setFromCamera(gamePointer, camera)

  const hits = gameRaycaster.intersectObjects(asteroids)
  if (hits.length > 0) {
    const hit = hits[0].object
    if (hit.userData.alive) {
      destroyAsteroid(hit)
      gameScore += 10
      gameScoreEl.textContent = `Score: ${gameScore}`
    }
  }
}

canvas.addEventListener('click', (e) => handleGameClick(e.clientX, e.clientY))
canvas.addEventListener('touchend', (e) => {
  if (e.changedTouches.length > 0) {
    const t = e.changedTouches[0]
    handleGameClick(t.clientX, t.clientY)
  }
})

// Wire up buttons
if (gameTrigger) {
  gameTrigger.addEventListener('click', (e) => {
    e.stopPropagation()
    startGame()
  })
}

if (gameExit) {
  gameExit.addEventListener('click', (e) => {
    e.stopPropagation()
    endGame()
  })
}

