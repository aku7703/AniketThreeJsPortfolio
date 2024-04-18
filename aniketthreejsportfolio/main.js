import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'

//Scene
const scene = new THREE.Scene()

//Create globe
const geometry = new THREE.SphereGeometry(3, 10, 10);
const material = new THREE.MeshStandardMaterial({ 
  color: "#00ff83", 
});
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)


//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

//Light
const light1 = new THREE.PointLight(0xffffff, 200, 15)
light1.position.set(0, 10, 10)
const light2 = new THREE.AmbientLight(0xffffff, 0.4)
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

//Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;

//Resize
window.addEventListener('resize', () => {
  //Update Sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  //Update Camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
})

const loop = () => {
  controls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(loop)
}
loop()

//Timeline
const tl = gsap.timeline({defaults: {duration: 1}})
tl.fromTo(mesh.scale, {z:0, x:0, y:0}, {z: 1, x: 1, y: 1})
t1.fromTo("nav", { y: "-100%" }, { y: "0%" })
t1.fromTo("nav", { opacity: 0 }, { opacity: 1 })

