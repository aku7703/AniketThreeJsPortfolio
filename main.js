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
// SPACE INVADERS MINI-GAME
// ========================================

class SpaceInvadersGame {
  constructor(canvas, scoreEl) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.scoreEl = scoreEl
    this.running = false
    this.animFrameId = null
    this.W = 400
    this.H = 600
    canvas.width = this.W
    canvas.height = this.H
    this.keys = { left: false, right: false, fire: false }
    this.lastFireTime = 0
    this.reset()
  }

  reset() {
    this.score = 0
    this.gameOver = false
    this.player = { x: this.W / 2, y: this.H - 40, w: 30, h: 20, speed: 4 }
    this.bullets = []
    this.enemyBullets = []
    this.invaders = []
    this.invaderDir = 1
    this.invaderSpeed = 0.5
    this.invaderDropAmount = 20
    this.spawnWave()
  }

  spawnWave() {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        this.invaders.push({
          x: 55 + col * 45,
          y: 50 + row * 40,
          w: 28, h: 20, alive: true
        })
      }
    }
  }

  start() {
    this.running = true
    this.reset()
    this.loop()
  }

  stop() {
    this.running = false
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId)
  }

  loop() {
    if (!this.running) return
    this.update()
    this.draw()
    this.animFrameId = requestAnimationFrame(() => this.loop())
  }

  update() {
    if (this.gameOver) return

    if (this.keys.left) this.player.x = Math.max(this.player.w / 2, this.player.x - this.player.speed)
    if (this.keys.right) this.player.x = Math.min(this.W - this.player.w / 2, this.player.x + this.player.speed)

    const now = Date.now()
    if (this.keys.fire && now - this.lastFireTime > 300) {
      this.bullets.push({ x: this.player.x, y: this.player.y - this.player.h / 2, speed: 6 })
      this.lastFireTime = now
    }

    this.bullets = this.bullets.filter(b => { b.y -= b.speed; return b.y > 0 })
    this.enemyBullets = this.enemyBullets.filter(b => { b.y += b.speed; return b.y < this.H })

    let hitEdge = false
    const alive = this.invaders.filter(i => i.alive)
    alive.forEach(inv => {
      inv.x += this.invaderSpeed * this.invaderDir
      if (inv.x <= 20 || inv.x >= this.W - 20) hitEdge = true
    })
    if (hitEdge) {
      this.invaderDir *= -1
      alive.forEach(inv => inv.y += this.invaderDropAmount)
    }

    if (alive.length > 0 && Math.random() < 0.02) {
      const shooter = alive[Math.floor(Math.random() * alive.length)]
      this.enemyBullets.push({ x: shooter.x, y: shooter.y + 10, speed: 3 })
    }

    this.bullets.forEach(bullet => {
      alive.forEach(inv => {
        if (Math.abs(bullet.x - inv.x) < inv.w / 2 && Math.abs(bullet.y - inv.y) < inv.h / 2) {
          inv.alive = false
          bullet.y = -10
          this.score += 100
          this.scoreEl.textContent = `Score: ${this.score}`
        }
      })
    })

    this.enemyBullets.forEach(bullet => {
      if (Math.abs(bullet.x - this.player.x) < this.player.w / 2 &&
          Math.abs(bullet.y - this.player.y) < this.player.h / 2) {
        this.gameOver = true
      }
    })

    alive.forEach(inv => {
      if (inv.y + inv.h / 2 >= this.player.y) this.gameOver = true
    })

    if (alive.length === 0) {
      this.invaderSpeed += 0.3
      this.spawnWave()
    }
  }

  draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.W, this.H)

    ctx.fillStyle = '#00ff88'
    ctx.beginPath()
    ctx.moveTo(this.player.x, this.player.y - this.player.h / 2)
    ctx.lineTo(this.player.x - this.player.w / 2, this.player.y + this.player.h / 2)
    ctx.lineTo(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2)
    ctx.closePath()
    ctx.fill()

    this.invaders.filter(i => i.alive).forEach(inv => {
      ctx.fillStyle = '#ff6666'
      ctx.fillRect(inv.x - inv.w / 2, inv.y - inv.h / 2, inv.w, inv.h)
      ctx.fillStyle = '#000'
      ctx.fillRect(inv.x - 6, inv.y - 4, 4, 4)
      ctx.fillRect(inv.x + 2, inv.y - 4, 4, 4)
    })

    ctx.fillStyle = '#00ff88'
    this.bullets.forEach(b => ctx.fillRect(b.x - 1.5, b.y - 5, 3, 10))

    ctx.fillStyle = '#ff4444'
    this.enemyBullets.forEach(b => ctx.fillRect(b.x - 1.5, b.y - 5, 3, 10))

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, this.W, this.H)
      ctx.fillStyle = '#ff4444'
      ctx.font = '28px Poppins, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', this.W / 2, this.H / 2 - 20)
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Poppins, sans-serif'
      ctx.fillText(`Score: ${this.score}`, this.W / 2, this.H / 2 + 15)
      ctx.fillStyle = '#888'
      ctx.font = '13px Poppins, sans-serif'
      ctx.fillText('Press SPACE or tap FIRE to restart', this.W / 2, this.H / 2 + 45)
    }
  }
}

// Game wiring
const gameTrigger = document.getElementById('game-trigger')
const gameOverlay = document.getElementById('game-overlay')
const gameCanvas = document.getElementById('game-canvas')
const gameScore = document.getElementById('game-score')
const gameExit = document.getElementById('game-exit')
let game = null

if (gameTrigger && gameOverlay && gameCanvas) {
  gameTrigger.addEventListener('click', () => {
    gameOverlay.classList.add('active')
    game = new SpaceInvadersGame(gameCanvas, gameScore)
    game.start()
  })

  gameExit.addEventListener('click', () => {
    if (game) game.stop()
    game = null
    gameOverlay.classList.remove('active')
    gameScore.textContent = 'Score: 0'
  })

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (!game || !game.running) return
    if (e.key === 'ArrowLeft' || e.key === 'a') game.keys.left = true
    if (e.key === 'ArrowRight' || e.key === 'd') game.keys.right = true
    if (e.key === ' ') {
      e.preventDefault()
      game.keys.fire = true
      if (game.gameOver) { game.reset(); game.scoreEl.textContent = 'Score: 0' }
    }
  })

  window.addEventListener('keyup', (e) => {
    if (!game) return
    if (e.key === 'ArrowLeft' || e.key === 'a') game.keys.left = false
    if (e.key === 'ArrowRight' || e.key === 'd') game.keys.right = false
    if (e.key === ' ') game.keys.fire = false
  })

  // Mobile controls
  const ctrlLeft = document.getElementById('ctrl-left')
  const ctrlRight = document.getElementById('ctrl-right')
  const ctrlFire = document.getElementById('ctrl-fire')

  if (ctrlLeft && ctrlRight && ctrlFire) {
    const bind = (el, key) => {
      el.addEventListener('touchstart', (e) => { e.preventDefault(); if (game) game.keys[key] = true }, { passive: false })
      el.addEventListener('touchend', () => { if (game) game.keys[key] = false })
    }
    bind(ctrlLeft, 'left')
    bind(ctrlRight, 'right')
    bind(ctrlFire, 'fire')

    ctrlFire.addEventListener('touchstart', () => {
      if (game && game.gameOver) { game.reset(); game.scoreEl.textContent = 'Score: 0' }
    })
  }
}
