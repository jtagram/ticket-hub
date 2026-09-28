import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { decodeJwtPayload } from "@/app/lib/decode-jwt";
import { requireEnv } from "@/app/lib/require-env";
import { SERVER_MANAGEMENT_TICKET_DEPARTMENT } from "@/app/features/server-management-ticket/server-management-ticket-constants";

interface InternalUserJwtPayload {
  email?: string;
}

interface CreateServerManagementTicketRequestBody {
  assignee?: string;
  subject?: string;
  description?: string;
  codeAnsible?: string;
}

interface TicketHubApiErrorBody {
  message?: string | string[];
}

function extractErrorMessage(
  body: TicketHubApiErrorBody,
  fallback: string,
): string {
  if (Array.isArray(body.message)) {
    return body.message.join(", ");
  }
  return body.message ?? fallback;
}

export async function POST(request: Request) {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const payload = decodeJwtPayload<InternalUserJwtPayload>(token);
  if (!payload?.email) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  let body: CreateServerManagementTicketRequestBody;
  try {
    body = (await request.json()) as CreateServerManagementTicketRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/server/management`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        informer: payload.email,
        assignee: body.assignee,
        department: SERVER_MANAGEMENT_TICKET_DEPARTMENT,
        subject: body.subject,
        description: body.description,
        codeAnsible: body.codeAnsible,
      }),
    },
  );

  const data = await ticketHubResponse.json();

  if (!ticketHubResponse.ok) {
    return NextResponse.json(
      {
        message: extractErrorMessage(
          data as TicketHubApiErrorBody,
          "No se pudo crear el ticket.",
        ),
      },
      { status: ticketHubResponse.status },
    );
  }

  return NextResponse.json(data, { status: ticketHubResponse.status });
}

export async function GET() {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/server/management`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const data = await ticketHubResponse.json();

  if (!ticketHubResponse.ok) {
    return NextResponse.json(
      {
        message: extractErrorMessage(
          data as TicketHubApiErrorBody,
          "No se pudieron obtener los tickets.",
        ),
      },
      { status: ticketHubResponse.status },
    );
  }

  return NextResponse.json(data, { status: ticketHubResponse.status });
}
