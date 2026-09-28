import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { requireEnv } from "@/app/lib/require-env";

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

  const response = await fetch(
    `${TICKET_HUB_API_URL}/search-for-value-lists/assignees`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { message: data?.message ?? "No se pudieron obtener los responsables." },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}
