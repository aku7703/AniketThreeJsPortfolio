import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

//Scene
const scene = new THREE.Scene()
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

//Create globe
const earthGeometry = new THREE.SphereGeometry(4.5, 32, 323);
const textureLoader = new THREE.TextureLoader()
const earthTexture = textureLoader.load('2k_earth_nightmap.jpg')
const earthNormalMap = textureLoader.load('normal.png')
const earthSpecularMap = textureLoader.load('specular.png')
const material = new THREE.MeshStandardMaterial({ 
  map: earthTexture, 
  //normalMap: earthNormalMap,
  specularMap: earthSpecularMap,
});
const earthMesh = new THREE.Mesh(earthGeometry, material)
scene.add(earthMesh)

// Load Satellite
const loader = new GLTFLoader()
loader.load(
  'generated_1ru-genericcubesat.glb',
  function (gltf) {
    const satellite = gltf.scene
    satellite.scale.set(0.3, 0.3, 0.3) // Scale the satellite as needed
    satellite.name = 'satelliteMesh'; // Add a name to the satellite object
    satellite.addEventListener('click', () => {
      console.log('Satellite clicked!')
    }
  )
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
renderer.setClearColor(0x000000, 0); // Set clear color to transparent
renderer.render(scene, camera)



//Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;


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
  window.requestAnimationFrame(animate)
  controls.update()

  // Update satellite position and rotation
  const time = Date.now() * 0.001
  const orbitAngle = time * orbitSpeed
  const orbitTiltAngle = Math.PI / 4; // Example: tilt the orbit by 45 degrees

  // Calculate the position of the satellite with tilt
  const satellitePosition = new THREE.Vector3(
    Math.cos(orbitAngle) * orbitRadius,
    Math.sin(orbitAngle) * Math.sin(orbitTiltAngle) * orbitRadius, // Tilt the orbit
    Math.sin(orbitAngle) * Math.cos(orbitTiltAngle) * orbitRadius // Tilt the orbit
  )
  
  const satellite = scene.getObjectByName('satelliteMesh')
  if (satellite) {
    satellite.position.copy(satellitePosition)

    // Rotate the satellite along its axis
    satellite.rotation.y = orbitAngle * 2 // Rotate around y-axis
    satellite.rotation.x = orbitAngle // Rotate around x-axis
    satellite.rotation.z = orbitAngle * 1.5 // Rotate around z-axis
  }

  renderer.render(scene, camera)
}
animate()






//Timeline
const tl = gsap.timeline({defaults: {duration: 1}})
tl.fromTo(earthMesh.scale, {z:0, x:0, y:0}, {z: 1, x: 1, y: 1})

// Mouse move event listener
window.addEventListener('mousemove', (event) => {
  pointer.x = (event.clientX / sizes.width) * 2 - 1
  pointer.y = -(event.clientY / sizes.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObject(earthMesh)

  if (intersects.length > 0) {
    // Filter out the Earth mesh from the intersects
    const filteredIntersects = intersects.filter(intersect => intersect.object !== earthMesh)
    
    if (filteredIntersects.length > 0) {
      const [intersect] = filteredIntersects
      const { point } = intersect
      satelliteMesh.position.copy(point)
    }
  }
})


// Click event listener
window.addEventListener('click', (event) => {
  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObject(scene, true) // Intersect with the entire scene

  // Log information about clicked objects
  if (intersects.length > 0) {
    console.log('Clicked object:', intersects[0].object)
    if (intersects[0].object.name.includes("imagetostl")) {
      console.log('Satellite clicked!')
      window.location.href = 'https://www.horizonsat.org/';
    }
  } else {
    console.log('No object clicked.')
  }
})

// JavaScript code to adjust navbar text size for mobile-sized screens
function adjustNavbarTextSize() {
  const viewportWidth = window.innerWidth;
  const navbarLinks = document.querySelectorAll('nav li');
  
  if (viewportWidth <= 768) {
    navbarLinks.forEach(link => {
      link.style.fontSize = '0.85rem'; // Adjust the font size as needed
    });
  } else {
    navbarLinks.forEach(link => {
      link.style.fontSize = ''; // Reset to default font size
    });
  }
}

// Call the function initially and whenever the window is resized
window.addEventListener('resize', adjustNavbarTextSize);
adjustNavbarTextSize(); // Call initially

