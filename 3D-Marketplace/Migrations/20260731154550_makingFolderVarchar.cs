using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class makingFolderVarchar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Folder",
                table: "products",
                type: "varchar(36)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Folder",
                table: "products",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(36)");
        }
    }
}
