import { NextResponse } from "next/server";
import { requireEnv } from "@/app/lib/require-env";
import {
  forwardBackendResponse,
  getAuthToken,
} from "@/app/lib/backend-proxy";

export async function GET(request: Request) {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const { token, unauthorized } = await getAuthToken();
  if (unauthorized) {
    return unauthorized;
  }

  const namespace = new URL(request.url).searchParams.get("namespace");
  if (!namespace) {
    return NextResponse.json(
      { message: "namespace es obligatorio." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${TICKET_HUB_API_URL}/search-for-value-lists/database-deployments?namespace=${encodeURIComponent(namespace)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return forwardBackendResponse(response, "No se pudieron obtener los deployments.");
}
