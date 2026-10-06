import { requireEnv } from "@/app/lib/require-env";
import {
  forwardBackendResponse,
  getAuthToken,
} from "@/app/lib/backend-proxy";

export async function GET() {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const { token, unauthorized } = await getAuthToken();
  if (unauthorized) {
    return unauthorized;
  }

  const response = await fetch(
    `${TICKET_HUB_API_URL}/search-for-value-lists/assignees`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return forwardBackendResponse(response, "No se pudieron obtener los responsables.");
}
