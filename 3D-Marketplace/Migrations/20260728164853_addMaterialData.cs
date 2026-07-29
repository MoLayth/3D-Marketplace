using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class addMaterialData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmbientOcclusion",
                table: "products");

            migrationBuilder.DropColumn(
                name: "BaseColor",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Emission",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Emission_Brightness",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Emission_Color",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Metallic",
                table: "products");

            migrationBuilder.DropColumn(
                name: "NormalMap",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Roughness",
                table: "products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AmbientOcclusion",
                table: "products",
                type: "varchar(500)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BaseColor",
                table: "products",
                type: "varchar(500)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Emission",
                table: "products",
                type: "varchar(500)",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "Emission_Brightness",
                table: "products",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<string>(
                name: "Emission_Color",
                table: "products",
                type: "char(7)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Metallic",
                table: "products",
                type: "varchar(500)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NormalMap",
                table: "products",
                type: "varchar(500)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Roughness",
                table: "products",
                type: "varchar(500)",
                nullable: true);
        }
    }
}
