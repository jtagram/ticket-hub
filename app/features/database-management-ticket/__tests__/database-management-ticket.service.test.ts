import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAssignees,
  fetchDeployments,
  fetchDbNames,
  fetchDatabaseManagementTicket,
  fetchDatabaseManagementTickets,
  patchDatabaseManagementTicket,
  postDatabaseManagementTicket,
} from "../database-management-ticket.connector";
import {
  createDatabaseManagementTicket,
  getAssignees,
  getDeployments,
  getDbNames,
  getDatabaseManagementTicket,
  getDatabaseManagementTickets,
  updateDatabaseManagementTicket,
} from "../database-management-ticket.service";

vi.mock("../database-management-ticket.connector");

afterEach(() => {
  vi.resetAllMocks();
});

type ValueListCase = {
  name: string;
  service: (...args: unknown[]) => Promise<unknown>;
  connector: (...args: unknown[]) => Promise<unknown>;
  args: string[];
  fallback: string;
};

describe.each<ValueListCase>([
  { name: "getAssignees", service: getAssignees as ValueListCase["service"], connector: fetchAssignees as ValueListCase["connector"], args: [], fallback: "No se pudieron obtener los responsables." },
  { name: "getDeployments", service: getDeployments as ValueListCase["service"], connector: fetchDeployments as ValueListCase["connector"], args: ["databases"], fallback: "No se pudieron obtener los deployments." },
  { name: "getDbNames", service: getDbNames as ValueListCase["service"], connector: fetchDbNames as ValueListCase["connector"], args: ["databases", "pg-main"], fallback: "No se pudieron obtener las bases de datos." },
])("$name", ({ service, connector, args, fallback }) => {
  it("returns the list from the connector and forwards its arguments", async () => {
    vi.mocked(connector).mockResolvedValue({
      ok: true,
      data: [{ value: "a", label: "A" }],
    });
    const controller = new AbortController();

    const result = await service(...args, controller.signal);

    expect(result).toEqual([{ value: "a", label: "A" }]);
    expect(connector).toHaveBeenCalledWith(...args, controller.signal);
  });

  it("returns an empty list when the response has no data", async () => {
    vi.mocked(connector).mockResolvedValue({ ok: true, data: null });

    expect(await service(...args)).toEqual([]);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(connector).mockResolvedValue({
      ok: false,
      data: { message: "Forbidden" },
    });

    await expect(service(...args)).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(connector).mockResolvedValue({ ok: false, data: null });

    await expect(service(...args)).rejects.toThrow(fallback);
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(connector).mockRejectedValue(new Error("network down"));

    await expect(service(...args)).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(connector).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(service(...args, controller.signal)).rejects.toBe(abortError);
  });
});

describe("createDatabaseManagementTicket", () => {
  const payload = { assignee: "ana@corp.com", subject: "Add index", description: "Needs an index", dbDeployment: "pg-main", dbName: "orders", sqlCode: "CREATE INDEX i ON t(c);" };

  it("posts the payload through the connector", async () => {
    vi.mocked(postDatabaseManagementTicket).mockResolvedValue({ ok: true, data: null });

    await expect(createDatabaseManagementTicket(payload)).resolves.toBeUndefined();
    expect(postDatabaseManagementTicket).toHaveBeenCalledWith(payload);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(postDatabaseManagementTicket).mockResolvedValue({
      ok: false,
      data: { message: "Invalid" },
    });

    await expect(createDatabaseManagementTicket(payload)).rejects.toThrow("Invalid");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(postDatabaseManagementTicket).mockResolvedValue({ ok: false, data: null });

    await expect(createDatabaseManagementTicket(payload)).rejects.toThrow(
      "No se pudo crear el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(postDatabaseManagementTicket).mockRejectedValue(new Error("network down"));

    await expect(createDatabaseManagementTicket(payload)).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });
});

describe("getDatabaseManagementTickets", () => {
  it("returns the tickets from the connector and forwards the signal", async () => {
    vi.mocked(fetchDatabaseManagementTickets).mockResolvedValue({
      ok: true,
      data: [{ number: 1 }] as never,
    });
    const controller = new AbortController();

    const result = await getDatabaseManagementTickets(controller.signal);

    expect(result).toEqual([{ number: 1 }]);
    expect(fetchDatabaseManagementTickets).toHaveBeenCalledWith(controller.signal);
  });

  it("returns an empty list when the response has no data", async () => {
    vi.mocked(fetchDatabaseManagementTickets).mockResolvedValue({ ok: true, data: null });

    expect(await getDatabaseManagementTickets()).toEqual([]);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchDatabaseManagementTickets).mockResolvedValue({
      ok: false,
      data: { message: "Forbidden" },
    });

    await expect(getDatabaseManagementTickets()).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchDatabaseManagementTickets).mockResolvedValue({ ok: false, data: null });

    await expect(getDatabaseManagementTickets()).rejects.toThrow(
      "No se pudieron obtener los tickets.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchDatabaseManagementTickets).mockRejectedValue(new Error("network down"));

    await expect(getDatabaseManagementTickets()).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchDatabaseManagementTickets).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getDatabaseManagementTickets(controller.signal)).rejects.toBe(abortError);
  });
});

describe("getDatabaseManagementTicket", () => {
  it("returns the ticket from the connector and forwards its arguments", async () => {
    vi.mocked(fetchDatabaseManagementTicket).mockResolvedValue({
      ok: true,
      status: 200,
      data: { number: 12 } as never,
    });
    const controller = new AbortController();

    const result = await getDatabaseManagementTicket("12", controller.signal);

    expect(result).toEqual({ number: 12 });
    expect(fetchDatabaseManagementTicket).toHaveBeenCalledWith("12", controller.signal);
  });

  it("throws a not-found message when the response status is 404", async () => {
    vi.mocked(fetchDatabaseManagementTicket).mockResolvedValue({
      ok: false,
      status: 404,
      data: { message: "Backend not found" },
    });

    await expect(getDatabaseManagementTicket("12")).rejects.toThrow(
      "No se encontró ningún ticket con ese número.",
    );
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchDatabaseManagementTicket).mockResolvedValue({
      ok: false,
      status: 403,
      data: { message: "Forbidden" },
    });

    await expect(getDatabaseManagementTicket("12")).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchDatabaseManagementTicket).mockResolvedValue({
      ok: false,
      status: 500,
      data: null,
    });

    await expect(getDatabaseManagementTicket("12")).rejects.toThrow(
      "No se pudo obtener el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchDatabaseManagementTicket).mockRejectedValue(new Error("network down"));

    await expect(getDatabaseManagementTicket("12")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchDatabaseManagementTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getDatabaseManagementTicket("12", controller.signal)).rejects.toBe(
      abortError,
    );
  });
});

describe("updateDatabaseManagementTicket", () => {
  it("returns the updated ticket and forwards its arguments", async () => {
    vi.mocked(patchDatabaseManagementTicket).mockResolvedValue({
      ok: true,
      data: { number: 12, status: "APPROVED" } as never,
    });
    const controller = new AbortController();

    const result = await updateDatabaseManagementTicket(12, "approve", controller.signal);

    expect(result).toEqual({ number: 12, status: "APPROVED" });
    expect(patchDatabaseManagementTicket).toHaveBeenCalledWith(12, "approve", controller.signal);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(patchDatabaseManagementTicket).mockResolvedValue({
      ok: false,
      data: { message: "Conflict" },
    });

    await expect(updateDatabaseManagementTicket(12, "reject")).rejects.toThrow("Conflict");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(patchDatabaseManagementTicket).mockResolvedValue({ ok: false, data: null });

    await expect(updateDatabaseManagementTicket(12, "approve")).rejects.toThrow(
      "No se pudo actualizar el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(patchDatabaseManagementTicket).mockRejectedValue(new Error("network down"));

    await expect(updateDatabaseManagementTicket(12, "approve")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(patchDatabaseManagementTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(
      updateDatabaseManagementTicket(12, "approve", controller.signal),
    ).rejects.toBe(abortError);
  });
});
