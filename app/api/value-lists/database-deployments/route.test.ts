import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiResponse, jsonRequest } from "@/test/mocks/ticket-hub";
import { GET } from "./route";

const cookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

const fetchMock = vi.fn();

const URL = "http://localhost/api/value-lists/database-deployments?namespace=databases";

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

describe("GET /api/value-lists/database-deployments", () => {
  it("throws when TICKET_HUB_API_URL is missing", async () => {
    vi.stubEnv("TICKET_HUB_API_URL", "");

    await expect(GET(jsonRequest(URL, "GET"))).rejects.toThrow(
      "TICKET_HUB_API_URL environment variable is required",
    );
  });

  it("returns 401 when there is no auth cookie", async () => {
    cookieGet.mockReturnValue(undefined);

    const res = await GET(jsonRequest(URL, "GET"));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "No autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when namespace is missing", async () => {
    const res = await GET(
      jsonRequest("http://localhost/api/value-lists/database-deployments", "GET"),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "namespace es obligatorio." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the backend error status and message", async () => {
    fetchMock.mockResolvedValue(apiResponse({ message: "Forbidden" }, 403));

    const res = await GET(jsonRequest(URL, "GET"));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "Forbidden" });
  });

  it("joins array messages from the backend", async () => {
    fetchMock.mockResolvedValue(apiResponse({ message: ["one", "two"] }, 400));

    const res = await GET(jsonRequest(URL, "GET"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "one, two" });
  });

  it("uses a fallback message when the backend sends none", async () => {
    fetchMock.mockResolvedValue(apiResponse({}, 500));

    const res = await GET(jsonRequest(URL, "GET"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      message: "No se pudieron obtener los deployments.",
    });
  });

  it("proxies the list with the bearer token", async () => {
    const list = [{ value: "pg-main", label: "pg-main" }];
    fetchMock.mockResolvedValue(apiResponse(list));

    const res = await GET(jsonRequest(URL, "GET"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(list);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://hub.test/search-for-value-lists/database-deployments?namespace=databases",
      { headers: { Authorization: "Bearer tok123" } },
    );
  });

  it("URL-encodes the namespace sent to the backend", async () => {
    fetchMock.mockResolvedValue(apiResponse([]));

    await GET(
      jsonRequest(
        "http://localhost/api/value-lists/database-deployments?namespace=a%26b%3Dc",
        "GET",
      ),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://hub.test/search-for-value-lists/database-deployments?namespace=a%26b%3Dc",
      expect.any(Object),
    );
  });

  it("uses the fallback message with the backend status when an error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 503 }));

    const res = await GET(jsonRequest(URL, "GET"));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ message: "No se pudieron obtener los deployments." });
  });

  it("returns 502 with the fallback message when an OK body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

    const res = await GET(jsonRequest(URL, "GET"));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: "No se pudieron obtener los deployments." });
  });
});
