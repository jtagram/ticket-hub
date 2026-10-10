import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-cookie";
import {
  extractErrorMessage,
  forwardBackendResponse,
  getAuthToken,
  invalidTicketNumberResponse,
  isValidTicketNumber,
  readBackendBody,
} from "../backend-proxy";

const cookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("extractErrorMessage", () => {
  it("returns the string message", () => {
    expect(extractErrorMessage({ message: "boom" }, "fb")).toBe("boom");
  });

  it("joins array messages", () => {
    expect(extractErrorMessage({ message: ["a", "b"] }, "fb")).toBe("a, b");
  });

  it("falls back when there is no message or no body", () => {
    expect(extractErrorMessage({}, "fb")).toBe("fb");
    expect(extractErrorMessage(null, "fb")).toBe("fb");
    expect(extractErrorMessage(undefined, "fb")).toBe("fb");
  });
});

describe("getAuthToken", () => {
  it("returns the cookie token", async () => {
    cookieGet.mockReturnValue({ value: "tok" });

    expect(await getAuthToken()).toEqual({ token: "tok" });
    expect(cookieGet).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
  });

  it("returns a 401 response when the cookie is missing", async () => {
    cookieGet.mockReturnValue(undefined);

    const result = await getAuthToken();

    expect(result.token).toBeUndefined();
    expect(result.unauthorized?.status).toBe(401);
    expect(await result.unauthorized?.json()).toEqual({
      message: "No autenticado.",
    });
  });
});

describe("isValidTicketNumber / invalidTicketNumberResponse", () => {
  it.each(["0", "7", "12345"])("accepts %j", (value) => {
    expect(isValidTicketNumber(value)).toBe(true);
  });

  it.each(["", "abc", "-1", "1.5", "1/2", "7?x=1", " 7", "7\n", "../1", "1#x"])(
    "rejects %j",
    (value) => {
      expect(isValidTicketNumber(value)).toBe(false);
    },
  );

  it("builds a 400 response", async () => {
    const res = invalidTicketNumberResponse();

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "El número de ticket es inválido.",
    });
  });
});

describe("readBackendBody", () => {
  it("parses JSON", async () => {
    expect(await readBackendBody(new Response('{"a":1}'))).toEqual({ a: 1 });
  });

  it("returns null for a non-JSON body", async () => {
    expect(await readBackendBody(new Response("<html>"))).toBeNull();
    expect(await readBackendBody(new Response(""))).toBeNull();
  });
});

describe("forwardBackendResponse", () => {
  it("passes through a successful JSON body and status", async () => {
    const res = await forwardBackendResponse(
      new Response('{"data":[1]}', { status: 201 }),
      "fb",
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: [1] });
  });

  it("maps backend errors to the message with the backend's status", async () => {
    const res = await forwardBackendResponse(
      new Response('{"message":["x","y"]}', { status: 400 }),
      "fb",
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "x, y" });
  });

  it("uses the fallback when an error body is not JSON", async () => {
    const res = await forwardBackendResponse(
      new Response("<html>", { status: 503 }),
      "fb",
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: "fb" });
  });

  it("returns 502 with the fallback when an OK body is not JSON", async () => {
    const res = await forwardBackendResponse(
      new Response("oops", { status: 200 }),
      "fb",
    );

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: "fb" });
  });
});
