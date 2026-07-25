using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace _3D_Marketplace.Models {
    public class ProductData {
        public int Id { get; set; }

        [Column(TypeName = "varchar(100)")]
        public string ViewDefaultRotation { get; set; }

        public float CameraDefaultZPos { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? BaseColor { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Roughness { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Metallic { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? NormalMap { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Emission { get; set; }
        public float Emission_Brightness { get; set; }

        [Column(TypeName = "char(7)")]
        public string Emission_Color { get; set; } = "#000000"; // default to black

        [Column(TypeName = "varchar(500)")]
        public string? AmbientOcclusion { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? HDRI { get; set; }
        public bool HDRI_ShowAsBackground {  get; set; }
        public float HDRI_Brightness{ get; set; }

        [Required]
        [Column(TypeName = "varchar(300)")]
        public string Name { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int Stock { get; set; }

        [Column(TypeName = "varchar(3500)")]
        public string? Description { get; set; }

        public int SellerId { get; set; }

        [Required]
        public UserData Seller { get; set; }

        public bool isPublished  { get; set; }
    }
}
