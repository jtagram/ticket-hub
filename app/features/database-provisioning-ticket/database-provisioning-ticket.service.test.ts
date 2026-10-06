import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAssignees,
  fetchDeployments,
  fetchDatabaseProvisioningTicket,
  fetchDatabaseProvisioningTickets,
  patchDatabaseProvisioningTicket,
  postDatabaseProvisioningTicket,
} from "./database-provisioning-ticket.connector";
import {
  createDatabaseProvisioningTicket,
  getAssignees,
  getDeployments,
  getDatabaseProvisioningTicket,
  getDatabaseProvisioningTickets,
  updateDatabaseProvisioningTicket,
} from "./database-provisioning-ticket.service";

vi.mock("./database-provisioning-ticket.connector");

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

describe("createDatabaseProvisioningTicket", () => {
  const payload = { assignee: "ana@corp.com", subject: "New db", description: "Needs a db", dbDeployment: "pg-main", newDbName: "new_db" };

  it("posts the payload through the connector", async () => {
    vi.mocked(postDatabaseProvisioningTicket).mockResolvedValue({ ok: true, data: null });

    await expect(createDatabaseProvisioningTicket(payload)).resolves.toBeUndefined();
    expect(postDatabaseProvisioningTicket).toHaveBeenCalledWith(payload);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(postDatabaseProvisioningTicket).mockResolvedValue({
      ok: false,
      data: { message: "Invalid" },
    });

    await expect(createDatabaseProvisioningTicket(payload)).rejects.toThrow("Invalid");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(postDatabaseProvisioningTicket).mockResolvedValue({ ok: false, data: null });

    await expect(createDatabaseProvisioningTicket(payload)).rejects.toThrow(
      "No se pudo crear el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(postDatabaseProvisioningTicket).mockRejectedValue(new Error("network down"));

    await expect(createDatabaseProvisioningTicket(payload)).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });
});

describe("getDatabaseProvisioningTickets", () => {
  it("returns the tickets from the connector and forwards the signal", async () => {
    vi.mocked(fetchDatabaseProvisioningTickets).mockResolvedValue({
      ok: true,
      data: [{ number: 1 }] as never,
    });
    const controller = new AbortController();

    const result = await getDatabaseProvisioningTickets(controller.signal);

    expect(result).toEqual([{ number: 1 }]);
    expect(fetchDatabaseProvisioningTickets).toHaveBeenCalledWith(controller.signal);
  });

  it("returns an empty list when the response has no data", async () => {
    vi.mocked(fetchDatabaseProvisioningTickets).mockResolvedValue({ ok: true, data: null });

    expect(await getDatabaseProvisioningTickets()).toEqual([]);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchDatabaseProvisioningTickets).mockResolvedValue({
      ok: false,
      data: { message: "Forbidden" },
    });

    await expect(getDatabaseProvisioningTickets()).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchDatabaseProvisioningTickets).mockResolvedValue({ ok: false, data: null });

    await expect(getDatabaseProvisioningTickets()).rejects.toThrow(
      "No se pudieron obtener los tickets.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchDatabaseProvisioningTickets).mockRejectedValue(new Error("network down"));

    await expect(getDatabaseProvisioningTickets()).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchDatabaseProvisioningTickets).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getDatabaseProvisioningTickets(controller.signal)).rejects.toBe(abortError);
  });
});

describe("getDatabaseProvisioningTicket", () => {
  it("returns the ticket from the connector and forwards its arguments", async () => {
    vi.mocked(fetchDatabaseProvisioningTicket).mockResolvedValue({
      ok: true,
      status: 200,
      data: { number: 12 } as never,
    });
    const controller = new AbortController();

    const result = await getDatabaseProvisioningTicket("12", controller.signal);

    expect(result).toEqual({ number: 12 });
    expect(fetchDatabaseProvisioningTicket).toHaveBeenCalledWith("12", controller.signal);
  });

  it("throws a not-found message when the response status is 404", async () => {
    vi.mocked(fetchDatabaseProvisioningTicket).mockResolvedValue({
      ok: false,
      status: 404,
      data: { message: "Backend not found" },
    });

    await expect(getDatabaseProvisioningTicket("12")).rejects.toThrow(
      "No se encontró ningún ticket con ese número.",
    );
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchDatabaseProvisioningTicket).mockResolvedValue({
      ok: false,
      status: 403,
      data: { message: "Forbidden" },
    });

    await expect(getDatabaseProvisioningTicket("12")).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchDatabaseProvisioningTicket).mockResolvedValue({
      ok: false,
      status: 500,
      data: null,
    });

    await expect(getDatabaseProvisioningTicket("12")).rejects.toThrow(
      "No se pudo obtener el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchDatabaseProvisioningTicket).mockRejectedValue(new Error("network down"));

    await expect(getDatabaseProvisioningTicket("12")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchDatabaseProvisioningTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getDatabaseProvisioningTicket("12", controller.signal)).rejects.toBe(
      abortError,
    );
  });
});

describe("updateDatabaseProvisioningTicket", () => {
  it("returns the updated ticket and forwards its arguments", async () => {
    vi.mocked(patchDatabaseProvisioningTicket).mockResolvedValue({
      ok: true,
      data: { number: 12, status: "APPROVED" } as never,
    });
    const controller = new AbortController();

    const result = await updateDatabaseProvisioningTicket(12, "approve", controller.signal);

    expect(result).toEqual({ number: 12, status: "APPROVED" });
    expect(patchDatabaseProvisioningTicket).toHaveBeenCalledWith(12, "approve", controller.signal);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(patchDatabaseProvisioningTicket).mockResolvedValue({
      ok: false,
      data: { message: "Conflict" },
    });

    await expect(updateDatabaseProvisioningTicket(12, "reject")).rejects.toThrow("Conflict");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(patchDatabaseProvisioningTicket).mockResolvedValue({ ok: false, data: null });

    await expect(updateDatabaseProvisioningTicket(12, "approve")).rejects.toThrow(
      "No se pudo actualizar el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(patchDatabaseProvisioningTicket).mockRejectedValue(new Error("network down"));

    await expect(updateDatabaseProvisioningTicket(12, "approve")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(patchDatabaseProvisioningTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(
      updateDatabaseProvisioningTicket(12, "approve", controller.signal),
    ).rejects.toBe(abortError);
  });
});
