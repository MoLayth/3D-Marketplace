using Microsoft.EntityFrameworkCore;
namespace _3D_Marketplace.Models {
    public class ApplicationDbContext:DbContext {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) {
        }
        public DbSet<UserData> Users { get; set; }
        public DbSet<ProductData> products { get; set; }
        public DbSet<MaterialData> materials {  get; set; }
    }
}
