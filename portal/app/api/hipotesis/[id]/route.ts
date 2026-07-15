import {
  ensureRecommendedHypotheses,
  listHypotheses,
} from "../../../lib/hypothesis-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await ensureRecommendedHypotheses();
    const records = await listHypotheses();
    const hypothesis = records.find((record) => record.id === id);
    if (!hypothesis) {
      return Response.json({ error: `Hypothesis '${id}' was not found` }, { status: 404 });
    }
    return Response.json({ data: hypothesis });
  } catch (error) {
    return Response.json(
      {
        error: "The local hypothesis registry could not be read",
        detail: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
