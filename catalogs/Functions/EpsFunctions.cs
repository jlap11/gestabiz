using System;
using System.Linq;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using CommonApi;
using CommonApi.Entities;

namespace CommonApi.Functions
{
    public class EpsFunctions
    {
        private readonly ApplicationDbContext _context;

        public EpsFunctions(ApplicationDbContext context)
        {
            _context = context;
        }

        [Function("GetAllEps")]
        public HttpResponseData GetAllEps([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "eps")] HttpRequestData req)
        {
            var eps = _context.Eps.ToList();

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.WriteAsJsonAsync(eps);
            return response;
        }

        [Function("GetEpsById")]
        public HttpResponseData GetEpsById([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "eps/{id}")] HttpRequestData req, Guid id)
        {
            var eps = _context.Eps.FirstOrDefault(e => e.Id == id);
            var response = req.CreateResponse(eps != null ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound);

            if (eps != null)
            {
                response.WriteAsJsonAsync(eps);
            }

            return response;
        }
    }
}