import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
// New Imports for HDR & Bloom Post-Processing
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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

render.toneMapping = THREE.ACESFilmicToneMapping;

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
const textureLoader = new THREE.TextureLoader();

let model = new THREE.Object3D();
const modelMaterial = new THREE.MeshStandardMaterial();

model = null;
function loadFpxFileFromDatabase(path) {
    fpxLoader.load(`${path}?v=${new Date().getTime()}`, (fbxModel) => {
        model = fbxModel;


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

    });
}

const fpxFileInput = document.getElementById("fpxFileInput");
document.getElementById("canvas-upload3dModelBtn").addEventListener('click', () => {
    fpxFileInput.click();
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

                child.material = modelMaterial;
            }
        });

        scene.add(model);
        updateCanvasUI();
    }

    reader.readAsArrayBuffer(file);
    
})

const maps = ["Base-Color", "Roughness", "Metallic", "Emission", "Ambient-Occlusion"];
maps.forEach((mapName) => {
    const inputEl = document.getElementById(`upload-${mapName}-Input`);
    const btnImgEl = document.getElementById(`upload-${mapName}`);

    if (inputEl && btnImgEl) {

        btnImgEl.addEventListener('click', () => {
            inputEl.click();
        });

        inputEl.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const textureUrl = URL.createObjectURL(file);

            btnImgEl.src = textureUrl;

            textureLoader.load(textureUrl, (texture) => {

                if (mapName === "Base-Color" || mapName === "Emission") {
                    texture.colorSpace = THREE.SRGBColorSpace;
                } else {
                    texture.colorSpace = THREE.NoColorSpace;
                }

                updateMaterialTexture(mapName, texture);
            });
        });
    }
});
function updateMaterialTexture(targetMap, texture) {
    switch (targetMap) {
        case maps[0]:
            modelMaterial.map = texture;
            break;
        case maps[1]:
            modelMaterial.roughnessMap = texture;
            break;
        case maps[2]:
            modelMaterial.metalnessMap = texture;
            break;
        case maps[3]:
            modelMaterial.emissiveMap = texture;
            modelMaterial.emissive = new THREE.Color(0xffffff).multiplyScalar(2.5);
            break;
        case maps[4]:
            modelMaterial.aoMap = texture;
            break;
    }

    modelMaterial.needsUpdate = true;
}
const emissionBrightnessInput = document.getElementById('emissionBrightnessInput');
const emissionColorInput = document.getElementById('emissionColorInput');

emissionBrightnessInput.addEventListener("input", updateEmission);
emissionColorInput.addEventListener("input",updateEmission);
function updateEmission() {
    const colorHex = emissionColorInput.value;
    const brightness = parseFloat(emissionBrightnessInput.value);
   
    const baseColor = new THREE.Color(colorHex);
    baseColor.multiplyScalar(brightness);

    modelMaterial.emissive.copy(baseColor);

    modelMaterial.needsUpdate = true;
}

const hdriImg = document.getElementById('HDRIImg');
const hdriInput = document.getElementById('HDRIInput');
hdriImg.addEventListener('click', () => {
    hdriInput.click();
});
hdriInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const textureUrl = URL.createObjectURL(file);
    hdriImg.src = textureUrl;

    textureLoader.load(textureUrl, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.environment = texture;
        if (HDMIAsBackgroundInput.checked) scene.background = texture;
    });

});

const HDMIAsBackgroundInput = document.getElementById('HDMIAsBackgroundInput');
HDMIAsBackgroundInput.addEventListener("change", (e) => {
    if (e.target.checked) {
        scene.background = scene.environment;
    } else {
        scene.background = null;
    }
});
const HDMIBrightnessInput = document.getElementById("HDMIBrightnessInput");
HDMIBrightnessInput.addEventListener('input', (e) => {
    render.toneMappingExposure = parseFloat(e.target.value);
});

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
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

canvas_container.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * Timer.getDelta();
    if (camera.position.z < 2) camera.position.z = 1;
});

canvas_container.addEventListener('mousemove', (e) => {
    if (e.buttons === 2) { // if right click
        if (!model) return;

        canvas_container.style.cursor = "url('/resources/cursorRotate.svg'), auto"
        model.rotation.z += e.movementX * Timer.getDelta();
        cameraParent.rotation.x += e.movementY * Timer.getDelta() * -1;
    }
});

window.addEventListener('mouseup', () => {
    canvas_container.style.cursor = "default";
});

render.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

document.getElementById("canvas-resetViewButton").addEventListener('click', () => {
    if (!model) return;

    cameraParent.rotation.set(0, 0, 0);
    camera.position.z = cameraDefaultZPos;
    model.rotation.z = 0;
    cameraParent.rotation.x = 0;
});
