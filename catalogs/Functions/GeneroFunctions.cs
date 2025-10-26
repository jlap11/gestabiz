using System;
using System.Linq;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using CommonApi;
using CommonApi.Entities;

namespace CommonApi.Functions
{
    public class GeneroFunctions
    {
        private readonly ApplicationDbContext _context;

        public GeneroFunctions(ApplicationDbContext context)
        {
            _context = context;
        }

        [Function("GetAllGeneros")]
        public HttpResponseData GetAllGeneros([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "generos")] HttpRequestData req)
        {
            var generos = _context.Generos.ToList();

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.WriteAsJsonAsync(generos);
            return response;
        }

        [Function("GetGeneroById")]
        public HttpResponseData GetGeneroById([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "generos/{id}")] HttpRequestData req, Guid id)
        {
            var genero = _context.Generos.FirstOrDefault(g => g.Id == id);
            var response = req.CreateResponse(genero != null ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound);

            if (genero != null)
            {
                response.WriteAsJsonAsync(genero);
            }

            return response;
        }
    }
}