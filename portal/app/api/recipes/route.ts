import { recipes } from "../../lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q")?.toLocaleLowerCase("es") ?? "";
  const result = recipes.filter((recipe) =>
    (!category || category === "todos" || recipe.category === category) &&
    (!query || `${recipe.title} ${recipe.description}`.toLocaleLowerCase("es").includes(query)),
  );
  return Response.json({ data: result, count: result.length });
}
