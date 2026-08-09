using _3D_Marketplace.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace _3D_Marketplace.Controllers {
    public class HomeController : Controller {
        private ApplicationDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public HomeController(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment) {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        public IActionResult Index() {

            // this view data info well be used in _layout.cshtml 
            UserData? user = GetUserViaCookies();
            if (user != null) {
                ViewData["Name"] = user.Name;
                ViewData["ProfilePic"] = user.ProfilePicture;

                string? username = Request.Cookies["RememberMeUser"];
                ViewData["UserName"] = username;
            }

            return View(_context.products.ToArray());
        }

        [HttpGet]
        public IActionResult OpenEditProductPage(int productId) {
            ProductData targetProduct = _context.products.Include(p => p.Materials).FirstOrDefault(p=>p.Id == productId);
            return View("UploadModelPanel", targetProduct);
        }

        //public IActionResult GetAllProducts() {
        //    return Json(_context.products.Include(p=>p.Materials).Include(p => p.Seller).ToArray());
        //}

        public async Task<IActionResult> PublishProduct(int productId) {
            ProductData product = _context.products.FirstOrDefault(p => p.Id == productId);

            if (product == null) return NotFound();
            product.isPublished = true;

            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpGet]
        public IActionResult LoadTab_StoreItems(string targetSellerProducts,bool publishOnly) {
            IQueryable<ProductData> products;
            if (string.IsNullOrEmpty(targetSellerProducts)) {
                products = _context.products.Include(p => p.Materials).Include(p => p.Seller);
            }
            else {
                products = _context.products.Include(p => p.Materials).Include(p => p.Seller).Where(p => p.Seller.UserName == targetSellerProducts);
            }

            if (publishOnly) products = products.Where(p => p.isPublished == true);

            return PartialView("StoreItems",model: products.ToArray());
        }
        public IActionResult LoadTab_EditProfile() {
            string? username = Request.Cookies["RememberMeUser"];
            return PartialView("EditProfile", model: _context.Users.FirstOrDefault(u => u.UserName == username));
        }

        [HttpPost]
        public IActionResult LoadTab_UploadMode(int productId = -1) {
            ProductData? product = null;
            if (productId >= 0) {
                var user = GetUserViaCookies();
                if (user != null)
                    product = user.products.FirstOrDefault(p => p.Id == productId);
            }

            return PartialView("UploadModelPanel",model: product);
        }

        [HttpGet]
        public IActionResult GetUserData(string Username) {
            UserData selectedUser = _context.Users.FirstOrDefault(u => u.UserName == Username); 

            return Json(new { name = selectedUser.Name, bio = selectedUser.Bio , profileImageUrl = selectedUser.ProfilePicture });
        }

        public class ProductUploadDto {
            public int ProductId { get; set; }
            public bool IsPublished { get; set; }
            public string controlsDefaultTarget { get; set; } = "{\"x\":0,\"y\":0,\"z\":0}";
            public string cameraDefaultPos { get; set; } = "{\"x\":0,\"y\":0,\"z\":10}";

            // Files vs Paths
            public IFormFile? ModelFile { get; set; }
            public string? ModelPath { get; set; }

            public IFormFile? ThumbnailFile { get; set; }
            public string? ThumbnailPath { get; set; }

            public IFormFile? HdriFile { get; set; }
            public string? HdriPath { get; set; }

            public IFormFile? BackgroundFile { get; set; }
            public string? BackgroundPath { get; set; }

            public float HdriBrightness { get; set; }
            public string ProductName { get; set; } = string.Empty;
            public decimal ProductPrice { get; set; }
            public int Stock { get; set; }
            public string? Description { get; set; }
        }
        [HttpPost]
        public async Task<IActionResult> SaveProduct([FromForm] ProductUploadDto dto) {
            UserData user = GetUserViaCookies();
            if (user == null) return Unauthorized();

            var existingProduct = user.products.FirstOrDefault(p => p.Id == dto.ProductId);
            ProductData Product = existingProduct ?? new ProductData();
            string safeFolderName = Path.Join("3d-assets",GetSafeStringForPath(user.UserName) ,GetSafeStringForPath(Product.Folder));

            async Task<string?> ResolveAssetPath(IFormFile? fileUpload, string? existingPath, string filePrefix,string fileExtension = "") {
                if (fileUpload != null && fileUpload.Length > 0) {
                    return await SaveFile(safeFolderName, filePrefix, fileUpload,fileExtension);
                }
                return existingPath; // Keeps existing path string if no new file uploaded
            }

            string modelPath = await ResolveAssetPath(dto.ModelFile, dto.ModelPath, "_3dModel");
            string? thumbnailPath = await ResolveAssetPath(dto.ThumbnailFile, dto.ThumbnailPath, "Thumbnail",".png");
            string? hdriPath = await ResolveAssetPath(dto.HdriFile, dto.HdriPath, "hdri");
            string? backgroundPath = await ResolveAssetPath(dto.BackgroundFile, dto.BackgroundPath, "Background");

            Product.Name = dto.ProductName;
            Product.Price = dto.ProductPrice;
            Product.Stock = dto.Stock;
            Product.Description = dto.Description;
            Product.isPublished = dto.IsPublished;
            Product.cameraDefaultPos = dto.cameraDefaultPos;
            Product.controlsDefaultTarget = dto.controlsDefaultTarget;
            Product.HDRI_Brightness = dto.HdriBrightness;
           
            if (!string.IsNullOrEmpty(thumbnailPath)) Product.Thumbnail = thumbnailPath;
            Product._3dModel = modelPath;   

            if (existingProduct != null) {
                if (string.IsNullOrEmpty(hdriPath) && !Product.HDRI.Contains("DefaultHDMI"))
                    DeleteFileIfExist(Product.HDRI);

                if (string.IsNullOrEmpty(backgroundPath) && !Product.Background.Contains("ModelBackground"))
                    DeleteFileIfExist(Product.Background);
            }
            else {
                Product.SellerId = user.Id;
                Product.Seller = user;

                user.products.Add(Product);
            }

            Product.HDRI = string.IsNullOrEmpty(hdriPath) ? defaultHDMIPath : hdriPath;
            Product.Background = string.IsNullOrEmpty(backgroundPath) ? defaultBackgroundPath : backgroundPath;

            await _context.SaveChangesAsync();
            return Json(new { id = Product.Id , name = Product.Name });
        }
        private string defaultHDMIPath => "/resources/DefaultHDMI.jpg";
        private string defaultBackgroundPath => "/resources/ModelBackground.jpg";
        public class MaterialUploadDto {
            public string ProductName { get; set; }
            public string MaterialName { get; set; }

            // Textures: Standard pattern splits File Upload from Existing Path String
            public IFormFile? BaseColorFile { get; set; }
            public string? BaseColorPath { get; set; }

            public IFormFile? RoughnessFile { get; set; }
            public string? RoughnessPath { get; set; }

            public IFormFile? EmissionFile { get; set; }
            public string? EmissionPath { get; set; }

            public IFormFile? MetallicFile { get; set; }
            public string? MetallicPath { get; set; }

            public IFormFile? NormalMapFile { get; set; }
            public string? NormalMapPath { get; set; }

            public IFormFile? AmbientOcclusionFile { get; set; }
            public string? AmbientOcclusionPath { get; set; }

            public IFormFile? AlphaFile { get; set; }
            public string? AlphaPath { get; set; }

            // Material Numeric Properties
            public float EmissionBrightness { get; set; }
            public string EmissionColor { get; set; } = "#000000";
            public float AlphaTest { get; set; } = 0.5f;
            public float Ior { get; set; } = 1.5f;
            public float Thickness { get; set; }
            public float NormalMapStrength { get; set; } = 1.0f;
            public bool UseDoubleSide { get; set; }
            public bool MakeMaterialTransmission { get; set; }
            public string Color { get; set; } = "#FFFFFF";
            public float MetalnessProperty { get; set; } = 0.0f;
            public float RoughnessProperty { get; set; } = .5f;
        }
        // this should be run after i create the product
        [HttpPost]
        public async Task<IActionResult> SaveMaterial([FromForm] MaterialUploadDto dto) {

            UserData user = GetUserViaCookies();
            ProductData product = _context.products.Include(p => p.Materials).FirstOrDefault(p => p.Name == dto.ProductName);
            if (product == null || user == null)
                return BadRequest();

            string safeFolderName = Path.Join("3d-assets", GetSafeStringForPath(user.UserName), GetSafeStringForPath(product.Folder),GetSafeStringForPath(dto.MaterialName) + "_Material");

            async Task<string?> ResolveTexturePath(IFormFile? fileUpload, string? existingPath, string filePrefix) {
                if (fileUpload != null && fileUpload.Length > 0) {
                    return await SaveFile(safeFolderName, filePrefix, fileUpload);
                }
                return existingPath; // Keeps the existing path string if no new file is uploaded
            }

            string? baseColorPath = await ResolveTexturePath(dto.BaseColorFile, dto.BaseColorPath, "baseColor");
            string? roughnessPath = await ResolveTexturePath(dto.RoughnessFile, dto.RoughnessPath, "roughness");
            string? emissionPath = await ResolveTexturePath(dto.EmissionFile, dto.EmissionPath, "emission");
            string? metallicPath = await ResolveTexturePath(dto.MetallicFile, dto.MetallicPath, "metallic");
            string? normalPath = await ResolveTexturePath(dto.NormalMapFile, dto.NormalMapPath, "normal");
            string? aoPath = await ResolveTexturePath(dto.AmbientOcclusionFile, dto.AmbientOcclusionPath, "ao");
            string? alphaPath = await ResolveTexturePath(dto.AlphaFile, dto.AlphaPath, "alpha");

            MaterialData existingMaterial = product.Materials.FirstOrDefault(x => x.Name == dto.MaterialName);

            if (existingMaterial != null) {
                // Delete old files only if BOTH new file path AND existing path are empty (meaning user intentionally deleted texture)
                if (string.IsNullOrEmpty(baseColorPath)) DeleteFileIfExist(existingMaterial.BaseColor);
                if (string.IsNullOrEmpty(roughnessPath)) DeleteFileIfExist(existingMaterial.Roughness);
                if (string.IsNullOrEmpty(emissionPath)) DeleteFileIfExist(existingMaterial.Emission);
                if (string.IsNullOrEmpty(metallicPath)) DeleteFileIfExist(existingMaterial.Metallic);
                if (string.IsNullOrEmpty(normalPath)) DeleteFileIfExist(existingMaterial.NormalMap);
                if (string.IsNullOrEmpty(aoPath)) DeleteFileIfExist(existingMaterial.AmbientOcclusion);
                if (string.IsNullOrEmpty(alphaPath)) DeleteFileIfExist(existingMaterial.Alpha);
            }

            MaterialData material = existingMaterial ?? new MaterialData();
            material.Name = dto.MaterialName;
            material.BaseColor = baseColorPath;
            material.Roughness = roughnessPath;
            material.Emission = emissionPath;
            material.Metallic = metallicPath;
            material.NormalMap = normalPath;
            material.AmbientOcclusion = aoPath;
            material.Alpha = alphaPath;

            material.Emission_Brightness = dto.EmissionBrightness;
            material.Emission_Color = dto.EmissionColor;
            material.alphaTest = dto.AlphaTest;
            material.IOR = dto.Ior;
            material.Thickness = dto.Thickness;
            material.NormalMap_Strength = dto.NormalMapStrength;
            material.UseDoubleSide = dto.UseDoubleSide;
            material.makeMaterialTransmission = dto.MakeMaterialTransmission;
            material.Color = dto.Color ?? "#FFFFFF";
            material.MetalnessProperty = dto.MetalnessProperty;
            material.RoughnessProperty = dto.RoughnessProperty;

            if (existingMaterial == null) {
                product.Materials.Add(material);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
        private string GetSafeStringForPath(string value) {
            return string.Concat(value.Split(Path.GetInvalidFileNameChars()));
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteProduct(int productId) {
            UserData user = GetUserViaCookies();
            if (user == null) return Unauthorized();
            ProductData product = user.products.FirstOrDefault(p => p.Id == productId);
            if (product == null) return NotFound();

            string safeFolderName = Path.Join(_webHostEnvironment.WebRootPath,"resources", "3d-assets", GetSafeStringForPath(user.UserName), GetSafeStringForPath(product.Folder));
            if (Directory.Exists(safeFolderName)) {
                // try to delete the hole folder, if it fails delete the files one by one and then throw the exception
                try { Directory.Delete(safeFolderName, recursive: true); }

                catch (Exception) {

                    DeleteFileIfExist(product.Thumbnail);
                    DeleteFileIfExist(product._3dModel);

                    if (product.HDRI != defaultHDMIPath) DeleteFileIfExist(product.HDRI);
                    if (product.Background != defaultBackgroundPath) DeleteFileIfExist(product.Background);
                    foreach (var material in product.Materials) {
                        DeleteFileIfExist(material.BaseColor);
                        DeleteFileIfExist(material.Roughness);
                        DeleteFileIfExist(material.Emission);
                        DeleteFileIfExist(material.Metallic);
                        DeleteFileIfExist(material.NormalMap);
                        DeleteFileIfExist(material.AmbientOcclusion);
                        DeleteFileIfExist(material.Alpha);
                    }
                }
            }
            else return NotFound();

            // Always remove the database record even if the folder deletion fails, to avoid orphaned records
            _context.products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok();
        }

        // path is a web Path something like: /resources/folder_name/file_name
        private void DeleteFileIfExist(string? path) {
            if(string.IsNullOrEmpty(path)) return;

            string relativePath = path.Replace('/', Path.DirectorySeparatorChar);
            string physicalPath = Path.Combine(_webHostEnvironment.WebRootPath, relativePath);

            if (!System.IO.File.Exists(physicalPath)) return;

            System.IO.File.Delete(physicalPath);
        }

        /// <summary>
        /// this function well save any kind of file to a physical path
        /// </summary>
        /// <param name="folderName"></param>
        /// <param name="fileName"></param>
        /// <param name="file"></param>
        /// <param name="extension"> extension optional if the file dos'nt have one this well be applied for example ".png" </param>
        /// <returns></returns>
        private async Task<string> SaveFile(string folderName,string fileName,IFormFile file,string extension = "") {
            string fileExtension = Path.GetExtension(file.FileName);

            string dir = Path.Join(_webHostEnvironment.WebRootPath, "resources", folderName);
            if (!Directory.Exists(dir)) { 
                Directory.CreateDirectory(dir);
            }

            if (string.IsNullOrEmpty(fileExtension)) fileExtension = extension;
            string savePath = Path.Join(dir, fileName + fileExtension);
            
            using (var stream = new FileStream(savePath, FileMode.Create)) {
                await file.CopyToAsync(stream);
            }

            string webRelativePath = Path.Combine("resources", folderName, fileName + fileExtension).Replace('\\', '/');
            return "/" + webRelativePath;
        }

        [HttpPost]
        public IActionResult CreateAccount(string user, string password) {
            UserData newUser = new UserData();
            newUser.UserName = user;

            var hasher = new PasswordHasher<string>();
            newUser.Password = hasher.HashPassword(user,password);
            newUser.Name = $"New User";

            ViewData["Name"] = newUser.Name;
            ViewData["ProfilePic"] = null;

            try {
                _context.Users.Add(newUser);
                _context.SaveChanges();
                AddRememberUserCookies(newUser);
                return Ok();
            }
            catch (Exception) {
                return BadRequest();
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateProfile(string username, string name, string bio,bool removePicture, IFormFile? profilePic) {

            UserData user = _context.Users.FirstOrDefault(u=>u.UserName == username);

            if (user == null) {
                Console.WriteLine("there no user with username: " + username);
                return BadRequest();
            }

            user.Name = name;
            user.Bio = bio;

            if (profilePic != null && profilePic.Length != 0) {
                RemoveUserProfilePicture(user);

                string fileType = profilePic.ContentType.ToLower().Contains("png") ? ".png" : ".jpg";
                string savePath = Path.Join(_webHostEnvironment.WebRootPath , "/resources/userPic", username + fileType);
                // save the uploaded image
                using (var stream = new FileStream(savePath, FileMode.Create)) {
                    await profilePic.CopyToAsync(stream);
                }

                user.ProfilePicture = $"/resources/userPic/{username}{fileType}";
            }
            else {
                if (removePicture) {
                    RemoveUserProfilePicture(user);
                }
            }            

            _context.SaveChanges();

            return Ok();
        }
        void RemoveUserProfilePicture(UserData user) {
            if (string.IsNullOrEmpty(user.ProfilePicture)) return;

            string picPath = Path.Join(_webHostEnvironment.WebRootPath, user.ProfilePicture);
            System.IO.File.Delete(picPath);
            user.ProfilePicture = null;
        }

        [HttpPost]
        public IActionResult DeleteAccount(string username) {
            UserData user = _context.Users.FirstOrDefault(u => u.UserName == username);
            if (user == null) {
                return BadRequest();
            }

            RemoveUserProfilePicture(user);
            _context.Users.Remove(user);
            _context.SaveChanges();

            if (Request.Cookies.ContainsKey("RememberMeUser"))
                Response.Cookies.Delete("RememberMeUser");

            return Ok();
        }
        [HttpPost]
        public IActionResult SicgnOut() {
            if (Request.Cookies.ContainsKey("RememberMeUser")) {
                Response.Cookies.Delete("RememberMeUser");
            }
            return Ok();
        }

        [HttpPost]
        public IActionResult SignIn(string user, string password) {
            var existingUser = _context.Users.FirstOrDefault(u => u.UserName == user);

            var hasher = new PasswordHasher<string>();

            PasswordVerificationResult result = hasher.VerifyHashedPassword(user, existingUser.Password, password);

            if (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded) {
                AddRememberUserCookies(existingUser);
                return Ok();
            }
            else {
                return BadRequest();
            }
        }

        [HttpGet]
        public IActionResult IsUserSignIn() {
            return Json(Request.Cookies.ContainsKey("RememberMeUser"));
        }

        [HttpGet]
        public IActionResult IsUserNameExist(string userName) { 
            bool exists = _context.Users.Any(u => u.UserName == userName);
            return Json(exists);
        }

        private UserData? GetUserViaCookies() {
            if (Request.Cookies.ContainsKey("RememberMeUser")) {
                string username = Request.Cookies["RememberMeUser"];
                return  _context.Users.Include( u => u.products ).ThenInclude(p => p.Materials).FirstOrDefault(u => u.UserName == username);
            }

            return null;
        }

        private void AddRememberUserCookies(UserData user) {
            // adding Cookies so the user don't need to login every time he get to the site
            CookieOptions options = new CookieOptions() {
                IsEssential = true,
                HttpOnly = true,
                Secure = true
            };
            options.Expires = DateTime.Now.AddDays(30);
            Response.Cookies.Append("RememberMeUser", user.UserName, options);
        }
    }
}
