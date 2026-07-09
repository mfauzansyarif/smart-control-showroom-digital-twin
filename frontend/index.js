import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const canvas = document.querySelector('.webgl')
const scene = new THREE.Scene()

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
// camera.position.set(2, 1, 2)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// renderer.gammaOutput = true
// renderer.render(scene, camera)

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement)
// controls.panSpeed = 0.5
// controls.rotateSpeed = 0.5
controls.maxDistance = 100
// controls.enablePan = false 
controls.enableDamping = true

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2)
scene.add(hemiLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
dirLight.position.set(5, 10, 7.5)
scene.add(dirLight)
// const light = new THREE.AmbientLight(0xffffff, 1)
// light.position.set(2, 2, 5)
// scene.add(light)

const deviceMeshes = {
    lamp: null,
    tv: null
}

const loader = new GLTFLoader()
loader.load('assets/hospital.glb', function(glb) {
    const root = glb.scene
    scene.add(root)

    // Auto Fit Camera
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    console.log('Model size:', size)
    console.log('Model center:', center)

    // Camera Starting Position
    const maxDim = Math.max(size.x, size.y, size.z)
    camera.position.set(
        center.x + maxDim,
        center.y + maxDim * 0.5,
        center.z + maxDim
    )
    camera.lookAt(center)
    controls.target.copy(center)
    controls.update()

    root.traverse(function(child) {
        if (child.isMesh) {
            if (child.name === 'mesh_104') {
                deviceMeshes.lamp = child
                child.material = child.material.clone()
            }
            if (child.name === 'mesh_40') {
                deviceMeshes.tv = child
                child.material = child.material.clone()
            }
        }
    })

    console.log('Device meshes found:', deviceMeshes)

}, function(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded')
}, function(error) {
    console.log('An error occured')
})

function setLampState(isOn) {
    if (!deviceMeshes.lamp) return
    const mat = deviceMeshes.lamp.material
    if (isOn) {
        mat.emissive = new THREE.Color(0xffdd88)
        mat.emissiveIntensity = 1.5
    } else {
        mat.emissive = new THREE.Color(0x000000)
        mat.emissiveIntensity = 0
    }
}

function setTvState(isOn) {
    if (!deviceMeshes.tv) return
    const mat = deviceMeshes.tv.material
    if (isOn) {
        mat.emissive = new THREE.Color(0x3399ff)
        mat.emissiveIntensity = 1.0
    } else {
        mat.emissive = new THREE.Color(0x000000)
        mat.emissiveIntensity = 0
    }
}

window.setLampState = setLampState
window.setTvState = setTvState

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}
animate()