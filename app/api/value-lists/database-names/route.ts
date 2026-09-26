import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { requireEnv } from "@/app/lib/require-env";

const TICKET_HUB_API_URL = requireEnv(
  "TICKET_HUB_API_URL",
  process.env.TICKET_HUB_API_URL,
);

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
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
  );
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { message: "No se pudieron obtener las bases de datos." },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}
