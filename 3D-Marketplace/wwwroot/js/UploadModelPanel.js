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

class MaterialInfo {
    BaseColorFile = null;
    roughnessFile = null;
    metallicFile = null;
    normalMapFile = null;
    emission = null;
    ambientOcclusionFile = null;
    alphaFile = null;
    aoFile = null;

    #emissionBrightness = 1;
    #emissionColor = "#000000";
    #alphaTest = 0.5;
    #useDoubleSide = false;
    #makeMaterialTransmission = false;

    #ior = 1.5;
    #thickness = 1.5;
    #normalMapStrength = 1;

    constructor(name) {
        this.name = name;
        this.createDate = Date.now();
        this.modelMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1,
            transmission: 0.0,
            thickness: this.#thickness,
            ior: this.#ior,            
        });
        this.modelMaterial.emissive = new THREE.Color(this.#emissionColor).multiplyScalar(this.#emissionBrightness);
        this.modelMaterial.normalScale.set(this.#normalMapStrength, this.#normalMapStrength);
    }

    /**
     * @param {'map' | 'roughnessMap' | 'metalnessMap' | 'normalMap' | 'emissiveMap' | 'aoMap' | 'alphaMap'} channel 
     * @param {Blob | File} blobFile
     */
    applyTexture(channel, blobFile) {
        if (blobFile !== null) {
            const objectUrl = URL.createObjectURL(blobFile);

            textureLoader.load(objectUrl, (texture) => {
                if (channel === 'map' || channel === 'emissiveMap') {
                    texture.colorSpace = THREE.SRGBColorSpace;
                } else {
                    texture.colorSpace = THREE.NoColorSpace;
                }

                this.modelMaterial[channel] = texture;

                if (channel === 'alphaMap') {
                    this.modelMaterial.transparent = true;
                    this.modelMaterial.alphaTest = this.#alphaTest;

                    this.modelMaterial.depthWrite = true;
                }

                URL.revokeObjectURL(objectUrl);

                // i cant move thess tow line out of the current scop case the textureLoader.load is an async 
                // and we dont sure where the tetxure well be loaded so we well update the material befor the texture actualy set
                this.#storeFileReference(channel, blobFile);
                this.modelMaterial.needsUpdate = true;
            });
        } else {
            this.modelMaterial[channel] = null;

            if (channel === 'alphaMap') {
                this.modelMaterial.transparent = this.#makeMaterialTransmission;
                this.modelMaterial.alphaTest = this.#alphaTest;
            }

            this.#storeFileReference(channel, blobFile);
            this.modelMaterial.needsUpdate = true;
        }
    }

    #storeFileReference(channel, file) {
        switch (channel) {
            case 'map': this.BaseColorFile = file; break;
            case 'roughnessMap': this.roughnessFile = file; break;
            case 'metalnessMap': this.metallicFile = file; break;
            case 'normalMap': this.normalMapFile = file; break;
            case 'emissiveMap': this.emissionFile = file; break;
            case 'aoMap': this.ambientOcclusionFile = file; break;
            case 'alphaMap': this.alphaFile = file; break;
        }
    }

    setEmissionBrightness(value) {
        this.#emissionBrightness = parseFloat(value);
        this.modelMaterial.emissiveIntensity = parseFloat(value);
        this.modelMaterial.needsUpdate = true;
    }
    setEmissionColor(value) {
        this.#emissionColor = value;
        this.modelMaterial.emissive.set(value);
        this.modelMaterial.needsUpdate = true;
    }
    setAlphaTest(value) {
        this.#alphaTest = parseFloat(value);
        this.modelMaterial.alphaTest = parseFloat(value);
        this.modelMaterial.needsUpdate = true;
    }
    setUseDoubleSide(value) {
        this.#useDoubleSide = value;

        if (value == true) this.modelMaterial.side = THREE.DoubleSide;
        else this.modelMaterial.side = THREE.FrontSide;

        this.modelMaterial.needsUpdate = true;
    }
    setMakeMaterialTransmission(value) {
        this.#makeMaterialTransmission = Boolean(value);
        if (this.#makeMaterialTransmission) {
            this.modelMaterial.transmission = 1;
            this.modelMaterial.transparent = true;
        } else {
            this.modelMaterial.transmission = 0;
            this.modelMaterial.transparent = this.alphaFile !== null;
        }
    }
    setNormalMapStrength(v) {
        this.#normalMapStrength = parseFloat(v);
        this.modelMaterial.normalScale.set(this.#normalMapStrength, this.#normalMapStrength);
        this.modelMaterial.needsUpdate = true;
    }
    setIOR(v) {
        this.#ior = parseFloat(v);
        this.modelMaterial.ior = this.#ior;
        this.modelMaterial.needsUpdate = true;
    }
    setThickness(v) {
        this.#thickness = parseFloat(v);
        this.modelMaterial.thickness = this.#thickness;
        this.modelMaterial.needsUpdate = true;
    }

    getEmissionBrightness() { return this.#emissionBrightness; }
    getEmissionColor() { return this.#emissionColor; }
    getAlphaTest() { return this.#alphaTest; }
    getUseDoubleSide() { return this.#useDoubleSide; }
    getMakeMaterialTransmission() { return this.#makeMaterialTransmission; }
    getNormalMapStrength() { return this.#normalMapStrength; }
    getIOR() { return this.#ior; }
    getThickness() { return this.#thickness; }
}

/** @type {MaterialInfo[]} */
const modelMaterials = []


setDefault_HDMI();
setDefault_Background();


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
    canvas_uploadPanel.style.display = "none"
}
updateCanvasUI();
const canvas_removeModelBtn = document.getElementById('canvas-removeModel');
canvas_removeModelBtn.addEventListener('click', () => {
    scene.remove(model);
    model = null;
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

        tabsSpace.innerHTML = "";
        materialSpace.innerHTML = "";
        modelMaterials.length = 0; // Clear previous materials

        const materialMap = new Map(); // Track materials by name to avoid duplicates
        let tabsName = [];
        let HTMLMaterialElements = [];
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

            // If we already created a MaterialInfo wrapper for this material name, reuse it
            if (materialMap.has(mat.name)) {
                return materialMap.get(mat.name).modelMaterial;
            }

            const customMatInfo = new MaterialInfo(mat.name);
            materialMap.set(mat.name, customMatInfo);
            modelMaterials.push(customMatInfo);

            tabsName.push(mat.name);
            HTMLMaterialElements.push(creatMaterial(mat.name, customMatInfo));

            return customMatInfo.modelMaterial;
        }

        for (var i = 0; i < HTMLMaterialElements.length; i++) {
            materialSpace.appendChild(HTMLMaterialElements[i]);
        }
        tabsSpace.appendChild(createTabs(tabsName, HTMLMaterialElements, 'MaterialGroup'));


        scene.add(model);
        updateCanvasUI();

        // Clear the file input value so the user can re-upload the same file if they want
        event.target.value = "";
    }

    reader.readAsArrayBuffer(_3dModel);

})
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

    materialContainer.appendChild(createImageField('Base Color', (file) => material.applyTexture('map', file)));
    materialContainer.appendChild(createImageField('Roughness', (file) => material.applyTexture('roughnessMap', file)));
    materialContainer.appendChild(createImageField('Metallic', (file) => material.applyTexture('metalnessMap', file)));
    materialContainer.appendChild(createImageField('Normal Map', (file) => material.applyTexture('normalMap', file)));
    materialContainer.appendChild(createImageField('Emission', (file) => material.applyTexture('emissiveMap', file)));
    materialContainer.appendChild(createImageField('Ambient Occlusion', (file) => material.applyTexture('aoMap', file)));
    materialContainer.appendChild(createImageField('Alpha', (file) => material.applyTexture('alphaMap', file)));

    const whiteSpace = document.createElement('div');
    whiteSpace.style.height = '10px';
    materialContainer.appendChild(whiteSpace);

    materialContainer.appendChild(createInfoField('Normal Map Strength', 'number', 1, (v) => { material.setNormalMapStrength(v); }));
    materialContainer.appendChild(createInfoField('Emission Brightness', 'number', 1, (v) => { material.setEmissionBrightness(v); }));
    materialContainer.appendChild(createInfoField('Emission Color', 'color', '#000000', (v) => { material.setEmissionColor(v); }));
    materialContainer.appendChild(createInfoField('Alpha Test', 'number', 0.5));
    materialContainer.appendChild(createToggleButton('Use Double Side', (v) => { material.setUseDoubleSide(v); }));

    materialContainer.appendChild(createToggleButton('Make Material Transmission', (v) => {
        material.setMakeMaterialTransmission(v);
        if (v == true) glassMaterialContainer.style.display = 'flex';
        else glassMaterialContainer.style.display = 'none';
    }));

    const glassMaterialContainer = document.createElement('div');
    glassMaterialContainer.style.width = '100%';
    glassMaterialContainer.classList.add('column-Flex-Container');
    //glassMaterialContainer.appendChild(createInfoField('Transmission', 'number', 1, (v) => {  }));
    glassMaterialContainer.appendChild(createInfoField('Thickness', 'number', 1.5, (v) => { material.setThickness(v); }));
    glassMaterialContainer.appendChild(createInfoField('IOR', 'number', 1.5, (v) => { material.setIOR(v); }));
    glassMaterialContainer.style.display = 'none';

    materialContainer.appendChild(glassMaterialContainer);

    return materialContainer;
}

/**
 * @param {string} textureName
 * @param {function(File|Blob): void} onFileChange
 */ 
function createImageField(textureName, onFileChange) {
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
 * @param {function(Boolean): viod} onPress
 */
function createToggleButton(labelText, onPress) {
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

    container.appendChild(label);
    container.appendChild(whiteSpace);
    container.appendChild(toggleButton);
    return container;
}

let sceneBrightness = 1;
document.getElementById('infoContainer').insertAdjacentElement('afterbegin', createInfoField('Scene Brightness', 'number', 1, (v) => {
    sceneBrightness = parseFloat(v);
    render.toneMappingExposure = sceneBrightness;
}));

let BackgroundFile = null;
document.getElementById('infoContainer').insertAdjacentElement('afterbegin', createImageField('Backgroun', (f) => {
    BackgroundFile = f;
    if (BackgroundFile == null) {
        setDefault_Background();
    } else {
        textureLoader.load(URL.createObjectURL(BackgroundFile), (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            scene.background = t;
        });
    }
}));

let HDRIFile = null;
document.getElementById('infoContainer').insertAdjacentElement('afterbegin', createImageField('HDRI', (f) => {
    HDRIFile = f;
    if (HDRIFile == null) {
        setDefault_HDMI();
    } else {
        textureLoader.load(URL.createObjectURL(HDRIFile), (t) => {
            t.mapping = THREE.EquirectangularReflectionMapping;
            t.colorSpace = THREE.SRGBColorSpace;
            scene.environment = t;
        });
    }
}));

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

// creating the header tabs for Texture and Project
const headerTabsName = ['Texture', 'Project'];
const headerTabsElment = [document.getElementById('textureContainer'), document.getElementById('infoContainer')]
document.getElementById('headerTabs').appendChild(createTabs(headerTabsName, headerTabsElment, 'header', headerTabsName.map(n => n + 'Id')));

const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const StockInput = document.getElementById('StockInput');
const DescriptionInput = document.getElementById('DescriptionInput');
const ProjectTab = document.getElementById('ProjectId'); // this well come useful in reportValidity
// save the project without publishing it
document.getElementById('canvas-Save').addEventListener('click', async () => {

    if (productNameInput.value == "") {
        ProjectTab.click();
        productNameInput.reportValidity();
        return;
    }

    const productFormData = new FormData();

    productFormData.append("ViewDefaultRotation", JSON.stringify({ x: viewDefaultRotation.x, y: viewDefaultRotation.y }));
    productFormData.append("CameraDefaultZPos", cameraDefaultZPos);

    // if this a new project and dont have a thumbnail then just capture one
    if (thumbnaiFile == null && productId < 0) {
        await capturedThumbnail();
    }

    productFormData.append("_3dMofel", _3dModel);
    productFormData.append("Thumbnail", thumbnaiFile, "thumbnail.png");
    productFormData.append("HDRI", HDRIFile);
    productFormData.append("Background", BackgroundFile);
    productFormData.append("productId", productId); // this is varible is set in UploadMpdelPanel.cshtml
    productFormData.append("isPublished", isPublished); // this is varible is set in UploadMpdelPanel.cshtml
    productFormData.append("HDRI_Brightness", sceneBrightness);
    productFormData.append("ProductName", productNameInput.value);
    productFormData.append("productPrice", productPriceInput.value);
    productFormData.append("Stock", StockInput.value);
    productFormData.append("Description", DescriptionInput.value);

    const saveResponse = await fetch('/Home/SaveProduct', { method: 'POST', body: productFormData });

    // then save the material after successfully saving the product
    if (saveResponse.ok) {
        const productName = await saveResponse.json();

        const materialPromises = modelMaterials.map(mat => {
            const materialFormData = new FormData();
            materialFormData.append('productName', productName);
            materialFormData.append('materialName', mat.name);
            materialFormData.append('BaseColor', mat.BaseColorFile);
            materialFormData.append('Roughness', mat.roughnessFile);
            materialFormData.append('Emission', mat.emissionFile);
            materialFormData.append('Metallic', mat.metallicFile);
            materialFormData.append('NormalMap', mat.normalMapFile);
            materialFormData.append('AmbientOcclusion', mat.aoFile);
            materialFormData.append('Alpha', mat.alphaFile);

            materialFormData.append('emissionBrightness', mat.getEmissionBrightness());
            materialFormData.append('emissionColor', mat.getEmissionColor());
            materialFormData.append('alphaTest', mat.getAlphaTest());
            materialFormData.append('ior', mat.getIOR());
            materialFormData.append('thickness', mat.getThickness());
            materialFormData.append('normalMapStrength', mat.getNormalMapStrength());
            materialFormData.append('useDoubleSide', mat.getUseDoubleSide());
            materialFormData.append('makeMaterialTransmission', mat.getMakeMaterialTransmission());

            return fetch('/Home/SaveMaterial', { method: 'POST', body: materialFormData });
        });
        await Promise.all(materialPromises);
    }
    else {
        
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
