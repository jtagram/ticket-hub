/** Builds a Response like the ticket-hub backend API would return. */
export function apiResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

/** Builds a Request with a JSON (or raw string) body for route handlers. */
export function jsonRequest(
  url: string,
  method: string,
  body?: unknown,
): Request {
  return new Request(url, {
    method,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

/** Dynamic route params are Promises in this Next version. */
export function routeParams(number: string) {
  return { params: Promise.resolve({ number }) };
}

/** Builds an unsigned JWT whose payload is the given claims (the app only decodes it). */
export function fakeJwt(payload: Record<string, unknown>) {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
}
