using Microsoft.EntityFrameworkCore;
using CommonApi.Entities;
using System;

namespace CommonApi.Seeds
{
    public static class GeneroSeed
    {
        public static void Seed(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Genero>().HasData(
                new Genero { Id = Guid.Parse("32F82E7C-7E39-4906-9C41-5D28B3FAB3F1"), Nombre = "Masculino" },
                new Genero { Id = Guid.Parse("B3719F67-3E64-4F4A-A609-7B334521372B"), Nombre = "Femenino" },
                new Genero { Id = Guid.Parse("DBD1A6CB-2B6C-4840-B56B-83DC7AE61581"), Nombre = "Otro" }
            );
        }
    }
}