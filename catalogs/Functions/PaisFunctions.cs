using System;
using System.Linq;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using CommonApi;
using CommonApi.Entities;

namespace CommonApi.Functions
{
    public class PaisFunctions
    {
        private readonly ApplicationDbContext _context;

        public PaisFunctions(ApplicationDbContext context)
        {
            _context = context;
        }

        [Function("GetAllPaises")]
        public HttpResponseData GetAllPaises([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "paises")] HttpRequestData req)
        {
            var paises = _context.Paises.ToList();

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.WriteAsJsonAsync(paises);
            return response;
        }

        [Function("GetPaisById")]
        public HttpResponseData GetPaisById([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "paises/{id}")] HttpRequestData req, Guid id)
        {
            var pais = _context.Paises.FirstOrDefault(p => p.Id == id);
            var response = req.CreateResponse(pais != null ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound);

            if (pais != null)
            {
                response.WriteAsJsonAsync(pais);
            }

            return response;
        }
    }
}