using System.ComponentModel.DataAnnotations.Schema;

namespace _3D_Marketplace.Models {
    public class MaterialData {
        [Column(TypeName = "varchar(500)")]
        public string? BaseColor { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Roughness { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Metallic { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? NormalMap { get; set; }

        public float NormalMap_Strength { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Emission { get; set; }
        public float Emission_Brightness { get; set; }

        [Column(TypeName = "char(7)")]
        public string Emission_Color { get; set; } = "#000000"; // default to black

        [Column(TypeName = "varchar(500)")]
        public string? AmbientOcclusion { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? Alpha { get; set; }

        public float alphaTest { get; set; } = .5f;
        public bool UseDoubleSide { get; set; }

        public bool makeMaterialTransmission { get; set; }
        public float IOR { get; set; } = 1.5f;
    }
}
