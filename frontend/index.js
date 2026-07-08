import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const canvas = document.querySelector('.webgl')
const scene = new THREE.Scene()

const loader = new GLTFLoader()
loader.load('assets/hospital.glb', function(glb) {
    console.log(glb)
    const root = glb.scene
    root.scale.set(0.01, 0.01, 0.01)
    scene.add(root)
}, function(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded')
}, function(error) {
    console.log('An error occured')
})

const light = new THREE.AmbientLight(0xffffff, 1)
light.position.set(2, 2, 5)
scene.add(light)

// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({ 
//     color: 0x00ff00 
// })
// const boxMesh = new THREE.Mesh(geometry, material)
// scene.add(boxMesh)

//Boiler Plate Code
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 1, 2)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.gammaOutput = true
renderer.render(scene, camera)

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
animate()