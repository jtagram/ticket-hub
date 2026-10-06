import { NextResponse } from "next/server";
import { decodeJwtPayload } from "@/app/lib/decode-jwt";
import { requireEnv } from "@/app/lib/require-env";
import {
  forwardBackendResponse,
  getAuthToken,
} from "@/app/lib/backend-proxy";
import { KUBECTL_COMMAND_TICKET_DEPARTMENT } from "@/app/features/kubectl-command-ticket/kubectl-command-ticket-constants";

interface InternalUserJwtPayload {
  email?: string;
}

interface CreateKubectlCommandTicketRequestBody {
  assignee?: string;
  subject?: string;
  description?: string;
  kubectlCommand?: string;
}

export async function POST(request: Request) {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const { token, unauthorized } = await getAuthToken();
  if (unauthorized) {
    return unauthorized;
  }

  const payload = decodeJwtPayload<InternalUserJwtPayload>(token);
  if (!payload?.email) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  let body: CreateKubectlCommandTicketRequestBody;
  try {
    body = (await request.json()) as CreateKubectlCommandTicketRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/kubernetes/kubectl`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        informer: payload.email,
        assignee: body.assignee,
        department: KUBECTL_COMMAND_TICKET_DEPARTMENT,
        subject: body.subject,
        description: body.description,
        kubectlCommand: body.kubectlCommand,
      }),
    },
  );

  return forwardBackendResponse(ticketHubResponse, "No se pudo crear el ticket.");
}

export async function GET() {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const { token, unauthorized } = await getAuthToken();
  if (unauthorized) {
    return unauthorized;
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/kubernetes/kubectl`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return forwardBackendResponse(ticketHubResponse, "No se pudieron obtener los tickets.");
}
