import { getLumbreEnvironment } from "../lib/environment";

export async function GET() {
  const environment = getLumbreEnvironment();
  const readEndpoints = [
    "GET /openapi/lumbre.openapi.json",
    "GET /api/health",
    "GET /api/recipes?category=directo&q=entraña",
    "GET /api/products",
    "GET /api/events",
    "GET /api/ingredientes?q=chile&familia=Picante&estado=pendiente",
    "GET /api/ingredientes?id=chile_ancho",
    "GET /api/hipotesis",
    "GET /api/hipotesis/LHC-003",
  ];
  const testAndDevelopmentEndpoints = [
    "POST /api/products",
    "POST /api/hipotesis",
    "POST /api/members",
    ...(environment === "test" ? ["POST /api/test/reset"] : []),
  ];

  return Response.json({
    name: "Lumbre API",
    version: "1.0.0",
    environment,
    access: environment === "production" ? "read-only" : "read-write",
    endpoints: [
      ...readEndpoints,
      ...(environment === "production" ? [] : testAndDevelopmentEndpoints),
    ],
  });
}
