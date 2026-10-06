import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAssignees,
  fetchDeployments,
  fetchDatabaseProvisioningTicket,
  fetchDatabaseProvisioningTickets,
  patchDatabaseProvisioningTicket,
  postDatabaseProvisioningTicket,
} from "./database-provisioning-ticket.connector";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe.each([
  { name: "fetchAssignees", call: (signal?: AbortSignal) => fetchAssignees(signal), url: "/api/value-lists/assignees" },
  { name: "fetchDeployments", call: (signal?: AbortSignal) => fetchDeployments("databases", signal), url: "/api/value-lists/database-deployments?namespace=databases" },
])("$name", ({ call, url }) => {
  it("requests the value list with the abort signal and returns ok and data", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ value: "a", label: "A" }]));
    const controller = new AbortController();

    const result = await call(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(url, { signal: controller.signal });
    expect(result).toEqual({ ok: true, data: [{ value: "a", label: "A" }] });
  });

  it("returns ok false with the error body on failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "boom" }, 500));

    const result = await call();

    expect(result).toEqual({ ok: false, data: { message: "boom" } });
  });

  it("returns null data when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 502 }));

    const result = await call();

    expect(result).toEqual({ ok: false, data: null });
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(call()).rejects.toThrow("network down");
  });
});

describe("postDatabaseProvisioningTicket", () => {
  const payload = { assignee: "ana@corp.com", subject: "New db", description: "Needs a db", dbDeployment: "pg-main", newDbName: "new_db" };

  it("POSTs the JSON payload to /api/tickets/database/provisioning", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ number: 1 }, 201));

    const result = await postDatabaseProvisioningTicket(payload);

    expect(fetchMock).toHaveBeenCalledWith("/api/tickets/database/provisioning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual({ ok: true, data: { number: 1 } });
  });

  it("returns ok false with the error body on failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "boom" }, 400));

    const result = await postDatabaseProvisioningTicket(payload);

    expect(result).toEqual({ ok: false, data: { message: "boom" } });
  });

  it("returns null data when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));

    const result = await postDatabaseProvisioningTicket(payload);

    expect(result).toEqual({ ok: false, data: null });
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(postDatabaseProvisioningTicket(payload)).rejects.toThrow("network down");
  });
});

describe("fetchDatabaseProvisioningTickets", () => {
  it("requests /api/tickets/database/provisioning with the abort signal and returns ok and data", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ number: 1 }]));
    const controller = new AbortController();

    const result = await fetchDatabaseProvisioningTickets(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/tickets/database/provisioning", {
      signal: controller.signal,
    });
    expect(result).toEqual({ ok: true, data: [{ number: 1 }] });
  });

  it("returns ok false with the error body on failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "boom" }, 500));

    const result = await fetchDatabaseProvisioningTickets();

    expect(result).toEqual({ ok: false, data: { message: "boom" } });
  });

  it("returns null data when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 502 }));

    const result = await fetchDatabaseProvisioningTickets();

    expect(result).toEqual({ ok: false, data: null });
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(fetchDatabaseProvisioningTickets()).rejects.toThrow("network down");
  });
});

describe("fetchDatabaseProvisioningTicket", () => {
  it("requests the ticket by number with the abort signal and returns ok, status and data", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ number: 12 }));
    const controller = new AbortController();

    const result = await fetchDatabaseProvisioningTicket("12", controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/tickets/database/provisioning/12", {
      signal: controller.signal,
    });
    expect(result).toEqual({ ok: true, status: 200, data: { number: 12 } });
  });

  it("returns ok false with the status and error body on failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Not found" }, 404));

    const result = await fetchDatabaseProvisioningTicket("12");

    expect(result).toEqual({
      ok: false,
      status: 404,
      data: { message: "Not found" },
    });
  });

  it("returns null data when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 502 }));

    const result = await fetchDatabaseProvisioningTicket("12");

    expect(result).toEqual({ ok: false, status: 502, data: null });
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(fetchDatabaseProvisioningTicket("12")).rejects.toThrow("network down");
  });
});

describe("patchDatabaseProvisioningTicket", () => {
  it.each(["approve", "reject"] as const)(
    "PATCHes the %s action to /api/tickets/database/provisioning/<number>",
    async (action) => {
      fetchMock.mockResolvedValue(jsonResponse({ number: 12 }));
      const controller = new AbortController();

      const result = await patchDatabaseProvisioningTicket(12, action, controller.signal);

      expect(fetchMock).toHaveBeenCalledWith("/api/tickets/database/provisioning/12", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        signal: controller.signal,
      });
      expect(result).toEqual({ ok: true, data: { number: 12 } });
    },
  );

  it("returns ok false with the error body on failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "boom" }, 409));

    const result = await patchDatabaseProvisioningTicket(12, "approve");

    expect(result).toEqual({ ok: false, data: { message: "boom" } });
  });

  it("returns null data when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));

    const result = await patchDatabaseProvisioningTicket(12, "reject");

    expect(result).toEqual({ ok: false, data: null });
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(patchDatabaseProvisioningTicket(12, "approve")).rejects.toThrow("network down");
  });
});

describe("fetchDatabaseProvisioningTicket path encoding", () => {
  it("encodes the ticket number so it cannot alter the URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await fetchDatabaseProvisioningTicket("1/../x?y=1");

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/1%2F\.\.%2Fx%3Fy%3D1$/);
  });
});

describe("value-list query encoding", () => {
  it("encodes namespace in the query string", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchDeployments("a&b=1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/value-lists/database-deployments?namespace=a%26b%3D1",
      { signal: undefined },
    );
  });
});
