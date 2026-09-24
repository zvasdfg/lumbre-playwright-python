import { getLumbreEnvironment } from "../lib/environment";

export async function GET() {
  const environment = getLumbreEnvironment();
  const publicEndpoints = [
    "GET /openapi/lumbre.openapi.json",
    "GET /api/health",
    "GET /api/recipes?category=directo&q=entraña",
    "GET /api/products",
    "GET /api/cart",
    "POST /api/cart/items",
    "PATCH /api/cart/items/{productId}",
    "DELETE /api/cart/items/{productId}",
    "GET /api/events",
    "GET /api/ingredientes?q=chile&familia=Picante&estado=pendiente",
    "GET /api/ingredientes?id=chile_ancho",
    "GET /api/hipotesis",
    "GET /api/hipotesis/LHC-003",
  ];
  const testAndDevelopmentEndpoints = [
    "GET /api/account",
    "POST /api/account/magic-link",
    "POST /api/account/logout",
    "GET /api/admin/accounts",
    "GET /api/orders",
    "POST /api/orders",
    "GET /api/orders/{id}",
    "POST /api/orders/{id}/payment",
    "POST /api/orders/{id}/checkout-session",
    "POST /api/payments/stripe/webhook",
    "POST /api/events/{id}/reservations",
    "GET /api/reservations",
    "POST /api/products",
    "POST /api/hipotesis",
    "POST /api/members",
    ...(environment === "test" ? ["POST /api/test/reset"] : []),
  ];

  return Response.json({
    name: "Lumbre API",
    version: "1.0.0",
    environment,
    access: environment === "production" ? "cart-write" : "read-write",
    endpoints: [
      ...publicEndpoints,
      ...(environment === "production" ? [] : testAndDevelopmentEndpoints),
    ],
  });
}
