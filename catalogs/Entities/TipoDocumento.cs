using System;

namespace CommonApi.Entities
{
    public class TipoDocumento
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Abreviatura { get; set; } = string.Empty;
        public Guid PaisId { get; set; }
    }
}