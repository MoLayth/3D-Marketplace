using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace _3D_Marketplace.Models {
    public class ProductData {
        public int Id { get; set; }

        [Column(TypeName = "varchar(36)")]
        public string Folder { get; private set; } = Guid.NewGuid().ToString("N");


        [Column(TypeName = "varchar(100)")]
        public string ViewDefaultRotation { get; set; }

        public float CameraDefaultZPos { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string Thumbnail { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string _3dModel { get; set; }

        public List<MaterialData> Materials { get; set; } = new();


        [Column(TypeName = "varchar(500)")]
        public string Background { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string HDRI { get; set; }
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
