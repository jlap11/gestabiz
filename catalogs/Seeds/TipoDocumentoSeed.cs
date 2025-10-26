using Microsoft.EntityFrameworkCore;
using CommonApi.Entities;
using System;

namespace CommonApi.Seeds
{
    public static class TipoDocumentoSeed
    {
        public static void Seed(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TipoDocumento>().HasData(
                new TipoDocumento { Id = Guid.Parse("f0a12f4c-e91e-40a5-a1f4-7f01a3a27101"), Nombre = "Cédula de Ciudadanía", Abreviatura = "CC", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("f2b38e65-6313-4682-a27b-83c7b89ff8d2"), Nombre = "Tarjeta de Identidad", Abreviatura = "TI", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("94e9c676-2e8f-4968-9c9a-0ff9f0ffba25"), Nombre = "Cédula de Extranjería", Abreviatura = "CE", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("5f7d0e8d-c2de-40d3-a1db-e3a5076d826e"), Nombre = "Pasaporte", Abreviatura = "PA", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("3bb70e61-e370-48f0-b9b8-5c6d5104c6f5"), Nombre = "Registro Civil", Abreviatura = "RC", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("ac7a2f58-14c3-4b0b-a579-378edc6c5291"), Nombre = "Número de Identificación Tributaria", Abreviatura = "NIT", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("79947df7-5e67-4d49-b776-02aaee1971e6"), Nombre = "Permiso Especial de Permanencia", Abreviatura = "PEP", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("db5f8657-d4b5-4e7c-9267-f2d32bc8bb3e"), Nombre = "Documento Nacional de Identidad", Abreviatura = "DNI", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("4f9dd50a-9d98-4b27-bcb9-994e4dc6b221"), Nombre = "Salvoconducto", Abreviatura = "SC", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") },
                new TipoDocumento { Id = Guid.Parse("8b4e0c73-61d7-48cf-b6f0-d3ad1666f261"), Nombre = "Carné Diplomático", Abreviatura = "CD", PaisId = Guid.Parse("01b4e9d1-a84e-41c9-8768-253209225a21") }
            );

        }
    }
}