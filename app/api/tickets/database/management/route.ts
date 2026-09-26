import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { decodeJwtPayload } from "@/app/lib/decode-jwt";
import {
  DATABASE_MANAGEMENT_TICKET_DEPARTMENT,
  DATABASE_MANAGEMENT_TICKET_NAMESPACE,
} from "@/app/lib/database-management-ticket-constants";

const TICKET_HUB_API_URL =
  process.env.TICKET_HUB_API_URL ?? "http://localhost:3000";

interface InternalUserJwtPayload {
  email?: string;
}

interface CreateDatabaseManagementTicketRequestBody {
  assignee?: string;
  subject?: string;
  description?: string;
  dbDeployment?: string;
  dbName?: string;
  sqlCode?: string;
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
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const payload = decodeJwtPayload<InternalUserJwtPayload>(token);
  if (!payload?.email) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  let body: CreateDatabaseManagementTicketRequestBody;
  try {
    body = (await request.json()) as CreateDatabaseManagementTicketRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/database/management`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        informer: payload.email,
        assignee: body.assignee,
        department: DATABASE_MANAGEMENT_TICKET_DEPARTMENT,
        subject: body.subject,
        description: body.description,
        dbNamespace: DATABASE_MANAGEMENT_TICKET_NAMESPACE,
        dbDeployment: body.dbDeployment,
        dbName: body.dbName,
        sqlCode: body.sqlCode,
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
