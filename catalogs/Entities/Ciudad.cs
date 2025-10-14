using System;

namespace CommonApi.Entities
{
    public class Ciudad
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; }
        public Guid RegionId { get; set; }
    }
}