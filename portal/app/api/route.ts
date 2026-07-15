export async function GET() {
  return Response.json({
    name: "Lumbre API",
    version: "1.0.0",
    endpoints: [
      "GET /api/health",
      "GET /api/recipes?category=directo&q=entraña",
      "GET /api/products",
      "POST /api/products",
      "GET /api/events",
      "GET /api/ingredientes?q=chile&familia=Picante&estado=pendiente",
      "GET /api/ingredientes?id=chile_ancho",
      "GET /api/hipotesis",
      "GET /api/hipotesis/LHC-003",
      "POST /api/hipotesis",
      "POST /api/members",
      "POST /api/test/reset",
    ],
  });
}
