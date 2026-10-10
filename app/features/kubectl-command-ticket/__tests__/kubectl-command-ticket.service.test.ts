import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAssignees,
  fetchKubectlCommandTicket,
  fetchKubectlCommandTickets,
  patchKubectlCommandTicket,
  postKubectlCommandTicket,
} from "../kubectl-command-ticket.connector";
import {
  createKubectlCommandTicket,
  getAssignees,
  getKubectlCommandTicket,
  getKubectlCommandTickets,
  updateKubectlCommandTicket,
} from "../kubectl-command-ticket.service";

vi.mock("../kubectl-command-ticket.connector");

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

describe("createKubectlCommandTicket", () => {
  const payload = { assignee: "ana@corp.com", subject: "List pods", description: "Need the pod list", kubectlCommand: "get pods -n default" };

  it("posts the payload through the connector", async () => {
    vi.mocked(postKubectlCommandTicket).mockResolvedValue({ ok: true, data: null });

    await expect(createKubectlCommandTicket(payload)).resolves.toBeUndefined();
    expect(postKubectlCommandTicket).toHaveBeenCalledWith(payload);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(postKubectlCommandTicket).mockResolvedValue({
      ok: false,
      data: { message: "Invalid" },
    });

    await expect(createKubectlCommandTicket(payload)).rejects.toThrow("Invalid");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(postKubectlCommandTicket).mockResolvedValue({ ok: false, data: null });

    await expect(createKubectlCommandTicket(payload)).rejects.toThrow(
      "No se pudo crear el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(postKubectlCommandTicket).mockRejectedValue(new Error("network down"));

    await expect(createKubectlCommandTicket(payload)).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });
});

describe("getKubectlCommandTickets", () => {
  it("returns the tickets from the connector and forwards the signal", async () => {
    vi.mocked(fetchKubectlCommandTickets).mockResolvedValue({
      ok: true,
      data: [{ number: 1 }] as never,
    });
    const controller = new AbortController();

    const result = await getKubectlCommandTickets(controller.signal);

    expect(result).toEqual([{ number: 1 }]);
    expect(fetchKubectlCommandTickets).toHaveBeenCalledWith(controller.signal);
  });

  it("returns an empty list when the response has no data", async () => {
    vi.mocked(fetchKubectlCommandTickets).mockResolvedValue({ ok: true, data: null });

    expect(await getKubectlCommandTickets()).toEqual([]);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchKubectlCommandTickets).mockResolvedValue({
      ok: false,
      data: { message: "Forbidden" },
    });

    await expect(getKubectlCommandTickets()).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchKubectlCommandTickets).mockResolvedValue({ ok: false, data: null });

    await expect(getKubectlCommandTickets()).rejects.toThrow(
      "No se pudieron obtener los tickets.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchKubectlCommandTickets).mockRejectedValue(new Error("network down"));

    await expect(getKubectlCommandTickets()).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchKubectlCommandTickets).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getKubectlCommandTickets(controller.signal)).rejects.toBe(abortError);
  });
});

describe("getKubectlCommandTicket", () => {
  it("returns the ticket from the connector and forwards its arguments", async () => {
    vi.mocked(fetchKubectlCommandTicket).mockResolvedValue({
      ok: true,
      status: 200,
      data: { number: 12 } as never,
    });
    const controller = new AbortController();

    const result = await getKubectlCommandTicket("12", controller.signal);

    expect(result).toEqual({ number: 12 });
    expect(fetchKubectlCommandTicket).toHaveBeenCalledWith("12", controller.signal);
  });

  it("throws a not-found message when the response status is 404", async () => {
    vi.mocked(fetchKubectlCommandTicket).mockResolvedValue({
      ok: false,
      status: 404,
      data: { message: "Backend not found" },
    });

    await expect(getKubectlCommandTicket("12")).rejects.toThrow(
      "No se encontró ningún ticket con ese número.",
    );
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchKubectlCommandTicket).mockResolvedValue({
      ok: false,
      status: 403,
      data: { message: "Forbidden" },
    });

    await expect(getKubectlCommandTicket("12")).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchKubectlCommandTicket).mockResolvedValue({
      ok: false,
      status: 500,
      data: null,
    });

    await expect(getKubectlCommandTicket("12")).rejects.toThrow(
      "No se pudo obtener el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchKubectlCommandTicket).mockRejectedValue(new Error("network down"));

    await expect(getKubectlCommandTicket("12")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchKubectlCommandTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getKubectlCommandTicket("12", controller.signal)).rejects.toBe(
      abortError,
    );
  });
});

describe("updateKubectlCommandTicket", () => {
  it("returns the updated ticket and forwards its arguments", async () => {
    vi.mocked(patchKubectlCommandTicket).mockResolvedValue({
      ok: true,
      data: { number: 12, status: "APPROVED" } as never,
    });
    const controller = new AbortController();

    const result = await updateKubectlCommandTicket(12, "approve", controller.signal);

    expect(result).toEqual({ number: 12, status: "APPROVED" });
    expect(patchKubectlCommandTicket).toHaveBeenCalledWith(12, "approve", controller.signal);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(patchKubectlCommandTicket).mockResolvedValue({
      ok: false,
      data: { message: "Conflict" },
    });

    await expect(updateKubectlCommandTicket(12, "reject")).rejects.toThrow("Conflict");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(patchKubectlCommandTicket).mockResolvedValue({ ok: false, data: null });

    await expect(updateKubectlCommandTicket(12, "approve")).rejects.toThrow(
      "No se pudo actualizar el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(patchKubectlCommandTicket).mockRejectedValue(new Error("network down"));

    await expect(updateKubectlCommandTicket(12, "approve")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(patchKubectlCommandTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(
      updateKubectlCommandTicket(12, "approve", controller.signal),
    ).rejects.toBe(abortError);
  });
});
