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
      "POST /api/members",
      "POST /api/test/reset",
    ],
  });
}
