using Microsoft.EntityFrameworkCore;
using CommonApi.Entities;
using System;

namespace CommonApi.Seeds
{
    public static class EpsSeed
    {
        public static void Seed(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Eps>().HasData(
                new Eps { Id = Guid.Parse("7B14BAB2-B62B-4FD7-A94D-1E21CA7A2B0F"), Nombre = "Aliansalud EPS" },
                new Eps { Id = Guid.Parse("8F4BD47E-07AC-4D18-B58C-93DB8F9BB163"), Nombre = "Coosalud EPS‑S" },
                new Eps { Id = Guid.Parse("4C8E70B6-EE3B-437D-89BC-21F55D155C27"), Nombre = "Nueva EPS" },
                new Eps { Id = Guid.Parse("AB3BC976-FB43-451F-BA69-2A507AC2FDFF"), Nombre = "Mutual Ser EPS" },
                new Eps { Id = Guid.Parse("2B7BF4CF-6F16-44CF-9460-90C5C5962871"), Nombre = "Salud Mía EPS" },
                new Eps { Id = Guid.Parse("8952A46D-512B-44EC-9F96-60E217D10A78"), Nombre = "Salud Total EPS S.A." },
                new Eps { Id = Guid.Parse("A9E095B6-64DA-463A-8DFD-2AD10D2E85D9"), Nombre = "EPS Sanitas" },
                new Eps { Id = Guid.Parse("61BF11F2-B288-47D5-BE92-A94546157E5A"), Nombre = "EPS Sura" },
                new Eps { Id = Guid.Parse("F12784A3-54C6-4EEA-9748-2B6B69B47C29"), Nombre = "Famisanar" },
                new Eps { Id = Guid.Parse("409B003A-5259-43BA-8C62-B0531D0C5899"), Nombre = "Servicio Occidental de Salud EPS – SOS" },
                new Eps { Id = Guid.Parse("2EA120BB-C389-45CA-84C3-80F62E86CFC1"), Nombre = "Comfenalco Valle" },
                new Eps { Id = Guid.Parse("31A69236-BFA5-4FDC-B6F3-49B6C4269149"), Nombre = "Compensar EPS" },
                new Eps { Id = Guid.Parse("060A90ED-2344-41BF-AF9A-CAE7A89C9D6A"), Nombre = "EPM – Empresas Públicas de Medellín" },
                new Eps { Id = Guid.Parse("159FC4E1-DDC9-4485-B46C-328383027035"), Nombre = "Fondo de Pasivo Social de Ferrocarriles Nacionales de Colombia" },
                new Eps { Id = Guid.Parse("C8EBC328-0D7D-4092-A879-5F4515B685CB"), Nombre = "Capresoca" },
                new Eps { Id = Guid.Parse("AD4A1D53-9189-4919-A909-8CA5EF20856A"), Nombre = "Comfachocó" },
                new Eps { Id = Guid.Parse("D25F45F8-F741-4BBA-A1B1-915585114F7F"), Nombre = "Comfaoriente" },
                new Eps { Id = Guid.Parse("A4D7ED3D-C095-4E83-BC43-3E5059458BB2"), Nombre = "EPS Familiar de Colombia" },
                new Eps { Id = Guid.Parse("F79604CC-9E7A-4037-BD53-20EC4BD0A81E"), Nombre = "Asmet Salud" },
                new Eps { Id = Guid.Parse("60B09CCE-A0C1-470F-9EF8-EA6FBD605372"), Nombre = "Emssanar E.S.S." },
                new Eps { Id = Guid.Parse("352CFA32-DE41-4900-BDB2-2927C9417187"), Nombre = "Capital Salud EPS‑S" },
                new Eps { Id = Guid.Parse("4B625DBC-636B-4B43-B7BC-1887DE79E32A"), Nombre = "Savia Salud EPS" },
                new Eps { Id = Guid.Parse("EEE8CBFD-19ED-4175-956D-129BA75D3C6B"), Nombre = "Dusakawi EPSI" },
                new Eps { Id = Guid.Parse("16FD9481-33D4-4BF0-8A38-F58C012927D6"), Nombre = "Asociación Indígena del Cauca EPSI" },
                new Eps { Id = Guid.Parse("B2F454D6-2348-4F1D-AE87-404C4C9D2F25"), Nombre = "Anas Wayuu EPSI" },
                new Eps { Id = Guid.Parse("1966FA0A-D883-4B3C-A5E2-863F11B42119"), Nombre = "Mallamas EPSI" },
                new Eps { Id = Guid.Parse("7699D9EF-D8BA-4E3D-A687-398A13791FAA"), Nombre = "Pijaos Salud EPSI" },
                new Eps { Id = Guid.Parse("5A1B2C3D-4E5F-6789-ABCD-1234567890EF"), Nombre = "Cajacopi Atlántico" }
            );
        }
    }
}

