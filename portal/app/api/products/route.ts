import { listPublicProducts } from "../../../server/modules/catalog/catalog-service";

export async function GET() {
  const data = await listPublicProducts();
  return Response.json({ data, count: data.length });
}
