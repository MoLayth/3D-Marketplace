# 3D-Marketplace
A high-performance, full-stack web application designed for 3D artists and sellers to upload, configure, and showcase 3D models directly in the browser. Built with ASP.NET Core and Vanilla JavaScript, this platform features a robust, SPA-like tabbed interface and a powerful built-in 3D engine powered by Three.js.

<img width="1526" height="863" alt="image" src="https://github.com/user-attachments/assets/751b78a7-c1c3-40f0-afe9-7a1b74a5bfa6" />

## Capabilities & Features
The application goes far beyond simple model viewing, offering an integrated 3D studio environment directly in the web browser:
1. Broad Format Support: Users can seamlessly upload .fbx, .gltf, and .glb files. and also automatically extracts the tetxure and property frome .gltf file and assign them to the new generated ui, and also its uporrt unlimited number of materials for models.
2. Dynamic Material Editor: The app automatically parses loaded models and generates dedicated UI tabs for every individual material found on the mesh.
3. Full PBR Workflow: Artists can upload and map custom textures for Base Color, Roughness, Metallic, Normal, Emission, Ambient Occlusion, and Alpha channels.
4. Glass & Transmission Physics: Supports advanced material properties including IOR (Index of Refraction), volumetric thickness, and transmission for realistic glass and liquid rendering.
5. Parametric Tweaking: Users can fine-tune metalness, roughness, normal map strength, emission brightness/color, and alpha testing via intuitive UI controls.
6. Environment Control: The scene is fully customizable, allowing users to upload their own HDRI environment maps and custom background images, as well as adjust overall scene brightness/exposure.
7. Integrated Thumbnail Generator: Includes a custom screenshot utility that temporarily isolates the 3D model, captures a high-quality snapshot using the renderer, and assigns it as the product's marketplace thumbnail.
8. when you set a thumbnail for the product when the user open to view your product it get represented with the same view that you set.

https://github.com/user-attachments/assets/3b828ef7-ddda-4626-a9db-89359296f728

https://github.com/user-attachments/assets/f76065c1-e461-41b1-bb51-94b9aee83313

## E-Commerce & Storefront Integration
The platform operates as a fully functional marketplace for showing 3d products:
1. Custom Profiles: Users can edit their display names and write personal bios.
2. Avatar Uploads: Supports .png and .jpg profile picture uploads with automatic file-size validation (limiting uploads to under 3MB) and circular image formatting.
3. Seller Portfolios: A user's profile dynamically fetches and displays their specific published products, acting as a personal portfolio.
4. Account Lifecycle: Full support for secure sign-in, account creation (with username validation), signing out, and permanent account deletion.
