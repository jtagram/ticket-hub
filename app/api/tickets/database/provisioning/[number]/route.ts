import { NextResponse } from "next/server";
import { requireEnv } from "@/app/lib/require-env";
import {
  forwardBackendResponse,
  getAuthToken,
  invalidTicketNumberResponse,
  isValidTicketNumber,
  readBackendBody,
} from "@/app/lib/backend-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const { token, unauthorized } = await getAuthToken();
  if (unauthorized) {
    return unauthorized;
  }

  const { number } = await params;
  if (!isValidTicketNumber(number)) {
    return invalidTicketNumberResponse();
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/database/provisioning/${number}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return forwardBackendResponse(ticketHubResponse, "No se pudo obtener el ticket.");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const { token, unauthorized } = await getAuthToken();
  if (unauthorized) {
    return unauthorized;
  }

  const { number } = await params;
  if (!isValidTicketNumber(number)) {
    return invalidTicketNumberResponse();
  }
  const body = await readBackendBody<{ action?: string }>(request);
  const action = body?.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ message: "Acción inválida." }, { status: 400 });
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/database/provisioning/${number}/${action}`,
    { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
  );

  return forwardBackendResponse(
    ticketHubResponse,
    action === "approve"
      ? "No se pudo aprobar el ticket."
      : "No se pudo rechazar el ticket.",
  );
}
