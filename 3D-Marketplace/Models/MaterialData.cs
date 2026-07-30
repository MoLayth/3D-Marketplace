using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace _3D_Marketplace.Models {
    public class MaterialData {
        public int Id { get; set; }
        [Required]
        [Column(TypeName = "varchar(300)")]
        public string Name { get; set; }

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
        public float Thickness { get; set; }

        public ProductData Product { get; set; }
        public int ProductId { get; set; }

        /// <summary>
        /// Updates material properties in-place without altering entity identities (Id, ProductId, Product navigation).
        /// </summary>
        public void UpdateForm(MaterialData source) {
            if (source == null) return;

            // Basic Properties
            Name = source.Name;

            // Texture Map File Paths
            BaseColor = source.BaseColor;
            Roughness = source.Roughness;
            Metallic = source.Metallic;
            NormalMap = source.NormalMap;
            Emission = source.Emission;
            AmbientOcclusion = source.AmbientOcclusion;
            Alpha = source.Alpha;

            // Material Numerical & Color Properties
            NormalMap_Strength = source.NormalMap_Strength;
            Emission_Brightness = source.Emission_Brightness;
            Emission_Color = source.Emission_Color;
            alphaTest = source.alphaTest;

            // Flags & Transmission
            UseDoubleSide = source.UseDoubleSide;
            makeMaterialTransmission = source.makeMaterialTransmission;
            IOR = source.IOR;
            Thickness = source.Thickness;
        }
    }
}
