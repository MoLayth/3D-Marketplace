import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, render, controls, textureLoader, Timer;
let model = null;
let animationFrameId = null;

export function init3DView() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    // Avoid duplicate initialization on same canvas
    if (render && render.domElement.parentNode === canvas) {
        return;
    }

    // Canvas container cleanup if re-initializing
    canvas.innerHTML = '';

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1, 5);

    textureLoader = new THREE.TextureLoader();
    render = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    canvas.appendChild(render.domElement);

    controls = new OrbitControls(camera, render.domElement);
    controls.enablePan = false;

    Timer = new THREE.Timer();
    Timer.connect(document);

    startAnimationLoop();
}

function startAnimationLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function animate(timestamp) {
        animationFrameId = requestAnimationFrame(animate);
        if (Timer) Timer.update(timestamp);
        if (controls) controls.update();
        if (render && scene && camera) render.render(scene, camera);
    }

    animate();
}

export function SetThe3dScene(_3dModelPath, materialsInfo, sceneInfo) {
    if (!scene) init3DView();
    if (!_3dModelPath) {
        console.error("SetThe3dScene error: _3dModelPath is missing or undefined.");
        return;
    }

    const materialMap = new Map();
    if (Array.isArray(materialsInfo)) {
        materialsInfo.forEach((material) => {
            if (material.name) {
                materialMap.set(material.name, material.modelMaterial);
            }
        });
    }

    // Clean up previous model to free memory
    if (model) {
        scene.remove(model);
        model.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else if (child.material) {
                    child.material.dispose();
                }
            }
        });
        model = null;
    }

    if (_3dModelPath.toLowerCase().endsWith('.fbx')) {
        const loader = new FBXLoader();
        loader.load(_3dModelPath, (fbx) => setupLoadedModel(fbx, materialMap));
    } else if (_3dModelPath.toLowerCase().endsWith('.gltf') || _3dModelPath.toLowerCase().endsWith('.glb')) {
        const loader = new GLTFLoader();
        loader.load(_3dModelPath, (gltf) => setupLoadedModel(gltf.scene, materialMap));
    }

    SetScene(sceneInfo);
}

function SetScene(sceneInfo) {
    if (!sceneInfo) return;

    camera.position.z = sceneInfo.cameraDefaultZPos || 5;

    const rotX = sceneInfo.viewDefaultRotation?.x ?? 0;
    const rotY = sceneInfo.viewDefaultRotation?.y ?? 0;
    camera.rotation.set(rotX, rotY, 0);

    const hdriPath = sceneInfo.HDRI || sceneInfo.hdri;
    const bgPath = sceneInfo.Background || sceneInfo.background;

    if (hdriPath) {
        textureLoader.load(hdriPath, (t) => {
            t.mapping = THREE.EquirectangularReflectionMapping;
            t.colorSpace = THREE.SRGBColorSpace;
            scene.environment = t;
        });
    }

    if (bgPath) {
        textureLoader.load(bgPath, (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            scene.background = t;
        });
    }

    render.toneMappingExposure = sceneInfo.sceneBrightness || 1.0;
}

function setupLoadedModel(loadedSceneOrObject, materialMap) {
    model = loadedSceneOrObject;

    model.traverse((child) => {
        if (child.isMesh) {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map((mat) => materialMap.get(mat.name) || mat);
                } else {
                    child.material = materialMap.get(child.material.name) || child.material;
                }
            }
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(model);
}

export function resize() {
    const canvas = document.getElementById('canvas');
    if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) return;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    render.setSize(canvas.clientWidth, canvas.clientHeight);
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Global window resize listener
window.addEventListener('resize', resize);