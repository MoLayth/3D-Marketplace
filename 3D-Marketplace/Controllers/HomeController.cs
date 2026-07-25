using _3D_Marketplace.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Diagnostics;
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
            UserData user = null;
            if (HttpContext.Request.Cookies.ContainsKey("RememberMeUser")) {
                user = _context.Users.FirstOrDefault();
                ViewData["Name"] = user.Name;
                ViewData["ProfilePic"] = user.ProfilePicture;
            }

            return View(user);
        }

        public IActionResult LoadTab_EditProfile() {
            string username = Request.Cookies["RememberMeUser"];
            return PartialView("EditProfile", model: _context.Users.FirstOrDefault(u => u.UserName == username));
        }
        public IActionResult LoadTab_UploadMode() {
            return PartialView("UploadModelPanel");
        }

        [HttpGet]
        public IActionResult GetUserData(string Username) {
            UserData selectedUser = _context.Users.FirstOrDefault(u => u.UserName == Username); 

            return Json(new { name = selectedUser.Name, bio = selectedUser.Bio , profileImageUrl = selectedUser.ProfilePicture });
        }

        public async Task<IActionResult> SaveModel(IFormFile? BaseColor, IFormFile? Roughness, IFormFile? Emission,IFormFile? Metallic,
                                       IFormFile? NormalMap, IFormFile? AmbientOcclusion, IFormFile? HDRI,
                                       float Emission_Brightness, string Emission_Color, bool HDRI_ShowAsBackground,
                                       float HDRI_Brightness,string ProductName,float productPrice,int Stock, string Description) {

            string? baseColorPath = null;
            if (BaseColor != null)
                baseColorPath = await SaveImage(ProductName, "baseColor", BaseColor);


            //string? RoughnessPath = null;
            //if (Roughness != null) {
            //    RoughnessPath = await SaveImage(ProductName, "Roughness", baseColor);


            //string username = Request.Cookies["RememberMeUser"];
            //UserData user = _context.Users.FirstOrDefault(u=> u.UserName == username);
            //if (user == null) {
            //    return BadRequest();
            //}

            //user.products.Add(new() {

            //});
            return Ok();
        }

        private async Task<string> SaveImage(string folderName,string fileName,IFormFile pic) {
            string fileType = pic.ContentType.ToLower().Contains("png") ? ".png" : ".jpg";

            string dir = Path.Join(_webHostEnvironment.WebRootPath, "/resources/", folderName);
            if (!Directory.Exists(dir)) { 
                Directory.CreateDirectory(dir);
            }

            string savePath = Path.Join(_webHostEnvironment.WebRootPath, "/resources/", folderName, fileName + fileType);
            
            using (var stream = new FileStream(savePath, FileMode.Create)) {
                await pic.CopyToAsync(stream);
            }

            return "/resources/" + folderName + fileName + fileType;
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
        public IActionResult IsUserNameExist(string userName) { 
            bool exists = _context.Users.Any(u => u.UserName == userName);
            return Json(exists);
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
