import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { requireEnv } from "@/app/lib/require-env";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { number } = await params;

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/kubernetes/manifest/${number}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const data = await ticketHubResponse.json();

  if (!ticketHubResponse.ok) {
    return NextResponse.json(
      {
        message: extractErrorMessage(
          data as TicketHubApiErrorBody,
          "No se pudo obtener el ticket.",
        ),
      },
      { status: ticketHubResponse.status },
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const TICKET_HUB_API_URL = requireEnv(
    "TICKET_HUB_API_URL",
    process.env.TICKET_HUB_API_URL,
  );
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  const { number } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
  } | null;
  const action = body?.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ message: "Acción inválida." }, { status: 400 });
  }

  const ticketHubResponse = await fetch(
    `${TICKET_HUB_API_URL}/tickets/kubernetes/manifest/${number}/${action}`,
    { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
  );

  const data = await ticketHubResponse.json();

  if (!ticketHubResponse.ok) {
    return NextResponse.json(
      {
        message: extractErrorMessage(
          data as TicketHubApiErrorBody,
          action === "approve"
            ? "No se pudo aprobar el ticket."
            : "No se pudo rechazar el ticket.",
        ),
      },
      { status: ticketHubResponse.status },
    );
  }

  return NextResponse.json(data);
}
