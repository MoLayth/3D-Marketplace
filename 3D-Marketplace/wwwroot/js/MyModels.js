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

    #ior = 1.5;
    #thickness = 1.5;
    #normalMapStrength = 1;

    constructor(name) {
        this.name = name;
        this.createDate = Date.now();
        this.modelMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 1,
            metalness: 1, // maybe i need to double check this if it work correctly
            transmission: 0.0,
            thickness: this.#thickness,
            ior: this.#ior,
        });
        this.modelMaterial.emissive = new THREE.Color(this.#emissionColor).multiplyScalar(this.#emissionBrightness);
        this.modelMaterial.normalScale.set(this.#normalMapStrength, this.#normalMapStrength);
    }

    /**
    * @param {'map' | 'roughnessMap' | 'metalnessMap' | 'normalMap' | 'emissiveMap' | 'aoMap' | 'alphaMap'} channel 
    * @param {Blob | File | string} fileOrUrl
    */
    applyTexture(channel, fileOrUrl) {
        if (fileOrUrl !== null && fileOrUrl !== undefined) {
            let textureUrl = '';
            let isFile = fileOrUrl instanceof Blob || fileOrUrl instanceof File;

            if (isFile) {
                textureUrl = URL.createObjectURL(fileOrUrl);
            } else if (typeof fileOrUrl === 'string') {
                textureUrl = fileOrUrl; // Direct server file path (e.g. "/uploads/mats/color.png")
            }

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
        } else {
            this.modelMaterial.transmission = 0;
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

    getEmissionBrightness() { return this.#emissionBrightness; }
    getEmissionColor() { return this.#emissionColor; }
    getAlphaTest() { return this.#alphaTest; }
    getUseDoubleSide() { return this.#useDoubleSide; }
    getMakeMaterialTransmission() { return this.#makeMaterialTransmission; }
    getNormalMapStrength() { return this.#normalMapStrength; }
    getIOR() { return this.#ior; }
    getThickness() { return this.#thickness; }
}
export class SceneInfo {
    constructor(sceneBrightness, HDRI, Background, viewDefaultRotation, cameraDefaultZPos) {
        this.cameraDefaultZPos = cameraDefaultZPos || 5;
        this.HDRI = HDRI || '/resources/DefaultHDMI.jpg';
        this.sceneBrightness = sceneBrightness || 1.0;

        this.viewDefaultRotation = this.parseRotation(viewDefaultRotation);
        this.Background = Background || '/resources/ModelBackground.jpg';
    }

    parseRotation(rawRotation) {
        if (!rawRotation) return new THREE.Vector2(0, 0);

        let data = rawRotation;

        // 1. If it's a string, try parsing it
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn("Failed first JSON.parse on rotation:", rawRotation);
                return new THREE.Vector2(0, 0);
            }
        }

        // 2. If it was double-stringified, data is still a string! Parse a second time.
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.warn("Failed second JSON.parse on rotation:", data);
                return new THREE.Vector2(0, 0);
            }
        }

        // 3. Now data is guaranteed to be an object with {x, y}
        if (data && typeof data === 'object') {
            const x = Number(data.x) || 0;
            const y = Number(data.y) || 0;
            return new THREE.Vector2(x, y);
        }

        return new THREE.Vector2(0, 0);
    }
}