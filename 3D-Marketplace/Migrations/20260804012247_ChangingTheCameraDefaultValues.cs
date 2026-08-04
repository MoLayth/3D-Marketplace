using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class ChangingTheCameraDefaultValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CameraDefaultZPos",
                table: "products");

            migrationBuilder.RenameColumn(
                name: "ViewDefaultRotation",
                table: "products",
                newName: "controlsDefaultTarget");

            migrationBuilder.AddColumn<string>(
                name: "cameraDefaultPos",
                table: "products",
                type: "varchar(100)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cameraDefaultPos",
                table: "products");

            migrationBuilder.RenameColumn(
                name: "controlsDefaultTarget",
                table: "products",
                newName: "ViewDefaultRotation");

            migrationBuilder.AddColumn<float>(
                name: "CameraDefaultZPos",
                table: "products",
                type: "real",
                nullable: false,
                defaultValue: 0f);
        }
    }
}
