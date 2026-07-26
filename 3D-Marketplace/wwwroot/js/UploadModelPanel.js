import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const scene = new THREE.Scene(); // Set up the scene

const canvas_container = document.getElementById('canvas-container');

let cameraDefaultZPos = 10;
const viewDefaultRotation = new THREE.Vector2(0, 0); // x for the camera and Y for the model

const camera = new THREE.PerspectiveCamera(45, canvas_container.clientWidth / canvas_container.clientHeight, 0.1, 100);
camera.position.set(0, 0, cameraDefaultZPos);
camera.lookAt(0, 0, 0);

const cameraParent = new THREE.Object3D();
cameraParent.add(camera);
scene.add(cameraParent);

const render = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });

render.toneMapping = THREE.ACESFilmicToneMapping;
render.outputColorSpace = THREE.SRGBColorSpace;
render.setSize(canvas_container.clientWidth, canvas_container.clientHeight);
canvas_container.appendChild(render.domElement);



const fpxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

let model = new THREE.Object3D();
const modelMaterial = new THREE.MeshStandardMaterial();
modelMaterial.emissive = new THREE.Color("#000000").multiplyScalar(1);
setDefault_HDMI();

model = null;

const fpxFileInput = document.getElementById("fpxFileInput");
let _3dModel = null;
document.getElementById("canvas-upload3dModelBtn").addEventListener('click', () => {
    fpxFileInput.click();
})
fpxFileInput.addEventListener('change', (event) => {
    _3dModel = event.target.files[0];
    if (!_3dModel) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const buffer = e.target.result;
        const fileName = _3dModel.name.toLowerCase();

        if (fileName.endsWith('.fbx')) {
            const fbxObject = fpxLoader.parse(buffer, '');
            setupLoadedModel(fbxObject);
        } else {
            gltfLoader.parse(buffer, '', function (gltf) {
                setupLoadedModel(gltf.scene);
            });
        }
    }

    function setupLoadedModel(loadedSceneOrObject) {
        model = loadedSceneOrObject;

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = modelMaterial;
            }
        });

        scene.add(model);
        updateCanvasUI();

        // Clear the file input value so the user can re-upload the same file if they want
        event.target.value = "";
    }

    reader.readAsArrayBuffer(_3dModel);

})


//const maps = ["Base-Color", "Roughness", "Metallic", "Emission", "Ambient-Occlusion"];
function updateTexture(targetMap, texture) {
    switch (targetMap) {
        case 'Base-Color':
            modelMaterial.map = texture;
            break;
        case 'Roughness':
            modelMaterial.roughnessMap = texture;
            break;
        case 'Metallic':
            modelMaterial.metalnessMap = texture;
            modelMaterial.metalness = 1;
            break;
        case 'Emission':
            modelMaterial.emissiveMap = texture;
            //modelMaterial.emissive = new THREE.Color(0xffffff).multiplyScalar(2.5);
            break;
        case 'Ambient-Occlusion':
            modelMaterial.aoMap = texture;
            break;

        case 'Normal-Map':
            modelMaterial.normalMap = texture;
            modelMaterial.normalScale = new THREE.Vector2(1, 1);
            break;

        case 'HDRI':
            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.environment = texture;
            if (HDRIAsBackgroundInput.checked) scene.background = texture;
            break;
    }

    modelMaterial.needsUpdate = true;
}
const emissionBrightnessInput = document.getElementById('emissionBrightnessInput');
const emissionColorInput = document.getElementById('emissionColorInput');

emissionBrightnessInput.addEventListener("input", updateEmission);
emissionColorInput.addEventListener("input", updateEmission);
function updateEmission() {
    const colorHex = emissionColorInput.value;
    const brightness = parseFloat(emissionBrightnessInput.value);

    const baseColor = new THREE.Color(colorHex);
    baseColor.multiplyScalar(brightness);

    modelMaterial.emissive.copy(baseColor);

    modelMaterial.needsUpdate = true;
}

function resetTextureToDefault(imgBtn, targetMap) {
    switch (targetMap) {
        case 'Base-Color':
            modelMaterial.map = null;
            break;

        case 'Roughness':
            modelMaterial.roughnessMap = null;
            break;

        case 'Metallic':
            modelMaterial.metalnessMap = null;
            modelMaterial.metalness = 0;
            break;

        case 'Emission':
            modelMaterial.emissiveMap = null;
            break;

        case 'Ambient-Occlusion':
            modelMaterial.aoMap = null;
            break;

        case 'Normal-Map':
            modelMaterial.normalMap = null;
            break;

        case 'HDRI':
            setDefault_HDMI();
            break;
    }
    imgBtn.src = "/resources/upload.svg";
    modelMaterial.needsUpdate = true;
}

function setDefault_HDMI() {
    textureLoader.load('/resources/DefaultHDMI.jpg', (t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = t;
        if (HDRIAsBackgroundInput.checked) scene.background = null;
    });
}

document.querySelectorAll('.textureUploadBtn').forEach((element) => {
    const inputEl = document.getElementById(element.getAttribute('data-targetInoutId'));
    const resetBtn = document.getElementById(element.getAttribute('data-resetBtn'));
    resetBtn.style.display = "none";

    element.addEventListener('click', () => {
        inputEl.click();
    });

    let mapName = null;
    inputEl.addEventListener('change', (e) => {
        mapName = e.currentTarget.getAttribute('data-map');
        const file = e.target.files[0];
        if (!file) return;

        // show the reset button
        resetBtn.style.display = "flex";

        const textureUrl = URL.createObjectURL(file);

        element.src = textureUrl;

        textureLoader.load(textureUrl, (texture) => {

            if (mapName === "Base-Color" || mapName === "Emission" || mapName === "HDMI") {
                texture.colorSpace = THREE.SRGBColorSpace;
            } else {
                texture.colorSpace = THREE.NoColorSpace;
            }

            updateTexture(mapName, texture);
        });
    });

    resetBtn.addEventListener('click', () => {
        resetTextureToDefault(element, mapName);
        resetBtn.style.display = "none";
    });
})

const HDRIAsBackgroundInput = document.getElementById('HDMIAsBackgroundInput');
HDRIAsBackgroundInput.addEventListener("change", (e) => {
    if (e.target.checked) {
        scene.background = scene.environment;
    } else {
        scene.background = null;
    }
});
const HDRIBrightnessInput = document.getElementById("HDMIBrightnessInput");
HDRIBrightnessInput.addEventListener('input', (e) => {
    render.toneMappingExposure = parseFloat(e.target.value);
});


const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const StockInput = document.getElementById('StockInput');
const DescriptionInput = document.getElementById('DescriptionInput');
// save the project without publishing it
document.getElementById('canvas-Save').addEventListener('click', async () => {

    if (productNameInput.value == "") {
        productNameInput.reportValidity();
        return;
    }

    const formData = new FormData();

    document.querySelectorAll('.textureUploadBtn').forEach(element => {
        const input = document.getElementById(element.getAttribute("data-targetInoutId"));
        // if file exist
        if (input && input.files && input.files[0]) {
            const key = input.getAttribute('data-map').replace('-', '');
            formData.append(key, input.files[0]);
        }
    });
    const isHdriBackground = HDRIAsBackgroundInput.type === 'checkbox' ? HDRIAsBackgroundInput.checked : (HDRIAsBackgroundInput?.value === 'true');

    formData.append("ViewDefaultRotation", JSON.stringify({ x: viewDefaultRotation.x, y: viewDefaultRotation.y }));
    formData.append("CameraDefaultZPos", cameraDefaultZPos);

    formData.append("_3dMofel", _3dModel);
    formData.append("productId", productId); // this is varible is set in UploadMpdelPanel.cshtml
    formData.append("isPublished", isPublished); // this is varible is set in UploadMpdelPanel.cshtml
    formData.append("Emission_Brightness", parseFloat(emissionBrightnessInput.value));
    formData.append("Emission_Color", emissionColorInput.value);
    formData.append("HDRI_ShowAsBackground", isHdriBackground);
    formData.append("HDRI_Brightness", parseFloat(HDRIBrightnessInput.value));
    formData.append("ProductName", productNameInput.value);
    formData.append("productPrice", productPriceInput.value);
    formData.append("Stock", StockInput.value);
    formData.append("Description", DescriptionInput.value);

    const saveResponse = await fetch('/Home/SaveModel', { method: 'POST', body: formData });

    // show the user something to know this success
    if (saveResponse.ok) {
        console.log("Ok saved");
    }
});


const thumbnailImage = document.getElementById('thumbnailImage');
document.getElementById('canvas-takeScreenshot').addEventListener('click', capturedThumbnail);
let thumbnaiTimerId = null;
function capturedThumbnail() {
    render.render(scene, camera);

    thumbnailImage.classList.remove('vertical-close');
    thumbnailImage.classList.remove('vertical-Open');
    clearTimeout(thumbnaiTimerId);

    const thumbnai = render.domElement.toDataURL('image/png', .8)
    thumbnailImage.src = thumbnai;
    thumbnailImage.classList.add('vertical-Open');
    thumbnailImage.style.display = "flex";

    // also save the postion and rotation this well be improtant later when the user well try to view the model
    cameraDefaultZPos = camera.position.z;
    viewDefaultRotation.x = cameraParent.rotation.x;
    viewDefaultRotation.y = model.rotation.z;

    thumbnaiTimerId = setTimeout(() => {
        thumbnailImage.classList.remove('vertical-Open');
        thumbnailImage.classList.add('vertical-close');

        thumbnaiTimerId = setTimeout(() => {
            thumbnailImage.style.display = "none";
        }, 150);

    }, 2500);
}

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
const canvas_removeModelBtn = document.getElementById('canvas-removeModel');
canvas_removeModelBtn.addEventListener('click', () => {
    scene.remove(model);
    model = null;
    render.render(scene, camera)
    updateCanvasUI();
})



const Timer = new THREE.Timer();
Timer.connect(document);
function animate(timestamp) {
    requestAnimationFrame(animate);

    Timer.update(timestamp);

    render.render(scene, camera);

}
animate();

// update when trying to resize the window
window.addEventListener('resize', () => {
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

    cameraParent.rotation.x = viewDefaultRotation.x;
    camera.position.z = cameraDefaultZPos;
    model.rotation.z = viewDefaultRotation.y;
});
