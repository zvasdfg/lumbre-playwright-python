import { isProductionReadOnly, readOnlyResponse } from "../../lib/environment";

export async function POST(request: Request) {
  if (isProductionReadOnly()) return readOnlyResponse([]);

  const body = await request.json() as { name?: string; email?: string; experience?: string; terms?: string };
  if (!body.name || body.name.trim().length < 2 || !body.email?.includes("@") || !body.terms) {
    return Response.json({ error: "invalid membership data" }, { status: 422 });
  }
  return Response.json({ data: { id: "member-demo-001", name: body.name, email: body.email, experience: body.experience }, created: true }, { status: 201 });
}
