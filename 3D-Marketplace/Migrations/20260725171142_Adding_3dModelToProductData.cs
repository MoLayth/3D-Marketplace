using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class Adding_3dModelToProductData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "_3dModel",
                table: "products",
                type: "varchar(500)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "_3dModel",
                table: "products");
        }
    }
}
