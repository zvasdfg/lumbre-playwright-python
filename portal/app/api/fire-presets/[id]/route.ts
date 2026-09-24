import { authenticatedUser } from "../../../../server/modules/auth/auth-service";
import {
  deleteFirePreset,
  PresetNotFoundError,
} from "../../../../server/modules/fire-planner/preset-service";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser(request);
  if (!user) return Response.json({ error: "Authentication is required" }, { status: 401 });
  const id = (await context.params).id;
  try {
    await deleteFirePreset(user.id, id);
    return Response.json({ deleted: true, id });
  } catch (error) {
    if (error instanceof PresetNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
