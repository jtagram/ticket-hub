import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";

export interface BackendErrorBody {
  message?: string | string[];
}

/** Status returned when a backend answers successfully but its body is not valid JSON. */
export const UNREADABLE_BACKEND_BODY_STATUS = 502;

export function extractErrorMessage(
  body: BackendErrorBody | null | undefined,
  fallback: string,
): string {
  if (Array.isArray(body?.message)) {
    return body.message.join(", ");
  }
  return body?.message ?? fallback;
}

export type AuthResult =
  | { token: string; unauthorized?: undefined }
  | { token?: undefined; unauthorized: NextResponse };

/** Reads the session token from the cookie, or builds the 401 response. */
export async function getAuthToken(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return {
      unauthorized: NextResponse.json(
        { message: "No autenticado." },
        { status: 401 },
      ),
    };
  }

  return { token };
}

/** Ticket numbers are integers (`ParseIntPipe` on `:number` in ticket-hub-api). */
export function isValidTicketNumber(value: string): boolean {
  return /^\d+$/.test(value);
}

export function invalidTicketNumberResponse(): NextResponse {
  return NextResponse.json(
    { message: "El número de ticket es inválido." },
    { status: 400 },
  );
}

/** Parses a Response or Request body as JSON; `null` when it is empty or not JSON. */
export async function readBackendBody<T>(
  source: Pick<Response, "json">,
): Promise<T | null> {
  return (await source.json().catch(() => null)) as T | null;
}

/**
 * Translates a backend response into the route response, preserving the
 * backend's status. A non-JSON body never throws: errors fall back to
 * `fallback` with the backend's status; an OK status with an unreadable body
 * becomes a 502.
 */
export async function forwardBackendResponse(
  backendResponse: Response,
  fallback: string,
): Promise<NextResponse> {
  const data = await readBackendBody<BackendErrorBody>(backendResponse);

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: extractErrorMessage(data, fallback) },
      { status: backendResponse.status },
    );
  }

  if (data === null) {
    return NextResponse.json(
      { message: fallback },
      { status: UNREADABLE_BACKEND_BODY_STATUS },
    );
  }

  return NextResponse.json(data, { status: backendResponse.status });
}
