import { ingredientFamilies, ingredients } from "../../lib/ingredients";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const family = searchParams.get("familia");
  const status = searchParams.get("estado");
  const query = searchParams.get("q")?.trim().toLocaleLowerCase("es") ?? "";

  if (id) {
    const ingredient = ingredients.find((item) => item.id === id);
    if (!ingredient) {
      return Response.json({ error: `Ingredient '${id}' was not found` }, { status: 404 });
    }
    return Response.json({ data: ingredient });
  }

  const result = ingredients.filter((ingredient) => {
    const matchesFamily = !family || family === "todas" || ingredient.familia === family;
    const matchesStatus = !status || ingredient.estado === status;
    const matchesQuery =
      !query ||
      `${ingredient.nombre} ${ingredient.familia}`.toLocaleLowerCase("es").includes(query);
    return matchesFamily && matchesStatus && matchesQuery;
  });

  return Response.json({
    data: result,
    count: result.length,
    total: ingredients.length,
    families: ingredientFamilies,
  });
}
