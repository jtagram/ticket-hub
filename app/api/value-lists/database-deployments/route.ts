import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";

const TICKET_HUB_API_URL =
  process.env.TICKET_HUB_API_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
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
  );
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { message: "No se pudieron obtener los deployments." },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}
