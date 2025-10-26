using Microsoft.EntityFrameworkCore;
using CommonApi.Entities;
using System;

namespace CommonApi.Seeds
{
    public static class RegionSeed
    {
        public static void Seed(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Region>().HasData(
    new Region { Id = Guid.Parse("a1c3f2d4-88f9-4ad9-9155-1e889b9c2b01"), Nombre = "Amazonas", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("b2e7a12c-6ac9-4f9e-963e-9b6d3825f962"), Nombre = "Antioquia", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("c6bfb1d0-cbde-4a7f-8ad1-62f7645d38a3"), Nombre = "Arauca", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("a0c8c530-05ce-4b31-a167-378bb8c44754"), Nombre = "Atlántico", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("dc6cc70b-dfd1-4ec9-b34d-3d0df51c3c83"), Nombre = "Bolívar", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("fc6cc79b-dfd1-42c9-b35d-3d0df51c1c83"), Nombre = "Bogotá D.C.", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("76a47836-06a2-4e9a-bd1f-68d0e59d6f67"), Nombre = "Boyacá", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("fd1149ea-6a2d-44b7-9ec4-0cd342a2ed17"), Nombre = "Caldas", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("ae6e8c56-4d8a-4d97-8840-8036a30828d2"), Nombre = "Caquetá", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("b32b60a3-fd1d-4a56-9ce6-91cf994ef080"), Nombre = "Casanare", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("fe4db8a1-3cf2-43e3-981c-bbcde0b3e6db"), Nombre = "Cauca", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("d9b9ea69-355b-4c95-a0a5-9bcb1f7e5b70"), Nombre = "Cesar", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("4ae71910-0a47-4421-a12d-02b82b6bbcb7"), Nombre = "Chocó", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("cd65a502-2c6f-4298-8e5e-7bb0fc12f350"), Nombre = "Córdoba", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("f4ac9a6e-0bd5-48b0-bbee-0343d7424694"), Nombre = "Cundinamarca", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("4cfa9a62-69fd-4ae2-9c52-22819be6edb4"), Nombre = "Guainía", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("0d124589-3f7b-46bc-b31c-d7e51aef4c4b"), Nombre = "Guaviare", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("93ac9a53-e0fc-4ff0-a15e-4455e2797cb3"), Nombre = "Huila", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("5e49d1a1-5f4b-4ea6-8476-994d32d042ef"), Nombre = "La Guajira", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("e3c9a2fb-c9ad-4176-b8dc-214008ea9821"), Nombre = "Magdalena", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("65ce7390-b287-43b7-bf0a-408d6fdc1e43"), Nombre = "Meta", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("9d54652e-9964-48d5-a4e5-933c21f064cc"), Nombre = "Nariño", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("b13cdb17-7e7f-49c2-b25e-bf8c4d529ad4"), Nombre = "Norte de Santander", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("2e6e2044-d35e-4d6c-8d7b-00f6b1bb760a"), Nombre = "Putumayo", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("6a8b6502-8f7f-4d41-b48a-b858bfb4b8e4"), Nombre = "Quindío", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("94f4cfcd-98c6-4f76-b151-139aa420f6d5"), Nombre = "Risaralda", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("2f5b57dc-3026-48a5-bd47-8fa5d5a5c6f1"), Nombre = "San Andrés y Providencia", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("f00f77a9-4042-49b3-8759-01c4bcba8e03"), Nombre = "Santander", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("4ff29fa6-6c34-4a9f-92a4-073b6a8dfb8f"), Nombre = "Sucre", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("872b38a4-d4a5-4bd1-b650-24b137ff7b26"), Nombre = "Tolima", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("01172b87-e3f6-4f60-8f0b-313aab662c6a"), Nombre = "Valle del Cauca", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("df905248-bd83-474b-9b58-33e9f478b6cb"), Nombre = "Vaupés", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
    new Region { Id = Guid.Parse("ae32c0db-ecfc-4975-a063-f2e13767451b"), Nombre = "Vichada", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") }
);

        }
    }
}