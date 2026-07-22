using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace _3D_Marketplace.Models {
    [Index(nameof(UserName), IsUnique = true)] // make the user name unique across the database
    public class UserData {
        public int Id { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string Name { get; set; }

        [Column(TypeName = "varchar(2000)")]
        public string? Bio { get; set; }

        [Required]
        [Column(TypeName = "varchar(100)")]
        public string UserName { get; set; }

        [Required]
        [Column(TypeName = "varchar(255)")]
        public string Password { get; set; }

        public List<ProductData> products { get; set; } = new();


        [Column(TypeName = "varchar(500)")]
        public string? ProfilePicture { get; set; }
    }
}
