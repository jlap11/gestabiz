using System;

namespace CommonApi.Entities
{
    public class Pais
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
        public string PrefijoTelefonico { get; set; } = string.Empty;
    }
}