import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAssignees,
  fetchServerManagementTicket,
  fetchServerManagementTickets,
  patchServerManagementTicket,
  postServerManagementTicket,
} from "./server-management-ticket.connector";
import {
  createServerManagementTicket,
  getAssignees,
  getServerManagementTicket,
  getServerManagementTickets,
  updateServerManagementTicket,
} from "./server-management-ticket.service";

vi.mock("./server-management-ticket.connector");

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

describe("createServerManagementTicket", () => {
  const payload = { assignee: "ana@corp.com", subject: "Patch hosts", description: "Run playbook", codeAnsible: "- hosts: all" };

  it("posts the payload through the connector", async () => {
    vi.mocked(postServerManagementTicket).mockResolvedValue({ ok: true, data: null });

    await expect(createServerManagementTicket(payload)).resolves.toBeUndefined();
    expect(postServerManagementTicket).toHaveBeenCalledWith(payload);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(postServerManagementTicket).mockResolvedValue({
      ok: false,
      data: { message: "Invalid" },
    });

    await expect(createServerManagementTicket(payload)).rejects.toThrow("Invalid");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(postServerManagementTicket).mockResolvedValue({ ok: false, data: null });

    await expect(createServerManagementTicket(payload)).rejects.toThrow(
      "No se pudo crear el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(postServerManagementTicket).mockRejectedValue(new Error("network down"));

    await expect(createServerManagementTicket(payload)).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });
});

describe("getServerManagementTickets", () => {
  it("returns the tickets from the connector and forwards the signal", async () => {
    vi.mocked(fetchServerManagementTickets).mockResolvedValue({
      ok: true,
      data: [{ number: 1 }] as never,
    });
    const controller = new AbortController();

    const result = await getServerManagementTickets(controller.signal);

    expect(result).toEqual([{ number: 1 }]);
    expect(fetchServerManagementTickets).toHaveBeenCalledWith(controller.signal);
  });

  it("returns an empty list when the response has no data", async () => {
    vi.mocked(fetchServerManagementTickets).mockResolvedValue({ ok: true, data: null });

    expect(await getServerManagementTickets()).toEqual([]);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchServerManagementTickets).mockResolvedValue({
      ok: false,
      data: { message: "Forbidden" },
    });

    await expect(getServerManagementTickets()).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchServerManagementTickets).mockResolvedValue({ ok: false, data: null });

    await expect(getServerManagementTickets()).rejects.toThrow(
      "No se pudieron obtener los tickets.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchServerManagementTickets).mockRejectedValue(new Error("network down"));

    await expect(getServerManagementTickets()).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchServerManagementTickets).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getServerManagementTickets(controller.signal)).rejects.toBe(abortError);
  });
});

describe("getServerManagementTicket", () => {
  it("returns the ticket from the connector and forwards its arguments", async () => {
    vi.mocked(fetchServerManagementTicket).mockResolvedValue({
      ok: true,
      status: 200,
      data: { number: 12 } as never,
    });
    const controller = new AbortController();

    const result = await getServerManagementTicket("12", controller.signal);

    expect(result).toEqual({ number: 12 });
    expect(fetchServerManagementTicket).toHaveBeenCalledWith("12", controller.signal);
  });

  it("throws a not-found message when the response status is 404", async () => {
    vi.mocked(fetchServerManagementTicket).mockResolvedValue({
      ok: false,
      status: 404,
      data: { message: "Backend not found" },
    });

    await expect(getServerManagementTicket("12")).rejects.toThrow(
      "No se encontró ningún ticket con ese número.",
    );
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchServerManagementTicket).mockResolvedValue({
      ok: false,
      status: 403,
      data: { message: "Forbidden" },
    });

    await expect(getServerManagementTicket("12")).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchServerManagementTicket).mockResolvedValue({
      ok: false,
      status: 500,
      data: null,
    });

    await expect(getServerManagementTicket("12")).rejects.toThrow(
      "No se pudo obtener el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchServerManagementTicket).mockRejectedValue(new Error("network down"));

    await expect(getServerManagementTicket("12")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchServerManagementTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getServerManagementTicket("12", controller.signal)).rejects.toBe(
      abortError,
    );
  });
});

describe("updateServerManagementTicket", () => {
  it("returns the updated ticket and forwards its arguments", async () => {
    vi.mocked(patchServerManagementTicket).mockResolvedValue({
      ok: true,
      data: { number: 12, status: "APPROVED" } as never,
    });
    const controller = new AbortController();

    const result = await updateServerManagementTicket(12, "approve", controller.signal);

    expect(result).toEqual({ number: 12, status: "APPROVED" });
    expect(patchServerManagementTicket).toHaveBeenCalledWith(12, "approve", controller.signal);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(patchServerManagementTicket).mockResolvedValue({
      ok: false,
      data: { message: "Conflict" },
    });

    await expect(updateServerManagementTicket(12, "reject")).rejects.toThrow("Conflict");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(patchServerManagementTicket).mockResolvedValue({ ok: false, data: null });

    await expect(updateServerManagementTicket(12, "approve")).rejects.toThrow(
      "No se pudo actualizar el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(patchServerManagementTicket).mockRejectedValue(new Error("network down"));

    await expect(updateServerManagementTicket(12, "approve")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(patchServerManagementTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(
      updateServerManagementTicket(12, "approve", controller.signal),
    ).rejects.toBe(abortError);
  });
});
