import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiResponse,
  jsonRequest,
  routeParams,
} from "@/test/mocks/ticket-hub";
import { GET, PATCH } from "../route";

const cookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

const fetchMock = vi.fn();

const URL = "http://localhost/api/tickets/database/management/12";

beforeEach(() => {
  vi.stubEnv("TICKET_HUB_API_URL", "http://hub.test");
  vi.stubGlobal("fetch", fetchMock);
  cookieGet.mockReturnValue({ value: "tok123" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GET /api/tickets/database/management/[number]", () => {
  it("throws when TICKET_HUB_API_URL is missing", async () => {
    vi.stubEnv("TICKET_HUB_API_URL", "");

    await expect(GET(jsonRequest(URL, "GET"), routeParams("12"))).rejects.toThrow(
      "TICKET_HUB_API_URL environment variable is required",
    );
  });

  it("returns 401 when there is no auth cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const res = await GET(jsonRequest(URL, "GET"), routeParams("12"));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "No autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the backend error status and message", async () => {
    fetchMock.mockResolvedValue(apiResponse({ message: "Not found" }, 404));

    const res = await GET(jsonRequest(URL, "GET"), routeParams("12"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Not found" });
  });

  it("joins array messages from the backend", async () => {
    fetchMock.mockResolvedValue(
      apiResponse({ message: ["one", "two"] }, 400),
    );

    const res = await GET(jsonRequest(URL, "GET"), routeParams("12"));

    expect(await res.json()).toEqual({ message: "one, two" });
  });

  it("uses a fallback message when the backend sends none", async () => {
    fetchMock.mockResolvedValue(apiResponse({}, 500));

    const res = await GET(jsonRequest(URL, "GET"), routeParams("12"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "No se pudo obtener el ticket." });
  });

  it("proxies the ticket for the requested number with the bearer token", async () => {
    fetchMock.mockResolvedValue(apiResponse({ number: 12 }));

    const res = await GET(jsonRequest(URL, "GET"), routeParams("12"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ number: 12 });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://hub.test/tickets/database/management/12",
      { headers: { Authorization: "Bearer tok123" } },
    );
  });

  it("uses the fallback message with the backend status when an error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 503 }));

    const res = await GET(jsonRequest(URL, "GET"), routeParams("12"));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: "No se pudo obtener el ticket." });
  });

  it("returns 502 with the fallback message when an OK body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

    const res = await GET(jsonRequest(URL, "GET"), routeParams("12"));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: "No se pudo obtener el ticket." });
  });
});

describe("PATCH /api/tickets/database/management/[number]", () => {
  it("throws when TICKET_HUB_API_URL is missing", async () => {
    vi.stubEnv("TICKET_HUB_API_URL", "");

    await expect(
      PATCH(jsonRequest(URL, "PATCH", { action: "approve" }), routeParams("12")),
    ).rejects.toThrow("TICKET_HUB_API_URL environment variable is required");
  });

  it("returns 401 when there is no auth cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const res = await PATCH(
      jsonRequest(URL, "PATCH", { action: "approve" }),
      routeParams("12"),
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "No autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["is not a known action", { action: "delete" }],
    ["is missing", {}],
    ["body is not valid JSON", "not-json"],
  ])("returns 400 when the action %s", async (_label, body) => {
    const res = await PATCH(jsonRequest(URL, "PATCH", body), routeParams("12"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "Acción inválida." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["approve", "reject"])(
    "calls the backend %s endpoint with PATCH and the bearer token",
    async (action) => {
      fetchMock.mockResolvedValue(apiResponse({ number: 12, status: "X" }));

      const res = await PATCH(
        jsonRequest(URL, "PATCH", { action }),
        routeParams("12"),
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ number: 12, status: "X" });
      expect(fetchMock).toHaveBeenCalledWith(
        `http://hub.test/tickets/database/management/12/${action}`,
        { method: "PATCH", headers: { Authorization: "Bearer tok123" } },
      );
    },
  );

  it.each([
    ["approve", "No se pudo aprobar el ticket."],
    ["reject", "No se pudo rechazar el ticket."],
  ])("uses the %s fallback message when the backend sends none", async (action, message) => {
    fetchMock.mockResolvedValue(apiResponse({}, 500));

    const res = await PATCH(
      jsonRequest(URL, "PATCH", { action }),
      routeParams("12"),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message });
  });

  it("forwards the backend error status and message", async () => {
    fetchMock.mockResolvedValue(apiResponse({ message: "Conflict" }, 409));

    const res = await PATCH(
      jsonRequest(URL, "PATCH", { action: "approve" }),
      routeParams("12"),
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ message: "Conflict" });
  });

  it("joins array messages from the backend", async () => {
    fetchMock.mockResolvedValue(
      apiResponse({ message: ["one", "two"] }, 400),
    );

    const res = await PATCH(
      jsonRequest(URL, "PATCH", { action: "reject" }),
      routeParams("12"),
    );

    expect(await res.json()).toEqual({ message: "one, two" });
  });

  it("uses the fallback message with the backend status when an error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 503 }));

    const res = await PATCH(jsonRequest(URL, "PATCH", { action: "approve" }), routeParams("12"));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: "No se pudo aprobar el ticket." });
  });

  it("returns 502 with the fallback message when an OK body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

    const res = await PATCH(jsonRequest(URL, "PATCH", { action: "approve" }), routeParams("12"));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: "No se pudo aprobar el ticket." });
  });
});

describe.each([
  ["../../x"],
  ["1?x=1"],
  ["1/approve"],
  ["abc"],
  ["-1"],
  ["1.5"],
  [" 1"],
  [""],
])("invalid ticket number %j", (number) => {
  it("GET returns 400 without calling the backend", async () => {
    const res = await GET(jsonRequest(URL, "GET"), routeParams(number));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "El número de ticket es inválido." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 without calling the backend", async () => {
    const res = await PATCH(
      jsonRequest(URL, "PATCH", { action: "approve" }),
      routeParams(number),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "El número de ticket es inválido." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
