import * as view3d from './3dView.js';
import { MaterialInfo, SceneInfo } from './MyModels.js';

(() => {
    // Initialize 3D View instance for current DOM node
    view3d.init3DView();

    const storeItem = document.getElementById('storeItem');

    async function setUp() {
        //const response = await fetch('/Home/GetAllProducts');
        //const products = await response.json();

        // products are set in the cshtml when the page load
        products.forEach((p) => {
            const materials = [];
            const rawMaterials = p.materials || p.Materials || [];
            const modelPath = p._3dModel || p.modelPath || p._3DModelPath || "";

            rawMaterials.forEach((mat) => {
                const matName = mat.name || mat.Name;
                const matInfo = new MaterialInfo(matName);

                matInfo.setNormalMapStrength(mat.normalMap_Strength ?? mat.NormalMap_Strength ?? 1);
                matInfo.setEmissionBrightness(mat.emission_Brightness ?? mat.Emission_Brightness ?? 0);
                matInfo.setEmissionColor(mat.emission_Color ?? mat.Emission_Color ?? "#ffffff");
                matInfo.setAlphaTest(mat.alphaTest ?? 0);
                matInfo.setUseDoubleSide(mat.useDoubleSide ?? mat.UseDoubleSide ?? false);
                matInfo.setIOR(mat.ior ?? mat.IOR ?? 1.5);
                matInfo.setThickness(mat.thickness ?? mat.Thickness ?? 0);
                matInfo.setColor(mat.color ?? mat.Color ?? "#FFFFFF");
                matInfo.setMetalness(mat.metalnessProperty ?? mat.MetalnessProperty ?? 0);
                matInfo.setRoughness(mat.roughnessProperty ?? mat.RoughnessProperty ?? 0.5);
                matInfo.setMakeMaterialTransmission(mat.makeMaterialTransmission ?? mat.MakeMaterialTransmission ?? false);

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

            storeItem.appendChild(createStoreItem(materials, modelPath, p));
        });
    }

    setUp();

    const previewSelectedModel = document.getElementById('previewSelectedModel');
    const infoElments = document.querySelectorAll('.infoElement');
    const editBtn = document.getElementById('editBtn');

    document.getElementById('closePreviewBtn').addEventListener('click', () => {
        previewSelectedModel.style.display = 'none';
    });

    document.getElementById('infoBtn').addEventListener('click', (e) => {
        if (e.target.src.endsWith('info.svg')) {
            e.currentTarget.src = '/resources/NoInfo.svg';
            infoElments.forEach(el => el.style.display = 'none');
        } else {
            e.currentTarget.src = '/resources/info.svg';
            infoElments.forEach(el => el.style.display = 'block');
        }
    });

    const productName = document.getElementById('productName');
    const productDescription = document.getElementById('productDescription');
    const productPrice = document.getElementById('productPrice');
    const productSellerName = document.getElementById('productSellerName');
    const productSellerImage = document.getElementById('productSellerImage');

    function createStoreItem(materials, _3DModelPath, product) {
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

        const sceneInfo = new SceneInfo(
            product.hdrI_Brightness,
            product.hdri,
            product.background,
            product.controlsDefaultTarget,
            product.cameraDefaultPos
        );

        div.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Show modal first
            previewSelectedModel.style.display = 'flex';

            // 2. Set details
            productName.textContent = product.name;
            productDescription.textContent = product.description;
            productPrice.textContent = `$${product.price.toFixed(2)}`;
            productSellerName.textContent = product.seller.name;
            productSellerImage.src = product.seller.profilePicture ?? '/resources/avatar.svg';

            if (userName === product.seller.userName) {
                editBtn.style.display = 'block';
                editBtn.onclick = () => { switchToTab('UploadMode', product.id) };
            } else {
                editBtn.style.display = 'none';
                editBtn.onclick = () => { };
            }

            // 3. Load 3D scene
            view3d.SetThe3dScene(_3DModelPath, materials, sceneInfo);

            // 4. Defer resize call to next animation frame so DOM dimensions have evaluated
            requestAnimationFrame(() => {
                view3d.resize();
            });
        });

        return div;
    }
})();