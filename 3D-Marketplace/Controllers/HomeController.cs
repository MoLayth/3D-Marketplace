using _3D_Marketplace.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            }

            return View(_context.products.ToArray());
        }

        [HttpGet]
        public IActionResult OpenEditProductPage(int productId) {
            ProductData targetProduct = _context.products.Include(p=>p.Materials).FirstOrDefault(p=>p.Id == productId);
            return View("UploadModelPanel", targetProduct);
        }

        public IActionResult GetAllProducts() {
            return Json(_context.products.ToArray());
        }

        public IActionResult LoadTab_EditProfile() {
            string? username = Request.Cookies["RememberMeUser"];
            return PartialView("EditProfile", model: _context.Users.FirstOrDefault(u => u.UserName == username));
        }
        public IActionResult LoadTab_UploadMode(string productName = "") {
            ProductData? product = null;
            if (!string.IsNullOrEmpty(productName)) {
                var user = GetUserViaCookies();
                if (user != null)
                    product = user.products.FirstOrDefault(p => p.Name == productName);
            }

            return PartialView("UploadModelPanel",model: product);
        }

        [HttpGet]
        public IActionResult GetUserData(string Username) {
            UserData selectedUser = _context.Users.FirstOrDefault(u => u.UserName == Username); 

            return Json(new { name = selectedUser.Name, bio = selectedUser.Bio , profileImageUrl = selectedUser.ProfilePicture });
        }

        [HttpPost]
        public async Task<IActionResult> SaveProduct(
                                       int productId,bool isPublished, string ViewDefaultRotation, float CameraDefaultZPos,
                                       IFormFile? Thumbnail, IFormFile _3dMofel, IFormFile? HDRI, IFormFile? Background,
                                       float Emission_Brightness, float HDRI_Brightness, string ProductName,
                                       float productPrice,int Stock, string Description) {


            UserData user = GetUserViaCookies();
            string safeFolderName = Path.Join("3d-assets",GetSafeStringForPath(user.UserName) ,GetSafeStringForPath(ProductName));

            string _3dModelPath = await SaveFile(safeFolderName, "_3dModel", _3dMofel);
            string thumbnailPath = await SaveFile(safeFolderName, "Thumbnail", Thumbnail);
            string? hdriPath = HDRI != null ? await SaveFile(safeFolderName, "hdri", HDRI) : null;
            string? backgroundPath = Background != null ? await SaveFile(safeFolderName, "Background", Background) : null;


            ProductData? existingProduct = user.products.FirstOrDefault(p => p.Id == productId);
            if (existingProduct != null) {

                existingProduct.Price = (decimal)productPrice;
                existingProduct.Stock = Stock;
                existingProduct.Description = Description;

                existingProduct._3dModel = _3dModelPath;

                existingProduct.CameraDefaultZPos = CameraDefaultZPos;
                existingProduct.ViewDefaultRotation = ViewDefaultRotation;

                // if the user remove an previously assigned text and the texture still exist then delete it except thumbnail
                if (string.IsNullOrEmpty(hdriPath)) DeleteFileIfExist(existingProduct.HDRI);
                if (string.IsNullOrEmpty(backgroundPath)) DeleteFileIfExist(existingProduct.Background);

                existingProduct.HDRI = string.IsNullOrEmpty(hdriPath) ? "/resources/DefaultHDMI.jpg" : hdriPath;
                existingProduct.Background = string.IsNullOrEmpty(backgroundPath) ? "/resources/DModelBackground.jpg": backgroundPath;
                existingProduct.Thumbnail = string.IsNullOrEmpty(thumbnailPath) ? existingProduct.Thumbnail : thumbnailPath;
                existingProduct.isPublished = isPublished;
            }
            else {
                ProductData product = new ProductData {
                    SellerId = user.Id,
                    Seller = user,
                    Name = ProductName,
                    Price = (decimal)productPrice,
                    Stock = Stock,
                    Description = Description,

                    // Texture Paths
                    _3dModel = _3dModelPath,
                    Thumbnail = thumbnailPath,
                    HDRI = string.IsNullOrEmpty(hdriPath) ? "/resources/DefaultHDMI.jpg" : hdriPath,
                    Background = string.IsNullOrEmpty(backgroundPath) ? "/resources/DModelBackground.jpg" : backgroundPath,

                    isPublished = isPublished,
                    CameraDefaultZPos = CameraDefaultZPos,
                    ViewDefaultRotation = ViewDefaultRotation,
                    HDRI_Brightness = HDRI_Brightness,
                };
                user.products.Add(product);
            }

            await _context.SaveChangesAsync();
            return Json(ProductName);
        }

        // this should be run after i create the product
        [HttpPost]
        public async Task<IActionResult> SaveMaterial(string productName, string materialName, IFormFile? BaseColor,
                                                      IFormFile? Roughness, IFormFile? Emission,IFormFile? Metallic,
                                                      IFormFile? NormalMap, IFormFile? AmbientOcclusion, IFormFile? Alpha,
                                                      float emissionBrightness,string emissionColor,float alphaTest,float ior,
                                                      float thickness,float normalMapStrength, bool useDoubleSide,bool makeMaterialTransmission) {

            UserData user = GetUserViaCookies();
            ProductData product = _context.products.Include(p => p.Materials).FirstOrDefault(p => p.Name == productName);
            if (product == null || user == null)
                return BadRequest();

            string safeFolderName = Path.Join("3d-assets", GetSafeStringForPath(user.UserName), GetSafeStringForPath(product.Name),GetSafeStringForPath(materialName));
            string? baseColorPath = BaseColor != null ? await SaveFile(safeFolderName, "baseColor", BaseColor) : null;
            string? roughnessPath = Roughness != null ? await SaveFile(safeFolderName, "roughness", Roughness) : null;
            string? emissionPath = Emission != null ? await SaveFile(safeFolderName, "emission", Emission) : null;
            string? metallicPath = Metallic != null ? await SaveFile(safeFolderName, "metallic", Metallic) : null;
            string? normalPath = NormalMap != null ? await SaveFile(safeFolderName, "normal", NormalMap) : null;
            string? aoPath = AmbientOcclusion != null ? await SaveFile(safeFolderName, "ao", AmbientOcclusion) : null;
            string? alphaPath = Alpha != null ? await SaveFile(safeFolderName, "Alpha", Alpha) : null;

            MaterialData material = new MaterialData();

            material.Name = materialName;

            material.BaseColor = baseColorPath;
            material.Roughness = roughnessPath;
            material.Emission = emissionPath;
            material.Metallic = metallicPath;
            material.NormalMap = normalPath;
            material.AmbientOcclusion = aoPath;
            material.Alpha = alphaPath;

            material.Emission_Brightness = emissionBrightness;
            material.Emission_Color = emissionColor;
            material.alphaTest = alphaTest;
            material.IOR = ior;
            material.Thickness = thickness;
            material.NormalMap_Strength = normalMapStrength;
            material.UseDoubleSide = useDoubleSide;
            material.makeMaterialTransmission = makeMaterialTransmission;


            MaterialData existingMaterial = product.Materials.FirstOrDefault(x => x.Name == materialName);
            if (existingMaterial == null) {
                product.Materials.Add(material);
            }
            else {
                // if the user remove an previously assigned text and the texture still exist then delete it
                if (string.IsNullOrEmpty(baseColorPath)) DeleteFileIfExist(existingMaterial.BaseColor);
                if (string.IsNullOrEmpty(roughnessPath)) DeleteFileIfExist(existingMaterial.Roughness);
                if (string.IsNullOrEmpty(emissionPath)) DeleteFileIfExist(existingMaterial.Emission);
                if (string.IsNullOrEmpty(metallicPath)) DeleteFileIfExist(existingMaterial.Metallic);
                if (string.IsNullOrEmpty(normalPath)) DeleteFileIfExist(existingMaterial.NormalMap);
                if (string.IsNullOrEmpty(aoPath)) DeleteFileIfExist(existingMaterial.AmbientOcclusion);
                if (string.IsNullOrEmpty(alphaPath)) DeleteFileIfExist(existingMaterial.Alpha);

                existingMaterial.UpdateForm(material);
            }
            await _context.SaveChangesAsync();
            return Ok();
        }
        private string GetSafeStringForPath(string value) {
            return string.Concat(value.Split(Path.GetInvalidFileNameChars()));
        }

        // path is a web Path something like: /resources/folder_name/file_name
        private void DeleteFileIfExist(string? path) {
            if(string.IsNullOrEmpty(path)) return;

            string relativePath = path.Replace('/', Path.DirectorySeparatorChar);
            string physicalPath = Path.Combine(_webHostEnvironment.WebRootPath, relativePath);

            if (!System.IO.File.Exists(physicalPath)) return;

            System.IO.File.Delete(physicalPath);
        }
        private async Task<string> SaveFile(string folderName,string fileName,IFormFile file) {
            string fileExtension = Path.GetExtension(file.FileName);

            string dir = Path.Join(_webHostEnvironment.WebRootPath, "resources", folderName);
            if (!Directory.Exists(dir)) { 
                Directory.CreateDirectory(dir);
            }

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
                return  _context.Users.Include( u => u.products ).FirstOrDefault(u => u.UserName == username);
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
