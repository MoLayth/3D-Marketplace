using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3D_Marketplace.Migrations
{
    /// <inheritdoc />
    public partial class addNameProbertyToMaterialData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "materials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "varchar(300)", nullable: false),
                    BaseColor = table.Column<string>(type: "varchar(500)", nullable: true),
                    Roughness = table.Column<string>(type: "varchar(500)", nullable: true),
                    Metallic = table.Column<string>(type: "varchar(500)", nullable: true),
                    NormalMap = table.Column<string>(type: "varchar(500)", nullable: true),
                    NormalMap_Strength = table.Column<float>(type: "real", nullable: false),
                    Emission = table.Column<string>(type: "varchar(500)", nullable: true),
                    Emission_Brightness = table.Column<float>(type: "real", nullable: false),
                    Emission_Color = table.Column<string>(type: "char(7)", nullable: false),
                    AmbientOcclusion = table.Column<string>(type: "varchar(500)", nullable: true),
                    Alpha = table.Column<string>(type: "varchar(500)", nullable: true),
                    alphaTest = table.Column<float>(type: "real", nullable: false),
                    UseDoubleSide = table.Column<bool>(type: "bit", nullable: false),
                    makeMaterialTransmission = table.Column<bool>(type: "bit", nullable: false),
                    IOR = table.Column<float>(type: "real", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_materials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_materials_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_materials_ProductId",
                table: "materials",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "materials");
        }
    }
}
