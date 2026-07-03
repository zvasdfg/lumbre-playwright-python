import { products } from "../../lib/data";

export async function GET() {
  return Response.json({ data: products, count: products.length });
}

export async function POST(request: Request) {
  const body = await request.json() as { name?: string; category?: string; price?: number };
  if (!body.name || !body.category || !body.price || body.price <= 0) {
    return Response.json({ error: "name, category and a positive price are required" }, { status: 422 });
  }
  return Response.json({ data: { id: 1000, ...body }, created: true }, { status: 201 });
}
