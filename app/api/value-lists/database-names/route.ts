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

  const searchParams = new URL(request.url).searchParams;
  const namespace = searchParams.get("namespace");
  const deployment = searchParams.get("deployment");
  if (!namespace || !deployment) {
    return NextResponse.json(
      { message: "namespace y deployment son obligatorios." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${TICKET_HUB_API_URL}/search-for-value-lists/database-names?namespace=${encodeURIComponent(namespace)}&deployment=${encodeURIComponent(deployment)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return forwardBackendResponse(response, "No se pudieron obtener las bases de datos.");
}
