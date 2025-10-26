using System;
using System.Linq;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using CommonApi;
using CommonApi.Entities;

namespace CommonApi.Functions
{
    public class TipoDocumentoFunctions
    {
        private readonly ApplicationDbContext _context;

        public TipoDocumentoFunctions(ApplicationDbContext context)
        {
            _context = context;
        }

        [Function("GetAllTiposDocumento")]
        public HttpResponseData GetAllTiposDocumento([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "tiposdocumento")] HttpRequestData req)
        {
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            var paisId = Guid.Parse(query["paisId"]);

            var tiposDocumento = _context.TiposDocumento
                .Where(td => td.PaisId == paisId)
                .ToList();

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.WriteAsJsonAsync(tiposDocumento);
            return response;
        }

        [Function("GetTipoDocumentoById")]
        public HttpResponseData GetTipoDocumentoById([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "tiposdocumento/{id}")] HttpRequestData req, Guid id)
        {
            var tipoDocumento = _context.TiposDocumento.FirstOrDefault(td => td.Id == id);
            var response = req.CreateResponse(tipoDocumento != null ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound);

            if (tipoDocumento != null)
            {
                response.WriteAsJsonAsync(tipoDocumento);
            }

            return response;
        }
    }
}