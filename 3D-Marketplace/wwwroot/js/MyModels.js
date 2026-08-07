import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

export class MaterialInfo {
    BaseColorMap = null;        // <----|
    roughnessMap = null;        //      |
    metallicMap = null;         //      |
    normalMap = null;           //      |<---- ( these all can be a file blob or just string path )
    emissionMap = null;         //      |
    ambientOcclusionMap = null; //      |
    alphaMap = null;            //      |
    aoMap = null;               // <----|

    #emissionBrightness = 1;
    #emissionColor = "#000000";
    #alphaTest = 0.5;
    #useDoubleSide = false;
    #makeMaterialTransmission = false;
    #color
    #metalness
    #roughness

    #ior = 1.5;
    #thickness = 1.5;
    #normalMapStrength = 1;

    constructor(name) {
        this.name = name;
        this.createDate = Date.now();
        this.modelMaterial = new THREE.MeshPhysicalMaterial({
            transmission: 0.0,
            thickness: this.#thickness,
            ior: this.#ior,
        });
        this.modelMaterial.emissive = new THREE.Color(this.#emissionColor).multiplyScalar(this.#emissionBrightness);
        this.modelMaterial.normalScale.set(this.#normalMapStrength, this.#normalMapStrength);

        this.setColor("#FFFFFF");
        this.setMetalness(0);
        this.setRoughness(0.5);
    }

    /**
    * @param {'map' | 'roughnessMap' | 'metalnessMap' | 'normalMap' | 'emissiveMap' | 'aoMap' | 'alphaMap'} channel 
    * @param {Blob | File | string} fileOrUrl
    */
    async applyTexture(channel, fileOrUrl) {
        if (fileOrUrl !== null && fileOrUrl !== undefined) {

            // 1. If it is already a THREE.Texture instance (from GLTFLoader / FBXLoader)
            if (fileOrUrl.isTexture) {
                const texture = fileOrUrl;

                // Apply color space corrections
                if (channel === 'map' || channel === 'emissiveMap') {
                    texture.colorSpace = THREE.SRGBColorSpace;
                } else {
                    texture.colorSpace = THREE.NoColorSpace;
                }

                this.modelMaterial[channel] = texture;

                if (channel === 'alphaMap') {
                    this.modelMaterial.transparent = true;
                    this.modelMaterial.alphaTest = this.getAlphaTest();
                    this.modelMaterial.depthWrite = true;
                }

                // i need to save it as file so the save system will work corectlay
                const flile = await this.textureToFile(texture, `${channel}.png`, 'image/png');
                this.#storeFileReference(channel, flile);

                this.modelMaterial.needsUpdate = true;
                return;
            }

            // 2. If it is a File, Blob, or URL string (from user upload or API path)
            let textureUrl = '';
            let isFile = fileOrUrl instanceof Blob || fileOrUrl instanceof File;

            if (isFile) {
                textureUrl = URL.createObjectURL(fileOrUrl);
            } else if (typeof fileOrUrl === 'string') {
                textureUrl = fileOrUrl; // Direct server file path (e.g. "/uploads/mats/color.png")
            }

            if (textureUrl) {
                textureLoader.load(textureUrl, (texture) => {
                    if (channel === 'map' || channel === 'emissiveMap') {
                        texture.colorSpace = THREE.SRGBColorSpace;
                    } else {
                        texture.colorSpace = THREE.NoColorSpace;
                    }

                    this.modelMaterial[channel] = texture;

                    if (channel === 'alphaMap') {
                        this.modelMaterial.transparent = true;
                        this.modelMaterial.alphaTest = this.getAlphaTest();
                        this.modelMaterial.depthWrite = true;
                    }

                    // Only revoke temporary object URLs created from local Blobs/Files
                    if (isFile) {
                        URL.revokeObjectURL(textureUrl);
                    }


                    this.#storeFileReference(channel, fileOrUrl);
                    this.modelMaterial.needsUpdate = true;
                });
            }
        } else {
            this.modelMaterial[channel] = null;

            if (channel === 'alphaMap') {
                this.modelMaterial.transparent = this.getMakeMaterialTransmission();
                this.modelMaterial.alphaTest = this.getAlphaTest();
            }

            this.#storeFileReference(channel, null);
            this.modelMaterial.needsUpdate = true;
        }        
    }
    /**
     * Converts a THREE.Texture instance into a File object.
     * @param {THREE.Texture} texture - The Three.js texture to convert.
     * @param {string} fileName - Desired file name (e.g., 'baseColor.png').
     * @param {string} mimeType - Image format ('image/png' or 'image/jpeg').
     * @returns {Promise<File|null>}
     */
    async textureToFile(texture, fileName = 'texture.png', mimeType = 'image/png') {
        if (!texture || !texture.image) return null;

        const image = texture.image;

        // Create a temporary canvas matching texture dimensions
        const canvas = document.createElement('canvas');
        canvas.width = image.width || 512;
        canvas.height = image.height || 512;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        if (texture.flipY == false) {
            ctx.translate(0, image.height || 512);
            ctx.scale(1, -1);
        }

        // Draw ImageBitmap, HTMLImageElement, or Canvas directly onto our temporary canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Convert canvas content to a Blob, then wrap in a File object
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                const file = new File([blob], fileName, { type: mimeType });
                resolve(file);
            }, mimeType, 0.95);
        });
    }

    #storeFileReference(channel, file) {
        switch (channel) {
            case 'map': this.BaseColorMap = file; break;
            case 'roughnessMap': this.roughnessMap = file; break;
            case 'metalnessMap': this.metallicMap = file; break;
            case 'normalMap': this.normalMap = file; break;
            case 'emissiveMap': this.emissionMap = file; break;
            case 'aoMap': this.ambientOcclusionMap = file; break;
            case 'alphaMap': this.alphaMap = file; break;
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
            this.modelMaterial.metalness = 0;
            this.modelMaterial.roughness= 0;
        } else {
            this.modelMaterial.transmission = 0;
            this.setMetalness(this.#metalness);
            this.setRoughness(this.#roughness);
            this.modelMaterial.transparent = this.alphaMap !== null;
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
    setColor(v) {
        this.#color = v;
        this.modelMaterial.color.set(v);
    }
    setMetalness(v) {
        this.#metalness = parseFloat(v);
        this.modelMaterial.metalness = this.#metalness;
    }
    setRoughness(v) {
        this.#roughness = parseFloat(v);
        this.modelMaterial.roughness = this.#roughness;
    }

    getEmissionBrightness() { return this.#emissionBrightness; }
    getEmissionColor() { return this.#emissionColor; }
    getAlphaTest() { return this.#alphaTest; }
    getUseDoubleSide() { return this.#useDoubleSide; }
    getMakeMaterialTransmission() { return this.#makeMaterialTransmission; }
    getNormalMapStrength() { return this.#normalMapStrength; }
    getIOR() { return this.#ior; }
    getThickness() { return this.#thickness; }
    getColor() { return this.#color; }
    getMetalness() { return this.#metalness; }
    getRoughness() { return this.#roughness; }
}
export class SceneInfo {
    constructor(sceneBrightness, HDRI, Background, controlsDefaultTarget, cameraDefaultPos) {
        //this.cameraDefaultZPos = cameraDefaultZPos || 5;

        this.cameraDefaultPos = new THREE.Vector3(0, 0, 10);
        this.controlsDefaultTarget = new THREE.Vector3(0, 0, 0);    

        let data_cameraDefaultPos = null;
        let data_controlsDefaultTarget = null;
        for (var i = 0; i < 2; i++) { // i need to duble parse it because it duble stringified in the database
            try { data_cameraDefaultPos = JSON.parse(cameraDefaultPos); } catch { }
            try { data_controlsDefaultTarget = JSON.parse(controlsDefaultTarget); } catch { }
        }

        try {
            this.cameraDefaultPos.set(data_cameraDefaultPos.x, data_cameraDefaultPos.y, data_cameraDefaultPos.z);
            this.controlsDefaultTarget.set(data_controlsDefaultTarget.x, data_controlsDefaultTarget.y, data_controlsDefaultTarget.z);
        } catch {}


        this.HDRI = HDRI || '/resources/DefaultHDMI.jpg';
        this.sceneBrightness = sceneBrightness || 1.0;

        //this.viewDefaultRotation = this.parseRotation(viewDefaultRotation);

        this.Background = Background || '/resources/ModelBackground.jpg';
    }
}