using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class AddingBackgroundAndRemovingHDMIAsBackground : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HDRI_ShowAsBackground",
                table: "products");

            migrationBuilder.AlterColumn<string>(
                name: "HDRI",
                table: "products",
                type: "varchar(500)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Background",
                table: "products",
                type: "varchar(500)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Background",
                table: "products");

            migrationBuilder.AlterColumn<string>(
                name: "HDRI",
                table: "products",
                type: "varchar(500)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(500)");

            migrationBuilder.AddColumn<bool>(
                name: "HDRI_ShowAsBackground",
                table: "products",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
