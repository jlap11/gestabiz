using System;

namespace CommonApi.Entities
{
    public class Region
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; }
        public Guid PaisId { get; set; }
    }
}