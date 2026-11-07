import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { ApiEnvelope } from '@/app/lib/api-envelope';
import { AUTH_COOKIE_NAME } from '@/app/lib/auth-cookie';

/** Status returned when a backend answers successfully but its body is not valid JSON. */
export const UNREADABLE_BACKEND_BODY_STATUS = 502;

/** Error message carried by the envelope's `msg`, or `fallback` when it is missing or empty. */
export function extractErrorMessage(
	envelope: Partial<ApiEnvelope<unknown>> | null | undefined,
	fallback: string,
): string {
	return envelope?.msg || fallback;
}

export type AuthResult =
	{ token: string; unauthorized?: undefined } | { token?: undefined; unauthorized: NextResponse };

/** Reads the session token from the cookie, or builds the 401 response. */
export async function getAuthToken(): Promise<AuthResult> {
	const cookieStore = await cookies();
	const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

	if (!token) {
		return {
			unauthorized: NextResponse.json({ message: 'No autenticado.' }, { status: 401 }),
		};
	}

	return { token };
}

/** Ticket numbers are integers (`ParseIntPipe` on `:number` in ticket-hub-api). */
export function isValidTicketNumber(value: string): boolean {
	return /^\d+$/.test(value);
}

export function invalidTicketNumberResponse(): NextResponse {
	return NextResponse.json({ message: 'El número de ticket es inválido.' }, { status: 400 });
}

/** Parses a Response or Request body as JSON; `null` when it is empty or not JSON. */
export async function readBackendBody<T>(source: Pick<Response, 'json'>): Promise<T | null> {
	return (await source.json().catch(() => null)) as T | null;
}

/**
 * Unwraps a backend `{ ok, msg, data }` envelope into the browser-facing route
 * response, preserving the backend's status. Success answers with `data` alone;
 * errors answer `{ message: msg }`. A non-JSON or malformed body never throws:
 * errors fall back to `fallback` with the backend's status; an OK status with an
 * unreadable body (or `ok: false`, or no `data`) becomes a 502.
 */
export async function forwardBackendResponse(
	backendResponse: Response,
	fallback: string,
): Promise<NextResponse> {
	const envelope = await readBackendBody<Partial<ApiEnvelope<unknown>>>(backendResponse);

	if (!backendResponse.ok) {
		return NextResponse.json(
			{ message: extractErrorMessage(envelope, fallback) },
			{ status: backendResponse.status },
		);
	}

	if (!envelope || envelope.ok !== true || envelope.data === undefined || envelope.data === null) {
		return NextResponse.json(
			{ message: extractErrorMessage(envelope, fallback) },
			{ status: UNREADABLE_BACKEND_BODY_STATUS },
		);
	}

	return NextResponse.json(envelope.data, { status: backendResponse.status });
}
