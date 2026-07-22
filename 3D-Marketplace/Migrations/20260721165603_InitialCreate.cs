using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "varchar(50)", nullable: false),
                    Bio = table.Column<string>(type: "varchar(2000)", nullable: true),
                    UserName = table.Column<string>(type: "varchar(100)", nullable: false),
                    Password = table.Column<string>(type: "varchar(255)", nullable: false),
                    ProfilePicture = table.Column<string>(type: "varchar(500)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ViewDefaultRotation = table.Column<string>(type: "varchar(100)", nullable: false),
                    CameraDefaultZPos = table.Column<float>(type: "real", nullable: false),
                    BaseColor = table.Column<string>(type: "varchar(500)", nullable: true),
                    Roughness = table.Column<string>(type: "varchar(500)", nullable: true),
                    Metallic = table.Column<string>(type: "varchar(500)", nullable: true),
                    NormalMap = table.Column<string>(type: "varchar(500)", nullable: true),
                    Emission = table.Column<string>(type: "varchar(500)", nullable: true),
                    Emission_Brightness = table.Column<float>(type: "real", nullable: false),
                    Emission_Color = table.Column<string>(type: "char(7)", nullable: false),
                    AmbientOcclusion = table.Column<string>(type: "varchar(500)", nullable: true),
                    HDRI = table.Column<string>(type: "varchar(500)", nullable: true),
                    HDRI_ShowAsBackground = table.Column<bool>(type: "bit", nullable: false),
                    HDRI_Brightness = table.Column<float>(type: "real", nullable: false),
                    Name = table.Column<string>(type: "varchar(300)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Stock = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "varchar(3500)", nullable: true),
                    SellerId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_products_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_products_SellerId",
                table: "products",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_UserName",
                table: "Users",
                column: "UserName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
