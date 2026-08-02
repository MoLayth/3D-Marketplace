import * as view3d from './3dView.js';
import { MaterialInfo } from './MyModels.js';

const storeItem = document.getElementById('storeItem');

async function setUp() {
    const response = await fetch('/Home/GetAllProducts');
    const products = await response.json();

    products.forEach((p) => {
        const materials = [];

        // Support both camelCase (default JSON) and PascalCase properties safely
        const rawMaterials = p.materials || p.Materials || [];
        const modelPath = p._3dModel || p.modelPath || p._3DModelPath || "";

        rawMaterials.forEach((mat) => {
            const matName = mat.name || mat.Name;
            const matInfo = new MaterialInfo(matName);

            // Populate Material numerical properties safely
            matInfo.setNormalMapStrength(mat.normalMap_Strength ?? mat.NormalMap_Strength ?? 1);
            matInfo.setEmissionBrightness(mat.emission_Brightness ?? mat.Emission_Brightness ?? 0);
            matInfo.setEmissionColor(mat.emission_Color ?? mat.Emission_Color ?? "#ffffff");
            matInfo.setAlphaTest(mat.alphaTest ?? 0);
            matInfo.setUseDoubleSide(mat.useDoubleSide ?? mat.UseDoubleSide ?? false);
            matInfo.setMakeMaterialTransmission(mat.makeMaterialTransmission ?? mat.MakeMaterialTransmission ?? false);
            matInfo.setIOR(mat.ior ?? mat.IOR ?? 1.5);
            matInfo.setThickness(mat.thickness ?? mat.Thickness ?? 0);

            // Apply Textures
            const baseColor = mat.baseColor || mat.BaseColor;
            const roughness = mat.roughness || mat.Roughness;
            const metallic = mat.metallic || mat.Metallic;
            const normalMap = mat.normalMap || mat.NormalMap;
            const emission = mat.emission || mat.Emission;
            const ao = mat.ambientOcclusion || mat.AmbientOcclusion;
            const alpha = mat.alpha || mat.Alpha;

            if (baseColor) matInfo.applyTexture('map', baseColor);
            if (roughness) matInfo.applyTexture('roughnessMap', roughness);
            if (metallic) matInfo.applyTexture('metalnessMap', metallic);
            if (normalMap) matInfo.applyTexture('normalMap', normalMap);
            if (emission) matInfo.applyTexture('emissiveMap', emission);
            if (ao) matInfo.applyTexture('aoMap', ao);
            if (alpha) matInfo.applyTexture('alphaMap', alpha);

            materials.push(matInfo);
        });

        console.log(p);
        
        storeItem.appendChild(createStoreItem(materials, modelPath,p));
    });
}

setUp();

/**
 * @param {string} name
 * @param {string} imagePath
 * @param {number} productId
 * @param {MaterialInfo[]} materials
 * @param {string} _3DModelPath
 */
function createStoreItem(materials, _3DModelPath,product) {
    const div = document.createElement('div');
    div.dataset.productId = product.id;
    div.classList.add('Store-item-cover');
    div.style.background = `url(${product.thumbnail})`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';

    const label = document.createElement('label');
    label.textContent = product.name;
    label.classList.add('Store-item-cover-label');

    div.appendChild(label);

    const sceneInfo = new view3d.SceneInfo(product.hdrI_Brightness, product.hdri, product.background, product.defaultRotation, product.cameraDefaultZPos);

    div.addEventListener('click', (e) => {
        e.preventDefault();
        view3d.SetThe3dScene(_3DModelPath, materials, sceneInfo);
        view3d.Show3dView();
    });

    return div;
}