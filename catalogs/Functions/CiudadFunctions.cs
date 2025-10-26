using System;
using System.Linq;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using CommonApi;
using CommonApi.Entities;

namespace CommonApi.Functions
{
    public class CiudadFunctions
    {
        private readonly ApplicationDbContext _context;

        public CiudadFunctions(ApplicationDbContext context)
        {
            _context = context;
        }

        [Function("GetAllCiudades")]
        public HttpResponseData GetAllCiudades([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "ciudades")] HttpRequestData req)
        {
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var regionId = Guid.Parse(query["regionId"]);

            var ciudades = _context.Ciudades
                .Where(c => c.RegionId == regionId)
                .ToList();

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.WriteAsJsonAsync(ciudades);
            return response;
        }

        [Function("GetCiudadById")]
        public HttpResponseData GetCiudadById([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "ciudades/{id}")] HttpRequestData req, Guid id)
        {
            var ciudad = _context.Ciudades.FirstOrDefault(c => c.Id == id);
            var response = req.CreateResponse(ciudad != null ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound);

            if (ciudad != null)
            {
                response.WriteAsJsonAsync(ciudad);
            }

            return response;
        }
    }
}