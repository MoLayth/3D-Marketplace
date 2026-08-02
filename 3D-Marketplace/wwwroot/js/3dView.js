import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MaterialInfo } from './MyModels.js';

const scene = new THREE.Scene();
const canvas = document.getElementById('canvas');
export class SceneInfo {
    constructor(sceneBrightness, HDRI, Background, viewDefaultRotation, cameraDefaultZPos) {
        this.cameraDefaultZPos = cameraDefaultZPos || 5;
        this.HDRI = HDRI || '/resources/DefaultHDMI.jpg';
        this.Background = Background || '/resources/ModelBackground.jpg';
        this.sceneBrightness = sceneBrightness || 1.0;

        this.viewDefaultRotation = this.parseRotation(viewDefaultRotation);
    }

    parseRotation(rawRotation) {
        if (!rawRotation) return new THREE.Vector2(0, 0);

        let data = rawRotation;

        // 1. If it's a string, try parsing it
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn("Failed first JSON.parse on rotation:", rawRotation);
                return new THREE.Vector2(0, 0);
            }
        }

        // 2. If it was double-stringified, data is still a string! Parse a second time.
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn("Failed second JSON.parse on rotation:", data);
                return new THREE.Vector2(0, 0);
            }
        }

        // 3. Now data is guaranteed to be an object with {x, y}
        if (data && typeof data === 'object') {
            const x = Number(data.x) || 0;
            const y = Number(data.y) || 0;
            return new THREE.Vector2(x, y);
        }

        return new THREE.Vector2(0, 0);
    }
}
// Camera Setup
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 1, 5);

const cameraParent = new THREE.Object3D();
cameraParent.add(camera);
scene.add(cameraParent);

// Lighting (Essential so models don't render black)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();

// WebGL Renderer
const render = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
render.setPixelRatio(Math.min(window.devicePixelRatio, 2));

if (canvas) {
    canvas.appendChild(render.domElement);
}

let model = null;
let isAnimating = false;

const Timer = new THREE.Timer();
Timer.connect(document);

function animate(timestamp) {
    if (!isAnimating) return;
    requestAnimationFrame(animate);
    Timer.update(timestamp);
    render.render(scene, camera);
    controls.update();
}

export function Show3dView() {
    if (!canvas) return;
    canvas.style.display = 'block';

    // Recalculate size after displaying (prevents 0 width/height bug)
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render.setSize(width, height);

    if (!isAnimating) {
        isAnimating = true;
        animate();
    }
}

export function Hide3dView() {
    if (canvas) canvas.style.display = 'none';
    isAnimating = false;
}

/**
 * @param {string} _3dModelPath
 * @param {MaterialInfo[]} materialsInfo
 * @param {SceneInfo} sceneInfo
 */
export function SetThe3dScene(_3dModelPath, materialsInfo,sceneInfo) {
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

    // Clean up previous model
    if (model) {
        scene.remove(model);
        model = null;
    }


    if (_3dModelPath.toLowerCase().endsWith('.fbx')) {
        const loader = new FBXLoader();
        loader.load(_3dModelPath, (fbx) => {
            setupLoadedModel(fbx, materialMap);
        });
    } else if (_3dModelPath.toLowerCase().endsWith('.gltf') || _3dModelPath.toLowerCase().endsWith('.glb')) {
        const loader = new GLTFLoader();
        loader.load(_3dModelPath, (gltf) => {
            setupLoadedModel(gltf.scene, materialMap);
        });
    }

    SetScene(sceneInfo);
}

/**
 * @param {SceneInfo} sceneInfo
 */
function SetScene(sceneInfo) {
    camera.position.z = sceneInfo.cameraDefaultZPos;
    camera.rotation.set(sceneInfo.viewDefaultRotation.x, sceneInfo.viewDefaultRotation.y, 0);

    textureLoader.load(sceneInfo.HDRI, (t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        t.colorSpace = THREE.SRGBColorSpace;
        scene.environment = t;
    })
    textureLoader.load(sceneInfo.background, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        scene.background = t;
    })

    rendere.toneMappingExposure = sceneInfo.sceneBrightness;
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


const controls = new OrbitControls(camera, render.domElement);
controls.enablePan = false;

