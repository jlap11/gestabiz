using System;
using System.Linq;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using CommonApi;
using CommonApi.Entities;

namespace CommonApi.Functions
{
    public class RegionFunctions
    {
        private readonly ApplicationDbContext _context;

        public RegionFunctions(ApplicationDbContext context)
        {
            _context = context;
        }

        [Function("GetAllRegiones")]
        public HttpResponseData GetAllRegiones([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "regiones")] HttpRequestData req)
        {
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var paisId = Guid.Parse(query["paisId"]);

            var regiones = _context.Regiones
                .Where(r => r.PaisId == paisId)
                .ToList();

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.WriteAsJsonAsync(regiones);
            return response;
        }

        [Function("GetRegionById")]
        public HttpResponseData GetRegionById([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "regiones/{id}")] HttpRequestData req, Guid id)
        {
            var region = _context.Regiones.FirstOrDefault(r => r.Id == id);
            var response = req.CreateResponse(region != null ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound);

            if (region != null)
            {
                response.WriteAsJsonAsync(region);
            }

            return response;
        }
    }
}