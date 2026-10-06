import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { requireEnv } from "@/app/lib/require-env";
import {
  extractErrorMessage,
  readBackendBody,
  UNREADABLE_BACKEND_BODY_STATUS,
  type BackendErrorBody,
} from "@/app/lib/backend-proxy";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

interface IamLoginSuccess {
  access_token: string;
}

export async function POST(request: Request) {
  const IAM_API_URL = requireEnv("IAM_API_URL", process.env.IAM_API_URL);
  const TICKET_HUB_APPLICATION_NAME = requireEnv(
    "TICKET_HUB_APPLICATION_NAME",
    process.env.TICKET_HUB_APPLICATION_NAME,
  );
  const TICKET_HUB_TARGET_APPLICATION_NAME = requireEnv(
    "TICKET_HUB_TARGET_APPLICATION_NAME",
    process.env.TICKET_HUB_TARGET_APPLICATION_NAME,
  );
  let body: LoginRequestBody;
  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { message: "Correo y contraseña son obligatorios." },
      { status: 400 },
    );
  }

  const iamResponse = await fetch(`${IAM_API_URL}/internal-users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-application-name": TICKET_HUB_APPLICATION_NAME,
      "x-target-application": TICKET_HUB_TARGET_APPLICATION_NAME,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await readBackendBody<
    Partial<IamLoginSuccess> & BackendErrorBody
  >(iamResponse);

  if (!iamResponse.ok) {
    return NextResponse.json(
      { message: extractErrorMessage(data, "No se pudo iniciar sesión.") },
      { status: iamResponse.status },
    );
  }

  if (!data?.access_token) {
    return NextResponse.json(
      { message: "No se pudo iniciar sesión." },
      { status: UNREADABLE_BACKEND_BODY_STATUS },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
