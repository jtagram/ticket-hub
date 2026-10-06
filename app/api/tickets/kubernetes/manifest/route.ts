import { NextResponse } from "next/server";
import { decodeJwtPayload } from "@/app/lib/decode-jwt";
import { requireEnv } from "@/app/lib/require-env";
import {
  forwardBackendResponse,
  getAuthToken,
} from "@/app/lib/backend-proxy";
import {
  KUBERNETES_MANIFEST_TICKET_DEPARTMENT,
  KUBERNETES_MANIFEST_TICKET_NAMESPACE,
} from "@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-constants";

interface InternalUserJwtPayload {
  email?: string;
}

interface CreateKubernetesManifestTicketRequestBody {
  assignee?: string;
  subject?: string;
  description?: string;
  action?: string;
  codeYaml?: string;
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

  let body: CreateKubernetesManifestTicketRequestBody;
  try {
    body =
      (await request.json()) as CreateKubernetesManifestTicketRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/kubernetes/manifest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        informer: payload.email,
        assignee: body.assignee,
        department: KUBERNETES_MANIFEST_TICKET_DEPARTMENT,
        subject: body.subject,
        description: body.description,
        namespace: KUBERNETES_MANIFEST_TICKET_NAMESPACE,
        action: body.action,
        codeYaml: body.codeYaml,
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
    `${TICKET_HUB_API_URL}/tickets/kubernetes/manifest`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return forwardBackendResponse(ticketHubResponse, "No se pudieron obtener los tickets.");
}
