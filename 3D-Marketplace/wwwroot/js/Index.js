import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const scene = new THREE.Scene(); // Set up the scene

const canvas_container = document.getElementById('canvas-container');

const camera = new THREE.PerspectiveCamera(45, canvas_container.clientWidth / canvas_container.clientHeight, 0.1, 100);
const cameraDefaultZPos = 10;
camera.position.set(0, 0, cameraDefaultZPos);
camera.lookAt(0, 0, 0);

const cameraParent = new THREE.Object3D();
cameraParent.add(camera);
scene.add(cameraParent);

const render = new THREE.WebGLRenderer({ antialias: true, alpha: true });
render.outputColorSpace = THREE.SRGBColorSpace;
render.setSize(canvas_container.clientWidth, canvas_container.clientHeight);
canvas_container.appendChild(render.domElement);

const firstDirectionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
const secoundDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);

firstDirectionalLight.position.set(10, 20, 20);
secoundDirectionalLight.position.set(-10, -20, -15);

scene.add(firstDirectionalLight);
scene.add(secoundDirectionalLight);


const fpxLoader = new FBXLoader();
let model = new THREE.Object3D();
model = null;
function loadFpxFileFromDatabase(path) {
    fpxLoader.load(`${path}?v=${new Date().getTime()}`, (fbxModel) => {
        model = fbxModel;

        const textureLoader = new THREE.TextureLoader();

        const baseColorMap = textureLoader.load('/resources/3d-assets/Drawer_Diffuse_Color.png');
        const metallicMap = textureLoader.load('/resources/3d-assets/Drawer_Metalness.png');
        const roughnessMap = textureLoader.load('/resources/3d-assets/Drawer_Roughness.png');
        const normalMap = textureLoader.load('/resources/3d-assets/Drawer_Normal_Map.png');
        //const aoMap = textureLoader.load('/resources/3d-assets/');

        const modelMaterial = new THREE.MeshStandardMaterial();
        modelMaterial.map = baseColorMap;
        modelMaterial.metalnessMap = metallicMap;
        modelMaterial.roughnessMap = roughnessMap;
        modelMaterial.normalMap = normalMap;


        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = modelMaterial;
            }
        });

        scene.add(model);

    }, undefined, (error) => {
        console.error("Error loading model details:", error);
    });
}

const fpxFileInput = document.getElementById("fpxFileInput");
document.getElementById("canvas-upload3dModelBtn").addEventListener('click', () => {
    fpxFileInput.click();
    console.log("ok");
})
fpxFileInput.addEventListener('change',(event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const contents = e.target.result;

        const newModel = fpxLoader.parse(contents, '');
        if (model) {
            scene.remove(model);
        }

        model = newModel;

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // generic material
                child.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
            }
        });

        scene.add(model);
        updateCanvasUI();
    }

    reader.readAsArrayBuffer(file);
    
})

const canvas_resetViewButton = document.getElementById('canvas-resetViewButton');
const canvas_takeScreenshot = document.getElementById('canvas-takeScreenshot');
const canvas_Save = document.getElementById('canvas-Save');

const canvas_uploadPanel = document.getElementById('canvas-uploadPanel');
const canvas_modifyPanel = document.getElementById('canvas-modifyPanel');
function updateCanvasUI() {
    if (!model) { // if there is no model
        canvas_modifyPanel.style.display = "none";
        canvas_uploadPanel.style.display = "flex"
        return;
    }
    canvas_modifyPanel.style.display = "flex";
    canvas_uploadPanel.style.display = "none"
}
updateCanvasUI();

const Timer = new THREE.Timer();
Timer.connect(document);
function animate(timestamp) {
    requestAnimationFrame(animate);

    Timer.update(timestamp);    

    render.render(scene, camera);
    
}
animate();

// update when trying to resize the window
window.addEventListener('resize',()=> {
    camera.aspect = canvas_container.clientWidth / canvas_container.clientHeight;
    camera.updateProjectionMatrix();    

    render.setSize(canvas_container.clientWidth, canvas_container.clientHeight);
    render.setPixelRatio(canvas_container.clientWidth / canvas_container.clientHeight);
})

canvas_container.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * Timer.getDelta();
    if (camera.position.z < 2) camera.position.z = 1;
});

canvas_container.addEventListener('mousemove', (e) => {
    if (e.buttons === 2) { // if right click
        canvas_container.style.cursor = "url('/resources/cursorRotate.svg'), auto"
        model.rotation.z += e.movementX * Timer.getDelta();
        cameraParent.rotation.x += e.movementY * Timer.getDelta() * -1;
    }
});
canvas_container.addEventListener('mouseup', (e) => {
        canvas_container.style.cursor = "default";
});

document.getElementById("resetViewButton").addEventListener('click', () => {
    cameraParent.rotation.set(0, 0, 0);
    camera.position.z = cameraDefaultZPos;
    model.rotation.z = 0;
    cameraParent.rotation.x = 0;
});

canvas_modifyPanel.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});