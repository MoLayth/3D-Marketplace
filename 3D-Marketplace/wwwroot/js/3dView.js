//*********** thi sscript just need a dive with id of canvas to work correctlat ***********\\

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { MaterialInfo } from './UploadModelPanel.js';

const scene = new THREE.Scene(); // Set up the scene

const canvas = document.getElementById('canvas');
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);

const cameraParent = new THREE.Object3D();
cameraParent.add(camera);
scene.add(cameraParent);

const render = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });

let model = new THREE.Object3D();
model = null;

render.setSize(canvas.clientWidth, canvas.clientHeight);
canvas.appendChild(render.domElement);


const Timer = new THREE.Timer();
Timer.connect(document);
function animate(timestamp) {
    requestAnimationFrame(animate);

    Timer.update(timestamp);

    render.render(scene, camera);
}

/**
 * @param {string} _3dModelPath
 * @param {MaterialInfo[]} materialsInfo
 */
export function SetThe3dScene(_3dModelPath, materialsInfo) {
    const materialMap = new Map();
    // here get the model path and the texture and all the nedded data
    materialsInfo.forEach((material) => {
        materialMap.set(material.name, material);
        
    })

    if (_3dModelPath.endsWith('.fbx')) {
        const loader = new FBXLoader();
        loader.load(_3dModelPath, (fbx) => {
            setupLoadedModel(fbx);
        });
    } else {
        // GLTF/GLB loader logic goes here
    }
    animate();
}
function setupLoadedModel(loadedSceneOrObject, materialMap) {
    const model = loadedSceneOrObject;

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
}

canvas.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * Timer.getDelta();
    if (camera.position.z < 2) camera.position.z = 1;
});
canvas.addEventListener('mousemove', (e) => {
    if (e.buttons === 2) { // if right click
        if (!model) return;

        canvas.style.cursor = "url('/resources/cursorRotate.svg'), auto"
        model.rotation.z += e.movementX * Timer.getDelta();
        cameraParent.rotation.x += e.movementY * Timer.getDelta() * -1;
    }
});

window.addEventListener('mouseup', () => {
    canvas.style.cursor = "default";
});

render.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    render.setSize(canvas.clientWidth, canvas.clientHeight);
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})