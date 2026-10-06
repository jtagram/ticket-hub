import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiResponse,
  fakeJwt,
  jsonRequest,
} from "@/test/mocks/ticket-hub";
import { GET, POST } from "./route";

const cookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

const fetchMock = vi.fn();

const TOKEN = fakeJwt({ email: "informer@corp.com" });
const URL = "http://localhost/api/tickets/kubernetes/manifest";
const validBody = { assignee: "ana@corp.com", subject: "Deploy app", description: "Apply manifest", action: "apply", codeYaml: "kind: Pod" };

beforeEach(() => {
  vi.stubEnv("TICKET_HUB_API_URL", "http://hub.test");
  vi.stubGlobal("fetch", fetchMock);
  cookieGet.mockReturnValue({ value: TOKEN });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("POST /api/tickets/kubernetes/manifest", () => {
  it("throws when TICKET_HUB_API_URL is missing", async () => {
    vi.stubEnv("TICKET_HUB_API_URL", "");

    await expect(POST(jsonRequest(URL, "POST", validBody))).rejects.toThrow(
      "TICKET_HUB_API_URL environment variable is required",
    );
  });

  it("returns 401 when there is no auth cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const res = await POST(jsonRequest(URL, "POST", validBody));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "No autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["has no email claim", fakeJwt({ sub: "1" })],
    ["is not a JWT", "not-a-jwt"],
  ])("returns 401 when the token %s", async (_label, token) => {
    cookieGet.mockReturnValue({ value: token });

    const res = await POST(jsonRequest(URL, "POST", validBody));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "No autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const res = await POST(jsonRequest(URL, "POST", "not-json"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      message: "Cuerpo de la petición inválido.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the backend error status and message", async () => {
    fetchMock.mockResolvedValue(apiResponse({ message: "Forbidden" }, 403));

    const res = await POST(jsonRequest(URL, "POST", validBody));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "Forbidden" });
  });

  it("joins array messages from the backend", async () => {
    fetchMock.mockResolvedValue(
      apiResponse({ message: ["one", "two"] }, 400),
    );

    const res = await POST(jsonRequest(URL, "POST", validBody));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "one, two" });
  });

  it("uses a fallback message when the backend sends none", async () => {
    fetchMock.mockResolvedValue(apiResponse({}, 500));

    const res = await POST(jsonRequest(URL, "POST", validBody));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "No se pudo crear el ticket." });
  });

  it("sets informer and fixed fields server-side and ignores spoofed ones", async () => {
    fetchMock.mockResolvedValue(apiResponse({ number: 7 }, 201));

    const res = await POST(
      jsonRequest(URL, "POST", {
        ...validBody,
        informer: "spoof@evil.com", department: "SPOOF", namespace: "spoof",
        extra: "ignored",
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ number: 7 });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://hub.test/tickets/kubernetes/manifest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ informer: "informer@corp.com", assignee: "ana@corp.com", department: "KUBERNATES", subject: "Deploy app", description: "Apply manifest", namespace: "default", action: "apply", codeYaml: "kind: Pod" }),
      },
    );
  });

  it("uses the fallback message with the backend status when an error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 503 }));

    const res = await POST(jsonRequest(URL, "POST", validBody));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: "No se pudo crear el ticket." });
  });

  it("returns 502 with the fallback message when an OK body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

    const res = await POST(jsonRequest(URL, "POST", validBody));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: "No se pudo crear el ticket." });
  });
});

describe("GET /api/tickets/kubernetes/manifest", () => {
  it("throws when TICKET_HUB_API_URL is missing", async () => {
    vi.stubEnv("TICKET_HUB_API_URL", "");

    await expect(GET()).rejects.toThrow(
      "TICKET_HUB_API_URL environment variable is required",
    );
  });

  it("returns 401 when there is no auth cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "No autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the backend error status and message", async () => {
    fetchMock.mockResolvedValue(apiResponse({ message: "Forbidden" }, 403));

    const res = await GET();

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "Forbidden" });
  });

  it("joins array messages from the backend", async () => {
    fetchMock.mockResolvedValue(
      apiResponse({ message: ["one", "two"] }, 400),
    );

    const res = await GET();

    expect(await res.json()).toEqual({ message: "one, two" });
  });

  it("uses a fallback message when the backend sends none", async () => {
    fetchMock.mockResolvedValue(apiResponse({}, 500));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      message: "No se pudieron obtener los tickets.",
    });
  });

  it("proxies the ticket list with the bearer token", async () => {
    fetchMock.mockResolvedValue(apiResponse([{ number: 1 }, { number: 2 }]));

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ number: 1 }, { number: 2 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://hub.test/tickets/kubernetes/manifest",
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    );
  });

  it("uses the fallback message with the backend status when an error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 503 }));

    const res = await GET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: "No se pudieron obtener los tickets." });
  });

  it("returns 502 with the fallback message when an OK body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

    const res = await GET();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: "No se pudieron obtener los tickets." });
  });
});
