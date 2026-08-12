import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { MaterialInfo } from './MyModels.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();

const canvas_container = document.getElementById('canvas-container');

const cameraDefaultPos = new THREE.Vector3(0, 0, 10);     
const controlsDefaultTarget = new THREE.Vector3(0, 0, 0); 

const camera = new THREE.PerspectiveCamera(45, canvas_container.clientWidth / canvas_container.clientHeight, 0.1, 100);
camera.position.copy(cameraDefaultPos);
camera.lookAt(0, 0, 0);

scene.add(camera);

const render = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });

render.toneMapping = THREE.ACESFilmicToneMapping;
render.outputColorSpace = THREE.SRGBColorSpace;
render.setSize(canvas_container.clientWidth, canvas_container.clientHeight);
canvas_container.appendChild(render.domElement);

const controls = new OrbitControls(camera, render.domElement);
//controls.enablePan = false;

const fpxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

let model = new THREE.Object3D();

/** @type {MaterialInfo[]} */
const modelMaterials = []


model = null;

const canvas_uploadPanel = document.getElementById('canvas-uploadPanel');
const canvas_modifyPanel = document.getElementById('canvas-modifyPanel');
function updateCanvasUI() {
    if (!model) { // if there is no model
        canvas_modifyPanel.style.display = "none";
        canvas_uploadPanel.style.display = "flex"
        return;
    }
    canvas_modifyPanel.style.display = "flex";
    canvas_uploadPanel.style.display = "none";
}

const canvas_removeModelBtn = document.getElementById('canvas-removeModelBtn');
canvas_removeModelBtn.addEventListener('click', () => {
    scene.remove(model)
    model = null;
    _3dModel = null;
    modelMaterials.length = 0;
    render.render(scene, camera)
    updateCanvasUI();

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

    const objectUrl = URL.createObjectURL(_3dModel);
    const fileName = _3dModel.name.toLowerCase();

    if (fileName.endsWith('.fbx')) {
        fpxLoader.load(objectUrl, (fbxObject) => {
            setupLoadedModel(fbxObject);
            URL.revokeObjectURL(objectUrl);
        });
    } else {
        gltfLoader.load(objectUrl, (gltf) => {
            setupLoadedModel(gltf.scene);
            URL.revokeObjectURL(objectUrl);
        });
    }
});

/**
  * @param {THREE.Object3D} loadedSceneOrObject
 */
async function setupLoadedModel(loadedSceneOrObject) {
    model = loadedSceneOrObject;

    tabsSpace.innerHTML = "";
    materialSpace.innerHTML = "";

    const materialMap = new Map(); // Track materials by name to avoid duplicates
    let tabsName = [];
    let HTMLMaterialElements = [];

    const textureWaitPromises = [];

    //// sett all the material if there is any
    modelMaterials.forEach(mat => {
        materialMap.set(mat.name, mat);
    })

    model.traverse((child) => {
        if (child.isMesh) {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map((mat) => processMaterial(mat));
                } else {
                    child.material = processMaterial(child.material);
                }
            }
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    function processMaterial(mat) {
        if (!mat || !mat.name) return mat;

        if (materialMap.has(mat.name)) {
            return materialMap.get(mat.name).modelMaterial;
        }

        const customMatInfo = new MaterialInfo(mat.name);
        
        //console.log(mat);

        if (mat.map) textureWaitPromises.push(customMatInfo.applyTexture('map', mat.map));
        if (mat.roughnessMap) textureWaitPromises.push(customMatInfo.applyTexture('roughnessMap', mat.roughnessMap));
        if (mat.metalnessMap) textureWaitPromises.push(customMatInfo.applyTexture('metalnessMap', mat.metalnessMap));
        if (mat.normalMap) textureWaitPromises.push(customMatInfo.applyTexture('normalMap', mat.normalMap));
        if (mat.emissiveMap) textureWaitPromises.push(customMatInfo.applyTexture('emissiveMap', mat.emissiveMap));
        if (mat.aoMap) textureWaitPromises.push(customMatInfo.applyTexture('aoMap', mat.aoMap));
        if (mat.alphaMap) textureWaitPromises.push(customMatInfo.applyTexture('alphaMap', mat.alphaMap));
        //console.log('#' + mat.color.getHexString());
        if (mat.color) customMatInfo.setColor('#' + mat.color.getHexString());
        if (mat.roughness) customMatInfo.setRoughness(mat.roughness);
        if (mat.emissive) customMatInfo.setEmissionColor('#' + mat.emissive.getHexString());
        if (mat.metalness) customMatInfo.setMetalness(mat.metalness);
        if (mat.transparent) {
            if (mat.thickness) customMatInfo.setThickness(mat.thickness);
            if (mat.ior) customMatInfo.setThickness(mat.ior);
            customMatInfo.setMakeMaterialTransmission(true);
        }
        if (mat.side == 2) customMatInfo.setUseDoubleSide(true);
        // ths property only set when loading the model it can not be set manuly
        if (mat.stencilZFail) customMatInfo.modelMaterial.stencilZFail = mat.stencilZFail;
        if (mat.stencilZPass) customMatInfo.modelMaterial.stencilZPass = mat.stencilZPass;

        materialMap.set(mat.name, customMatInfo);
        modelMaterials.push(customMatInfo);


        return customMatInfo.modelMaterial;
    }

    await Promise.all(textureWaitPromises);

    modelMaterials.forEach((mat) => {
        HTMLMaterialElements.push(creatMaterial(mat.name, mat));
        tabsName.push(mat.name);
    })
    

    for (var i = 0; i < HTMLMaterialElements.length; i++) {
        materialSpace.appendChild(HTMLMaterialElements[i]);
    }
    tabsSpace.appendChild(createTabs(tabsName, HTMLMaterialElements, 'MaterialGroup'));


    scene.add(model);
    updateCanvasUI();

    // Clear the file input value so the user can re-upload the same file if they want
    //if (typeof event !== 'undefined' && event && event.target) {
    //    event.target.value = "";
    //}
}

/**
 * @param {string[]} tabsName
 * @param {HTMLElement[]} associatedHTMLContainers
 * @param {string} groupName
 * @param {string[]} tabsIds
 * @returns {HTMLElement}
 */
function createTabs(tabsName, associatedHTMLContainers, groupName,tabsIds = []) { // tabsName: is the names of the material
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('Row-Flex-Container');
    tabsContainer.style.width = '100%';

    for (var i = 0; i < tabsName.length; i++) {
        const isActive = i === 0;

        tabsContainer.appendChild(createTab(tabsName[i], groupName, isActive, associatedHTMLContainers[i], tabsIds[i]));
    }

    return tabsContainer;
}
/**
 * @param {string} tabName
 * @param {string} groupName
 * @param {boolean} activeByDefault
 * @param {HTMLElement} targetElmentContainer
 * @param {string} tabId
  */
function createTab(tabName,groupName, activeByDefault, targetElmentContainer,tabId = '') {
    const tab = document.createElement('label');
    if (tabId) tab.id = tabId;

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
/**
 * @param {string} name
 * @param {MaterialInfo} material
 */
function creatMaterial(name,material) {
    const materialContainer = document.createElement('div');
    materialContainer.style.width = '100%';
    materialContainer.classList.add('column-Flex-Container');
    materialContainer.style.gap = '10px';

    materialContainer.appendChild(createImageField('Base Color', convertToURLIfFile(material.BaseColorMap), (file) => material.applyTexture('map', file)));
    materialContainer.appendChild(createImageField('Roughness', convertToURLIfFile(material.roughnessMap), (file) => material.applyTexture('roughnessMap', file)));
    materialContainer.appendChild(createImageField('Metallic', convertToURLIfFile(material.metallicMap), (file) => material.applyTexture('metalnessMap', file)));
    materialContainer.appendChild(createImageField('Normal Map', convertToURLIfFile(material.normalMap), (file) => material.applyTexture('normalMap', file)));
    materialContainer.appendChild(createImageField('Emission', convertToURLIfFile(material.emissionMap), (file) => material.applyTexture('emissiveMap', file)));
    materialContainer.appendChild(createImageField('Ambient Occlusion', convertToURLIfFile(material.aoMap), (file) => material.applyTexture('aoMap', file)));
    materialContainer.appendChild(createImageField('Alpha', convertToURLIfFile(material.alphaMap), (file) => material.applyTexture('alphaMap', file)));

    const whiteSpace = document.createElement('div');
    whiteSpace.style.height = '10px';
    materialContainer.appendChild(whiteSpace);

    materialContainer.appendChild(createInfoField('Color', 'color', material.getColor(), (v) => { material.setColor(v); }))
    const metalnessField = createInfoField('Metalness', 'number', material.getMetalness(), (v) => { material.setMetalness(v) });
    const roughnessField = createInfoField('Roughness', 'number', material.getRoughness(), (v) => { material.setRoughness(v) });
    materialContainer.appendChild(metalnessField);
    materialContainer.appendChild(roughnessField);;

    materialContainer.appendChild(createInfoField('Normal Map Strength', 'number', material.getNormalMapStrength(), (v) => { material.setNormalMapStrength(v); }));
    materialContainer.appendChild(createInfoField('Emission Brightness', 'number', material.getEmissionBrightness(), (v) => { material.setEmissionBrightness(v); }));
    materialContainer.appendChild(createInfoField('Emission Color', 'color', material.getEmissionColor(), (v) => { material.setEmissionColor(v); }));
    materialContainer.appendChild(createInfoField('Alpha Test', 'number', material.getAlphaTest(), (v) => { material.setAlphaTest(v) }));
    materialContainer.appendChild(createToggleButton('Use Double Side', material.getUseDoubleSide(), (v) => { material.setUseDoubleSide(v); }));

    const glassMaterialContainer = document.createElement('div');
    glassMaterialContainer.style.width = '100%';
    glassMaterialContainer.classList.add('column-Flex-Container');

    glassMaterialContainer.appendChild(createInfoField('Thickness', 'number', material.getThickness(), (v) => { material.setThickness(v); }));
    glassMaterialContainer.appendChild(createInfoField('IOR', 'number', material.getIOR(), (v) => { material.setIOR(v); }));
    glassMaterialContainer.style.display = 'none';

    materialContainer.appendChild(createToggleButton('Make Material Transmission', material.getMakeMaterialTransmission(), (v) => {
        material.setMakeMaterialTransmission(v);
        if (v == true) {
            glassMaterialContainer.style.display = 'flex';
            //metalnessField.style.display = 'none';
            //roughnessField.style.display = 'none';
            
        }
        else {
            glassMaterialContainer.style.display = 'none';
            //metalnessField.style.display = 'flex';
            //roughnessField.style.display = 'flex';
        }
    }));

    materialContainer.appendChild(glassMaterialContainer);

    return materialContainer;

    // this will convert the object of type file or blob to url
    function convertToURLIfFile(object) {
        if (object instanceof File || object instanceof Blob) {
            return URL.createObjectURL(object);
        }
        return object;
    }
}

/**
 * @param {string} textureName
 * @param {string | null} image
 * @param {function(File|Blob): void} onFileChange
 */ 
function createImageField(textureName, image, onFileChange) {
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
    input.accept = ".png, .jpg , .jpeg";
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
    if (image) {
        setTextureBtn.src = image;
        removeTextureBrn.style.display = 'flex';

    } else {
        setTextureBtn.src = '/resources/upload.svg';
        removeTextureBrn.style.display = 'none';
    }
    
    setTextureBtn.addEventListener('click', () => { input.click() });

    textureContainer.appendChild(label);
    textureContainer.appendChild(whiteSpace);
    textureContainer.appendChild(input);
    textureContainer.appendChild(removeTextureBrn);
    textureContainer.appendChild(setTextureBtn);

    return textureContainer;
}
/**
 * @param {string} name
 * @param {'number' | 'text' | 'color'} inputType
 * @param {any} defaultValue
 * @param {function(number|string): void} onChange
 */
function createInfoField(name, inputType, defaultValue = 0, onChange) {
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
        if (typeof onChange === 'function') {
            onChange(input.value);
        }
    });

    container.appendChild(label)
    container.appendChild(whiteSpace)
    container.appendChild(input)
    return container;
}

/**
  * @param {string} labelText
  * @param {boolean} defaultValue
 * @param {function(Boolean): viod} onPress
 */
function createToggleButton(labelText, defaultValue = false, onPress) {
    const container = document.createElement('div');
    container.classList.add("Row-Flex-Container")
    container.style.gap = '8px';
    container.style.width = "100%"

    const label = document.createElement('label');
    label.textContent = labelText;
    label.style.textWrap = "nowrap";

    const whiteSpace = document.createElement('div');
    whiteSpace.style.flex = '2';


    const toggleButton = document.createElement('div');
    toggleButton.classList.add('image-btn');
    toggleButton.src = '/resources/AddSign.svg';
    toggleButton.style.border = '1px solid white';
    toggleButton.style.borderRadius = '5px';
    toggleButton.style.padding = '2px';
    toggleButton.style.width = '30px'
    toggleButton.style.height = '30px'

    const color = document.createElement('div');
    color.style.width = '100%';
    color.style.height = '100%';
    color.style.borderRadius = '5px';

    toggleButton.appendChild(color);

    let isActive = false;

    const toggleHandler = () => {
        isActive = !isActive;

        if (isActive) {
            toggleButton.src = '/resources/X.svg';
            if (typeof onPress === 'function') {
                color.style.background = 'red';
                onPress(isActive);
            }
        } else {
            toggleButton.src = '/resources/AddSign.svg';
            if (typeof onPress === 'function') {
                color.style.background = 'transparent';
                onPress(isActive);
            }
        }
    };
    
    toggleButton.addEventListener('click', toggleHandler);

    if (defaultValue === true) {
        toggleHandler();
    }

    container.appendChild(label);
    container.appendChild(whiteSpace);
    container.appendChild(toggleButton);
    return container;
}

let sceneBrightness = 1;
document.getElementById('infoContainer').insertAdjacentElement('afterbegin', createInfoField('Scene Brightness', 'number', product?.HDRI_Brightness ?? sceneBrightness, (v) => {
    sceneBrightness = parseFloat(v);
    render.toneMappingExposure = sceneBrightness;
}));

// show onlay the background if its not the defoult
let BackgroundFile = null;
if (product &&  product.background != '/resources/ModelBackground.jpg') {
    BackgroundFile = product.background;
}
document.getElementById('infoContainer').insertAdjacentElement('afterbegin', createImageField('Backgroun', BackgroundFile , (f) => {
    BackgroundFile = f;
    if (BackgroundFile == null) {
        setDefault_Background();
    } else {
        applyBackground(URL.createObjectURL(BackgroundFile))
    }
}));

// show onlay the HDRI if its not the defoult
let HDRIFile = null;
if (product && product.HDRI != '/resources/DefaultHDMI.jpg') {
    HDRIFile = product.HDRI;
}
document.getElementById('infoContainer').insertAdjacentElement('afterbegin', createImageField('HDRI', HDRIFile, (f) => {
    HDRIFile = f;
    if (HDRIFile == null) {
        setDefault_HDMI();
    } else {
        applyHDMITexture(URL.createObjectURL(HDRIFile))
    }
}));

function setDefault_HDMI() {
    applyHDMITexture('/resources/DefaultHDMI.jpg');
}
function setDefault_Background() {
    applyBackground('/resources/ModelBackground.jpg');
}
function applyHDMITexture(texturePath) {
    textureLoader.load(texturePath, (t) => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        t.colorSpace = THREE.SRGBColorSpace;
        scene.environment = t;
    });
}
function applyBackground(backgroundPath) {
    textureLoader.load(backgroundPath, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        scene.background = t;
    });
}


// creating the header tabs for Texture and Project
const headerTabsName = ['Texture', 'Project'];
const headerTabsElment = [document.getElementById('textureContainer'), document.getElementById('infoContainer')]
document.getElementById('headerTabs').appendChild(createTabs(headerTabsName, headerTabsElment, 'header', headerTabsName.map(n => n + 'Id')));

const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const StockInput = document.getElementById('StockInput');
//const DescriptionInput = document.getElementById('DescriptionInput');
const ProjectTab = document.getElementById('ProjectId'); // this well come useful in reportValidity



// save the project without publishing it
const saveProjectBtn = document.getElementById('canvas-Save');
saveProjectBtn.addEventListener('click', async () => {

    if (productNameInput.value == "") {
        ProjectTab.click();
        productNameInput.reportValidity();
        return; 
    }

    if (saveProjectBtn.disabled) return;
    saveProjectBtn.disabled = true;
    saveProjectBtn.classList.add('disabled');

    function appendAsset(formData, assetValue, fileFieldName, pathFieldName) {
        if (assetValue instanceof File || assetValue instanceof Blob) {
            formData.append(fileFieldName, assetValue);
        } else if (typeof assetValue === 'string' && assetValue.length > 0) {
            formData.append(pathFieldName, assetValue);
        }
    }

    const productFormData = new FormData();

    // if this a new project and dont have a thumbnail then just capture one
    if (thumbnaiFile == null && productId < 0) {
        await capturedThumbnail();
    }

    appendAsset(productFormData, _3dModel, "ModelFile", "ModelPath");
    appendAsset(productFormData, thumbnaiFile, "ThumbnailFile", "ThumbnailPath");
    appendAsset(productFormData, HDRIFile, "HdriFile", "HdriPath");
    appendAsset(productFormData, BackgroundFile, "BackgroundFile", "BackgroundPath");

    // Append Scalars & Form Inputs
    productFormData.append("productId", productId);
    productFormData.append("isPublished", isPublished);

    productFormData.append("controlsDefaultTarget",
        JSON.stringify({ x: controlsDefaultTarget.x, y: controlsDefaultTarget.y, z: controlsDefaultTarget.z }));
    productFormData.append("cameraDefaultPos",
        JSON.stringify({ x: cameraDefaultPos.x, y: cameraDefaultPos.y, z: cameraDefaultPos.z }));

    productFormData.append("HdriBrightness", sceneBrightness);

    productFormData.append("ProductName", productNameInput.value);
    productFormData.append("productPrice", productPriceInput.value);
    productFormData.append("Stock", StockInput.value);
    //productFormData.append("Description", DescriptionInput.value);
    productFormData.append("Description", uploadPanelQuill? uploadPanelQuill.getSemanticHTML() : '');

    const saveResponse = await fetch('/Home/SaveProduct', {
        method: 'POST',
        body: productFormData
    });

    // then save the material after successfully saving the product
    if (saveResponse.ok) {
        const responseData = await saveResponse.json();
        const productName = responseData.name;
        productId = responseData.id; // this well prevent the dubliction of the product on stor item when the user hit save multiple times

        canvas_removeModelBtn.parentElement.style.display = 'none';
        canvas_deleteProjectBtn.parentElement.style.display = 'flex';
        canvas_publishProjectBtn.parentElement.style.display = 'flex';

        const materialPromises = modelMaterials.map(mat => {
            function appendTextureToForm(formData, fileOrPath, fileFieldName, pathFieldName) {
                if (fileOrPath instanceof File || fileOrPath instanceof Blob) {
                    formData.append(fileFieldName, fileOrPath); // Upload new binary file
                } else if (typeof fileOrPath === 'string') {
                    formData.append(pathFieldName, fileOrPath); // Send existing web path string
                }
            }

            const formData = new FormData();
            formData.append('ProductName', productName);
            formData.append('MaterialName', mat.name);

            appendTextureToForm(formData, mat.BaseColorMap, 'BaseColorFile', 'BaseColorPath');
            appendTextureToForm(formData, mat.roughnessMap, 'RoughnessFile', 'RoughnessPath');
            appendTextureToForm(formData, mat.metallicMap, 'MetallicFile', 'MetallicPath');
            appendTextureToForm(formData, mat.normalMap, 'NormalMapFile', 'NormalMapPath');
            appendTextureToForm(formData, mat.emissionMap, 'EmissionFile', 'EmissionPath');
            appendTextureToForm(formData, mat.aoMap, 'AmbientOcclusionFile', 'AmbientOcclusionPath');
            appendTextureToForm(formData, mat.alphaMap, 'AlphaFile', 'AlphaPath');

            formData.append('EmissionBrightness', mat.getEmissionBrightness());
            formData.append('EmissionColor', mat.getEmissionColor());
            formData.append('AlphaTest', mat.getAlphaTest());
            formData.append('Ior', mat.getIOR());
            formData.append('Thickness', mat.getThickness());
            formData.append('NormalMapStrength', mat.getNormalMapStrength());
            formData.append('UseDoubleSide', mat.getUseDoubleSide());
            formData.append('Color', mat.getColor());
            formData.append('MetalnessProperty', mat.getMetalness());
            formData.append('RoughnessProperty', mat.getRoughness());
            formData.append('MakeMaterialTransmission', mat.getMakeMaterialTransmission());

            return fetch('/Home/SaveMaterial', { method: 'POST', body: formData });
        });        
        await Promise.all(materialPromises);

        saveProjectBtn.classList.remove('disabled');
        showSuccessMessage("Project Saved Successfully");
        saveProjectBtn.disabled = false;
    }
    else {
        showWarningMessage("Failed to save the project. Please try again.");
        saveProjectBtn.classList.remove('disabled');
        saveProjectBtn.disabled = false;
    }
});

const canvas_deleteProjectBtn = document.getElementById('canvas-delete');
canvas_deleteProjectBtn.addEventListener('click', async () => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {

        if (canvas_deleteProjectBtn.disabled) return;
        canvas_deleteProjectBtn.disabled = true;

        const response = await fetch(`/Home/DeleteProduct?productId=${productId}`, { method: 'DELETE' });
        if (response.ok) {
            showSuccessMessage("Project deleted successfully.");
            switchToTab('UploadMode');
            canvas_deleteProjectBtn.disabled = false;
        } else {
            showWarningMessage("Failed to delete the project. Please try again.");
            canvas_deleteProjectBtn.disabled = false;
        }
    }
});
const canvas_publishProjectBtn = document.getElementById('canvas-publishProjectBtn');
const canvas_publishProjectBtnLabel = document.getElementById('canvas-publishProjectBtn-label');
canvas_publishProjectBtn.addEventListener('click', async () => {
    const response = await fetch(`Home/SwitchProductPublishState?productId=${productId}`);
    if (!response.ok) {
        showWarningMessage("Something went wrong!")
        return;
    }

    const data = await response.json();

    if (data.state) {
        canvas_publishProjectBtn.src = '/resources/unPublished.svg';
        canvas_publishProjectBtnLabel.textContent = "Unpublish";
        showSuccessMessage("Product Published");
    }
    else {
        canvas_publishProjectBtn.src = '/resources/paper-plane.svg';
        canvas_publishProjectBtnLabel.textContent = "Publish";
        showSuccessMessage("Product Unpublished");
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


        // --- FIX HERE: Save full Position & Target ---
        cameraDefaultPos.copy(camera.position);
        controlsDefaultTarget.copy(controls.target);

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

    controls.update();
}


// update when trying to resize the window
const canvasResizeObserver = new ResizeObserver(() => {
    const width = canvas_container.clientWidth;
    const height = canvas_container.clientHeight;

    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    render.setSize(width, height);
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Observe changes on the canvas container element directly
canvasResizeObserver.observe(canvas_container);

document.getElementById("canvas-resetViewButton").addEventListener('click', () => {
    resetView();
});

function resetView() {
    if (!model) return;

    camera.position.copy(cameraDefaultPos);
    controls.target.copy(controlsDefaultTarget);

    controls.update();
}

/**
* @type {'horizontal' | 'vertical'}
*/
let currentLayout = 'horizontal';

const uploadModelPanelContainer = document.getElementById('uploadModelPanelContainer');
const settingContainer = document.getElementById('settingContainer');
window.addEventListener('resize', () => {
    updateLayout();

})

function updateLayout() {
    const layoutChangeTrigger = 900;
    // if that the case change the layout
    if (window.innerWidth < layoutChangeTrigger && currentLayout == 'horizontal') {
        uploadModelPanelContainer.classList.remove('Row-Flex-Container');
        uploadModelPanelContainer.classList.add('column-Flex-Container');

        canvas_container.style.height = '500px';
        canvas_container.style.flexShrink = '0';

        settingContainer.style.flexShrink = '1';
        settingContainer.style.width = '100%';

        uploadModelPanelContainer.style.flexDirection = 'column-reverse';
        currentLayout = 'vertical';
    }
    else if (window.innerWidth >= layoutChangeTrigger && currentLayout == 'vertical') {
        uploadModelPanelContainer.classList.remove('column-Flex-Container');
        uploadModelPanelContainer.classList.add('Row-Flex-Container');
        uploadModelPanelContainer.style.flexDirection = 'row';

        canvas_container.style.height = '100%';
        canvas_container.style.flexShrink = '1';

        settingContainer.style.flexShrink = '0';
        settingContainer.style.width = '450px';

        currentLayout = 'horizontal';
    }


    if (canvas_container.clientWidth > 0 && canvas_container.clientHeight > 0) {
        camera.aspect = canvas_container.clientWidth / canvas_container.clientHeight;
        camera.updateProjectionMatrix();
        render.setSize(canvas_container.clientWidth, canvas_container.clientHeight);
    }
}
updateLayout();


// this should have all the function and ui data manipulation that need to run when the pag load
async function start() {
    if (productId <= 0 || !product) {
        setDefault_HDMI();
        setDefault_Background();
    } else {

        // update the publishProjectBtn to match the current state of the model
        if (product.isPublished) {
            canvas_publishProjectBtn.src = '/resources/unPublished.svg';
            canvas_publishProjectBtnLabel.textContent = "Unpublish";
        }
        else {
            canvas_publishProjectBtn.src = '/resources/paper-plane.svg';
            canvas_publishProjectBtnLabel.textContent = "Publish";
        }

        // Clear existing materials array to prevent duplicate push issues
        modelMaterials.length = 0;

        const rawMaterials = product.materials || product.Materials;

        if (rawMaterials && Array.isArray(rawMaterials)) {
            rawMaterials.forEach(mat => {
                const matInfo = new MaterialInfo(mat.Name);

                // Populate Material numerical properties safely
                matInfo.setNormalMapStrength(mat.NormalMap_Strength);
                matInfo.setEmissionBrightness(mat.Emission_Brightness);
                matInfo.setEmissionColor(mat.Emission_Color);
                matInfo.setAlphaTest(mat.alphaTest);
                matInfo.setUseDoubleSide(mat.UseDoubleSide);
                matInfo.setIOR(mat.IOR);
                matInfo.setThickness(mat.Thickness);
                matInfo.setColor(mat.Color);
                matInfo.setMetalness(mat.MetalnessProperty ?? 0);
                matInfo.setRoughness(mat.RoughnessProperty ?? 0.5);
                matInfo.setMakeMaterialTransmission(mat.makeMaterialTransmission);

                // Apply Textures
                if (mat.BaseColor) matInfo.applyTexture('map', mat.BaseColor);
                if (mat.Roughness) matInfo.applyTexture('roughnessMap', mat.Roughness);
                if (mat.Metallic) matInfo.applyTexture('metalnessMap', mat.Metallic);
                if (mat.NormalMap) matInfo.applyTexture('normalMap', mat.NormalMap);
                if (mat.Emission) matInfo.applyTexture('emissiveMap', mat.Emission);
                if (mat.AmbientOcclusion) matInfo.applyTexture('aoMap', mat.AmbientOcclusion);
                if (mat.Alpha) matInfo.applyTexture('alphaMap', mat.Alpha);

                modelMaterials.push(matInfo);
            });
        }

        if (product.HDRI) applyHDMITexture(product.HDRI);
        if (product.Background) applyBackground(product.Background);
        render.toneMappingExposure = product.sceneBrightness;

        let data_cameraDefaultPos = null;
        let data_controlsDefaultTarget = null;
        for (var i = 0; i < 2; i++) { // i need to duble parse it because it duble stringified in the database
            try { data_cameraDefaultPos = JSON.parse(product.cameraDefaultPos); } catch {}
            try { data_controlsDefaultTarget = JSON.parse(product.controlsDefaultTarget); } catch {}
        }

        try {
            cameraDefaultPos.set(data_cameraDefaultPos.x, data_cameraDefaultPos.y, data_cameraDefaultPos.z);
            controlsDefaultTarget.set(data_controlsDefaultTarget.x, data_controlsDefaultTarget.y, data_controlsDefaultTarget.z);
        } catch {
            cameraDefaultPos.set(0, 0, 10);
            controlsDefaultTarget.set(0, 0, 0);
        }

        productName.value = product.Name;
        productPriceInput.value = product.Price;
        StockInput.value = product.Stock;
        //DescriptionInput.value = product.Description;
        if (uploadPanelQuill && product.Description) {
            // Inject the saved HTML into the editor
            uploadPanelQuill.clipboard.dangerouslyPasteHTML(product.Description);
        }


        _3dModel = product._3dModel;
        const modelPath = _3dModel;
        if (modelPath) {
            try {
                const loadobject = await loadModelAsync(modelPath);
                if (loadobject) {
                    setupLoadedModel(loadobject);
                    resetView();
                }
            } catch (error) {
                console.error("Error loading model:", error);
                showWarningMessage("oppps something went wrong while loading the model, please try again later");
            }
        }
    }

    updateCanvasUI();
    animate();
    function loadModelAsync(modelPath) {
        return new Promise((resolve, reject) => {
            if (!modelPath) return resolve(null);

            if (modelPath.endsWith('.fbx')) {
                const loader = new FBXLoader();
                loader.load(modelPath,(fbx) => resolve(fbx),undefined,(error) => reject(error));
            } else {
                const loader = new GLTFLoader();
                loader.load(modelPath, (gltf) => resolve(gltf.scene), undefined, (error) => reject(error));
            }
        });
    }
}
start();