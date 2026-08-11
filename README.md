# 3D-Marketplace
A high-performance, full-stack web application designed for 3D artists and sellers to upload, configure, and showcase 3D models directly in the browser. Built with ASP.NET Core and Vanilla JavaScript, this platform features a robust, SPA-like tabbed interface and a powerful built-in 3D engine powered by Three.js.

<img width="1526" height="863" alt="image" src="https://github.com/user-attachments/assets/751b78a7-c1c3-40f0-afe9-7a1b74a5bfa6" />

## Capabilities & Features
The application goes far beyond simple model viewing, offering an integrated 3D studio environment directly in the web browser:
1. **Broad Format Support**: Seamlessly upload `.fbx`, `.gltf`, and `.glb` files. Automatically extracts textures and material properties from `.gltf` files to populate the generated UI, with support for an unlimited number of materials per model.
2. **Dynamic Material Editor**: Automatically parses loaded models and generates dedicated UI tabs for every individual material found on the mesh.
3. **Full PBR Workflow**: Map custom textures for Base Color, Roughness, Metallic, Normal, Emission, Ambient Occlusion, and Alpha channels.
4. **Glass & Transmission Physics**: Supports advanced material properties including IOR (Index of Refraction), volumetric thickness, and transmission for realistic glass and liquid rendering.
5. **Parametric Tweaking**: Fine-tune metalness, roughness, normal map strength, emission brightness/color, and alpha testing via intuitive UI controls.
6. **Environment Control**: Upload custom HDRI environment maps or background images, and adjust overall scene lighting/exposure.
7. **Integrated Thumbnail Generator**: A custom snapshot utility isolates the model, captures a high-resolution snapshot using the WebGL renderer, and sets it as the product thumbnail.
8. **Camera Perspective Sync**: Setting a thumbnail locks in the exact camera view and orientation, so prospective buyers view the product from the artist's specified angle.

https://github.com/user-attachments/assets/3b828ef7-ddda-4626-a9db-89359296f728

https://github.com/user-attachments/assets/f76065c1-e461-41b1-bb51-94b9aee83313

https://github.com/user-attachments/assets/19fec412-f2a9-4ce8-8280-15a238dbe367

## E-Commerce & Storefront Integration
A complete marketplace ecosystem for showcasing assets and managing creator portfolios:
1. **Custom Profiles**: Edit display names, bios, and personal portfolio details.
2. **Avatar Uploads**: Supports `.png` and `.jpg` uploads with automatic file-size validation (under 3MB) and circular formatting.
3. **Seller Portfolios**: Dynamically fetches and showcases all published products directly on the seller's profile page.
4. **Account Lifecycle**: Secure sign-in, account creation with username validation, session sign-out, and permanent account deletion options.

https://github.com/user-attachments/assets/5cfb8f5e-3b18-4c7b-96f2-0cd9f4387741
