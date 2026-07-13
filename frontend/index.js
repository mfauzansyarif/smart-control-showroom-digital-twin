import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const canvas = document.querySelector('.webgl')
const scene = new THREE.Scene()

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.maxDistance = 100
controls.enableDamping = true

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2)
scene.add(hemiLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
dirLight.position.set(5, 10, 7.5)
scene.add(dirLight)

// Mesh References
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

    // Find device meshes by name
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

    // Set initial visual state based on fetched data
    if (initialState) {
        setLampState(initialState.lamp.on)
        setTvState(initialState.tv.on)
    }

}, function(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded')
}, function(error) {
    console.log('An error occured')
})

// Lamp Visual State Update Functions
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

// TV Visual State Update Functions
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

// Animation Loop
function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}
animate()

// WebSocket Connection to Backend
const socket = new WebSocket('ws://localhost:8000/ws')

const switchLamp = document.getElementById('switch-lamp')
const switchTv = document.getElementById('switch-tv')

// Initial Fetch to Get Current Device States
let initialState = null

fetch('http://localhost:8000/devices')
    .then(response => response.json())
    .then(data => {
        initialState = data
        switchLamp.checked = data.lamp.on
        switchTv.checked = data.tv.on
        setLampState(data.lamp.on)
        setTvState(data.tv.on)
    })

socket.onopen = function() {
    console.log('WebSocket connected')
}

socket.onmessage = function(event) {
    // Expecting JSON data with the structure: { lamp: { on: boolean }, tv: { on: boolean } }
    const data = JSON.parse(event.data)
    console.log('State update received:', data)

    // Update the visual state of devices based on the received data
    setLampState(data.lamp.on)
    setTvState(data.tv.on)

    // Update the checkbox states to reflect the current device states
    switchLamp.checked = data.lamp.on
    switchTv.checked = data.tv.on
}

socket.onclose = function() {
    console.log('WebSocket disconnected')
}

socket.onerror = function(error) {
    console.error('WebSocket error:', error)
}

// Event Listeners for Switches
switchLamp.addEventListener('click', function(event) {
    event.preventDefault()
    fetch('http://localhost:8000/lamp/toggle', { method: 'POST' })
})

switchTv.addEventListener('click', function(event) {
    event.preventDefault()
    fetch('http://localhost:8000/tv/toggle', { method: 'POST' })
})