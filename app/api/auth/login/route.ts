import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import { requireEnv } from "@/app/lib/require-env";

const IAM_API_URL = requireEnv("IAM_API_URL", process.env.IAM_API_URL);
const TICKET_HUB_APPLICATION_NAME = requireEnv(
  "TICKET_HUB_APPLICATION_NAME",
  process.env.TICKET_HUB_APPLICATION_NAME,
);

interface LoginRequestBody {
  email?: string;
  password?: string;
}

interface IamLoginSuccess {
  access_token: string;
}

interface IamErrorBody {
  message?: string | string[];
}

function extractErrorMessage(body: IamErrorBody, fallback: string): string {
  if (Array.isArray(body.message)) {
    return body.message.join(", ");
  }
  return body.message ?? fallback;
}

export async function POST(request: Request) {
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
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await iamResponse.json()) as IamLoginSuccess & IamErrorBody;

  if (!iamResponse.ok) {
    return NextResponse.json(
      { message: extractErrorMessage(data, "No se pudo iniciar sesión.") },
      { status: iamResponse.status },
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
