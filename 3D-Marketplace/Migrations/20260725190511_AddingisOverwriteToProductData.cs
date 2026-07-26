using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class AddingisOverwriteToProductData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "isOverwrite",
                table: "products",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "isOverwrite",
                table: "products");
        }
    }
}
