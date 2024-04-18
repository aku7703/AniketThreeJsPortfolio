import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

//Scene
const scene = new THREE.Scene()

//Create globe
const earthGeometry = new THREE.SphereGeometry(4.5, 32, 32);
const textureLoader = new THREE.TextureLoader()
const earthTexture = textureLoader.load('2k_earth_nightmap.jpg')
//const earthNormalMap = textureLoader.load('2k_earth_normal_map.jpg')
const material = new THREE.MeshStandardMaterial({ 
  map: earthTexture, 
  //normalMap: earthNormalMap,
});
const earthMesh = new THREE.Mesh(earthGeometry, material)
scene.add(earthMesh)

// Load Satellite
/*const loader = new GLTFLoader()
loader.load(
  'generated_1ru-genericcubesat.glb',
  function (gltf) {
    const satellite = gltf.scene
    satellite.scale.set(0.1, 0.1, 0.1) // Scale the satellite as needed
    scene.add(satellite)
  },
  undefined,
  function (error) {
    console.error('Error loading satellite GLB model', error)
  }
)*/
const satelliteGeometry = new THREE.SphereGeometry(0.1, 8, 8)
const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const satelliteMesh = new THREE.Mesh(satelliteGeometry, satelliteMaterial)
scene.add(satelliteMesh)

// Satellite orbit parameters
const orbitRadius = 5
const orbitSpeed = 0.01


//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

//Light
const light1 = new THREE.PointLight(0xffffff, 700, 15)
light1.position.set(0, 10, 10)
const light2 = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(light1)
scene.add(light2)

//Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height,
 0.1, 100)
camera.position.z = 20
scene.add(camera)

//Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({canvas})
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)

// Renderer
/*const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)*/

//Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;

//Resize
/*window.addEventListener('resize', () => {
  //Update Sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  //Update Camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
})*/

//Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

/*const loop = () => {
  controls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(loop)
}
loop()*/

// Animation loop
const animate = () => {
  requestAnimationFrame(animate)
  controls.update()

  // Update satellite position
  const time = Date.now() * 0.001
  const satellitePosition = new THREE.Vector3(
    Math.cos(time * orbitSpeed) * orbitRadius,
    0,
    Math.sin(time * orbitSpeed) * orbitRadius
  )
  if (scene.getObjectByName('satellite')) {
    const satellite = scene.getObjectByName('satellite')
    satellite.position.copy(satellitePosition)
  }

  renderer.render(scene, camera)
}
animate()


//Timeline
const tl = gsap.timeline({defaults: {duration: 1}})
tl.fromTo(earthMesh.scale, {z:0, x:0, y:0}, {z: 1, x: 1, y: 1})

