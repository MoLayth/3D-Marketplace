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
setDefault_Background();

const glassMetrial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1.0,  // Completely translucent
    roughness: 0.0,     // Perfectly smooth surface
    thickness: 1.5,     // Simulates physical volume/magnification
    ior: 1.5,           // Index of Refraction (1.0 = air, 1.33 = water, 1.5 = glass)
})

model = null;

const canvas_uploadPanel = document.getElementById('canvas-uploadPanel');
const canvas_modifyPanel = document.getElementById('canvas-modifyPanel');
const meshsListContainer = document.getElementById("MeshesList");
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

    meshsListContainer.innerHTML = '<span style="text-wrap:nowrap; color:red"> No Model Currently loaded</span>';
    tabsSpace.innerHTML = '';
    materialSpace.innerHTML = '<span style="text-wrap:nowrap; color:red"> No Model Currently loaded</span>';
})

const fpxFileInput = document.getElementById("fpxFileInput");
let _3dModel = null;
document.getElementById("canvas-upload3dModelBtn").addEventListener('click', () => {
    fpxFileInput.click();
})

const materialSpace = document.getElementById('materialSpace');
const tabsSpace = document.getElementById('tabsSpace');
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

        meshsListContainer.innerHTML = "";
        tabsSpace.innerHTML = "";
        materialSpace.innerHTML = "";

        let tabsName = [];
        let HTMLMaterailElments = [];
        model.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => {
                            if (!tabsName.includes(mat.name) && mat.name) {
                                tabsName.push(mat.name);
                                HTMLMaterailElments.push(creatMaterial(mat.name));
                            }
                        });
                    } else {
                        if (child.material.name) {
                            if (!tabsName.includes(child.material.name)) {
                                tabsName.push(child.material.name);
                                HTMLMaterailElments.push(creatMaterial(child.material.name));
                            }
                        }
                    }
                }

                meshsListContainer.appendChild(createToggleButton(child.name, (s) => {
                    handelAssigningOfGlassMetrial(child.name, s);
                }));

                child.castShadow = true;
                child.receiveShadow = true;
                child.material = modelMaterial;
            }
        });

        for (var i = 0; i < HTMLMaterailElments.length; i++) {
            materialSpace.appendChild(HTMLMaterailElments[i]);
        }
        tabsSpace.appendChild(createTabs(tabsName, HTMLMaterailElments, 'MaterialGroup'));


        scene.add(model);
        updateCanvasUI();

        // Clear the file input value so the user can re-upload the same file if they want
        event.target.value = "";
    }

    reader.readAsArrayBuffer(_3dModel);

})

function handelAssigningOfGlassMetrial(meshName, state) {
    model.traverse(child => {
        if (child.isMesh) {
            if (meshName == child.name) {
                if (state === true) child.material = glassMetrial;
                else child.material = modelMaterial;
            }
        }
    });        
}

function createTabs(tabsName = [], associatedHTMLContainers = [], groupName) { // tabsName: is the names of the material
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('Row-Flex-Container');
    tabsContainer.style.width = '100%';

    let isActive = false;
    for (var i = 0; i < tabsName.length; i++) {
        if (i === 0) isActive = true;
        else isActive = false;

        tabsContainer.appendChild(createTab(tabsName[i], groupName, isActive, associatedHTMLContainers[i]));
    }

    return tabsContainer;
}
function createTab(tabName,groupName, activeByDefault = false, targetElmentContainer = HTMLElement) {
    const tab = document.createElement('label');
    tab.textContent = tabName
    tab.classList.add('tabs');

    if (activeByDefault == false) {
        tab.classList.add('tab-inactive');
        targetElmentContainer.style.display = 'none';
    }
    else {
        tab.classList.add('tab-active');
        targetElmentContainer.style.display = 'flex';
    }

    tab.group = groupName;
    tab.targetElment = targetElmentContainer;

    tab.addEventListener('click', () => {
        document.querySelectorAll('.tabs').forEach(elemnt => {
            if (elemnt.group == tab.group) {
                elemnt.classList.remove('tab-active');
                elemnt.classList.add('tab-inactive');
                elemnt.targetElment.style.display = 'none';
            }
        })
        tab.classList.remove('tab-inactive');
        tab.classList.add('tab-active');
        tab.targetElment.style.display = 'flex';
    });

    return tab;
}
function creatMaterial(name) {
    const materialContainer = document.createElement('div');
    materialContainer.style.width = '100%';
    materialContainer.classList.add('column-Flex-Container');
    materialContainer.style.gap = '10px';

    materialContainer.appendChild(createImageField('Base Color'));
    materialContainer.appendChild(createImageField('Roughness'));
    materialContainer.appendChild(createImageField('Metallic'));
    materialContainer.appendChild(createImageField('Normal Map'));
    materialContainer.appendChild(createImageField('Emission'));
    materialContainer.appendChild(createImageField('Ambient Occlusion'));
    //materialContainer.appendChild(createImageField('HDRI'));
    //materialContainer.appendChild(createImageField('Background'));

    const whiteSpace = document.createElement('div');
    whiteSpace.style.height = '10px';
    materialContainer.appendChild(whiteSpace);

    materialContainer.appendChild(createInfoField('Emission Brightness', 'number', 1));
    materialContainer.appendChild(createInfoField('Emission Color', 'color', '#000000'));
    materialContainer.appendChild(createInfoField('normalMap Strength', 'number', 1));

    return materialContainer;
}
function createImageField(textureName, onFileChange = (file) => { }) {
    const textureContainer = document.createElement('div');
    textureContainer.classList.add("Row-Flex-Container");
    textureContainer.style.width = '100%';
    textureContainer.style.gap = '10px';

    const label = document.createElement('label');
    label.textContent = textureName;

    const whiteSpace = document.createElement('div');
    whiteSpace.style.flex = '2';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".png, .jpg";
    input.style.display = 'none';
    input.addEventListener('change', (e) => {
        const newfile = e.target.files[0];

        if (newfile != null) {
            onFileChange(newfile);
            setTextureBtn.src = URL.createObjectURL(newfile);
            removeTextureBrn.style.display = 'flex';
        }
    });

    const removeTextureBrn = document.createElement('img');
    removeTextureBrn.classList.add("image-btn");
    removeTextureBrn.style.display = 'none';
    removeTextureBrn.style.height = '30px';
    removeTextureBrn.src = '/resources/X.svg';
    removeTextureBrn.addEventListener('click', () => {
        onFileChange(null);
        removeTextureBrn.style.display = 'none';
        setTextureBtn.src = '/resources/upload.svg';
    })

    const setTextureBtn = document.createElement('img');
    setTextureBtn.style.height = '50px';
    setTextureBtn.classList.add("image-btn");
    setTextureBtn.src = '/resources/upload.svg';
    setTextureBtn.addEventListener('click', () => { input.click() });

    textureContainer.appendChild(label);
    textureContainer.appendChild(whiteSpace);
    textureContainer.appendChild(input);
    textureContainer.appendChild(removeTextureBrn);
    textureContainer.appendChild(setTextureBtn);

    return textureContainer;
}
function createInfoField(name, inputType = 'number', defaultValue = 0, onChange = (value) => { }) {
    const container = document.createElement('div');
    container.classList.add("Row-Flex-Container")
    container.style.width = '100%';

    const label = document.createElement('label');
    label.textContent = name;
    label.style.textWrap = 'nowrap';


    const whiteSpace = document.createElement('div');
    whiteSpace.style.flex = '2';

    const input = document.createElement('input');
    input.type = inputType;
    input.value = defaultValue;
    input.style.textAlign = 'center';
    input.style.width = '40px'

    input.addEventListener('change', () => {
        onchange(input.value);
    });

    container.appendChild(label)
    container.appendChild(whiteSpace)
    container.appendChild(input)
    return container;
}
function createToggleButton(labelText = '', onPress = (bool) => { }) {
    const container = document.createElement('div');
    container.classList.add("Row-Flex-Container")
    container.style.gap = '8px';
    container.style.width = "100%"
    container.style.padding = "5px";
    container.style.borderRadius = "5px"

    const label = document.createElement('label');
    label.textContent = labelText;
    label.style.textWrap = "nowrap";

    const whiteSpace = document.createElement('div');
    whiteSpace.style.flex = '2';


    const imgButton = document.createElement('img');
    imgButton.classList.add('image-btn');
    imgButton.src = '/resources/AddSign.svg';


    let isActive = false;

    const toggleHandler = () => {
        isActive = !isActive;

        if (isActive) {
            imgButton.src = '/resources/X.svg';
            if (typeof onPress === 'function') {
                container.style.background = 'green';
                onPress(isActive);
            }
        } else {
            imgButton.src = '/resources/AddSign.svg';
            if (typeof onPress === 'function') {
                container.style.background = 'transparent';
                onPress(isActive);
            }
        }
    };
    
    imgButton.addEventListener('click', toggleHandler);

    container.appendChild(label);
    container.appendChild(whiteSpace);
    container.appendChild(imgButton);
    return container;
}

document.getElementById('glassMetrialColor').addEventListener('input', (e) => {
    glassMetrial.color.set(e.target.value); // .set() works cleanly with hex strings like "#ffffff"
});

// Transmission Input (Range is 0.0 to 1.0)
document.getElementById('transmissionId').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        glassMetrial.transmission = value;
    }
});

document.getElementById('thicknessId').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        glassMetrial.thickness = value;
    }
});

// IOR Input (Glass is usually 1.5, Water is 1.33, Diamond is 2.42)
document.getElementById('iorId').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
        glassMetrial.ior = value;
    }
});
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
            break;
        case 'Background':
            texture.colorSpace = THREE.SRGBColorSpace;
            scene.background = texture;
            break;
    }

    modelMaterial.needsUpdate = true;
}
const emissionBrightnessInput = document.getElementById('emissionBrightnessInput');
const emissionColorInput = document.getElementById('emissionColorInput');

//emissionBrightnessInput.addEventListener("input", updateEmission);
//emissionColorInput.addEventListener("input", updateEmission);
function updateEmission() {
    const colorHex = emissionColorInput.value;
    const brightness = parseFloat(emissionBrightnessInput.value);

    const baseColor = new THREE.Color(colorHex);
    baseColor.multiplyScalar(brightness);

    modelMaterial.emissive.copy(baseColor);

    modelMaterial.needsUpdate = true;
}
//document.getElementById('normalMapStrengthInput').addEventListener('input', (e) => {
//    const value = parseFloat(e.target.value);
//    modelMaterial.normalScale.set(value, value);
//})

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

        case 'Background':
            setDefault_Background();
            break;
    }
    imgBtn.src = "/resources/upload.svg";
    modelMaterial.needsUpdate = true;
}

function setDefault_HDMI() {
    textureLoader.load('/resources/DefaultHDMI.jpg', (t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = t;
    });
}
function setDefault_Background() {
    textureLoader.load('/resources/ModelBackground.jpg', (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        scene.background = t;
    });
}


document.querySelectorAll('.textureUploadBtn').forEach((element) => {
    const inputEl = document.getElementById(element.getAttribute('data-targetInputId'));
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

const HDRIBrightnessInput = document.getElementById("HDMIBrightnessInput");
HDRIBrightnessInput.addEventListener('input', (e) => {
    render.toneMappingExposure = parseFloat(e.target.value);
});

// creating the header tabs for Texture and Project
const headerTabsName = ['Texture', 'Project'];
const headerTabsElment = [document.getElementById('textureContainer'), document.getElementById('infoContainer')]
document.getElementById('headerTabs').appendChild(createTabs(headerTabsName, headerTabsElment, 'header'));

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

    formData.append("ViewDefaultRotation", JSON.stringify({ x: viewDefaultRotation.x, y: viewDefaultRotation.y }));
    formData.append("CameraDefaultZPos", cameraDefaultZPos);

    // if this a new project and dont have a thumbnail then just capture one
    if (thumbnaiFile == null && productId < 0) {
        await capturedThumbnail();
    }

    formData.append("_3dMofel", _3dModel);
    formData.append("Thumbnail", thumbnaiFile, "thumbnail.png");
    formData.append("productId", productId); // this is varible is set in UploadMpdelPanel.cshtml
    formData.append("isPublished", isPublished); // this is varible is set in UploadMpdelPanel.cshtml
    formData.append("Emission_Brightness", parseFloat(emissionBrightnessInput.value));
    formData.append("Emission_Color", emissionColorInput.value);
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
let thumbnaiFile = null;
function capturedThumbnail() {
    return new Promise((resolve) => {
        const width = 500;
        const height = 500;
        // Save original canvas size & camera aspect ratio so we can restor them when seting is don
        const originalWidth = render.domElement.width;
        const originalHeight = render.domElement.height;
        const originalAspect = camera.aspect;

        // render a squer thumbnai
        render.setSize(width, height, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
        render.render(scene, camera);

        thumbnailImage.classList.remove('vertical-close');
        thumbnailImage.classList.remove('vertical-Open');
        clearTimeout(thumbnaiTimerId);

        const thumbnailDataUrl = render.domElement.toDataURL('image/png', 0.8);

        thumbnailImage.src = thumbnailDataUrl;
        thumbnailImage.classList.add('vertical-Open');
        thumbnailImage.style.display = "flex";

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

        // Convert canvas to Blob asynchronously
        render.domElement.toBlob((blob) => {

            // Restore original canvas dimensions & camera aspect ratio
            render.setSize(originalWidth, originalHeight, false);
            camera.aspect = originalAspect;
            camera.updateProjectionMatrix();
            render.render(scene, camera); // Re-render live viewport

            thumbnaiFile = blob;
            resolve(blob); // Resolve the promise when the file is ready!
        }, 'image/png', 0.8);
    });
}

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
