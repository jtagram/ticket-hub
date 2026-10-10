import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAssignees,
  fetchKubernetesManifestTicket,
  fetchKubernetesManifestTickets,
  patchKubernetesManifestTicket,
  postKubernetesManifestTicket,
} from "../kubernetes-manifest-ticket.connector";
import {
  createKubernetesManifestTicket,
  getAssignees,
  getKubernetesManifestTicket,
  getKubernetesManifestTickets,
  updateKubernetesManifestTicket,
} from "../kubernetes-manifest-ticket.service";

vi.mock("../kubernetes-manifest-ticket.connector");

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

describe("createKubernetesManifestTicket", () => {
  const payload = { assignee: "ana@corp.com", subject: "Deploy app", description: "Apply manifest", action: "apply", codeYaml: "kind: Pod" } as const;

  it("posts the payload through the connector", async () => {
    vi.mocked(postKubernetesManifestTicket).mockResolvedValue({ ok: true, data: null });

    await expect(createKubernetesManifestTicket(payload)).resolves.toBeUndefined();
    expect(postKubernetesManifestTicket).toHaveBeenCalledWith(payload);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(postKubernetesManifestTicket).mockResolvedValue({
      ok: false,
      data: { message: "Invalid" },
    });

    await expect(createKubernetesManifestTicket(payload)).rejects.toThrow("Invalid");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(postKubernetesManifestTicket).mockResolvedValue({ ok: false, data: null });

    await expect(createKubernetesManifestTicket(payload)).rejects.toThrow(
      "No se pudo crear el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(postKubernetesManifestTicket).mockRejectedValue(new Error("network down"));

    await expect(createKubernetesManifestTicket(payload)).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });
});

describe("getKubernetesManifestTickets", () => {
  it("returns the tickets from the connector and forwards the signal", async () => {
    vi.mocked(fetchKubernetesManifestTickets).mockResolvedValue({
      ok: true,
      data: [{ number: 1 }] as never,
    });
    const controller = new AbortController();

    const result = await getKubernetesManifestTickets(controller.signal);

    expect(result).toEqual([{ number: 1 }]);
    expect(fetchKubernetesManifestTickets).toHaveBeenCalledWith(controller.signal);
  });

  it("returns an empty list when the response has no data", async () => {
    vi.mocked(fetchKubernetesManifestTickets).mockResolvedValue({ ok: true, data: null });

    expect(await getKubernetesManifestTickets()).toEqual([]);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchKubernetesManifestTickets).mockResolvedValue({
      ok: false,
      data: { message: "Forbidden" },
    });

    await expect(getKubernetesManifestTickets()).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchKubernetesManifestTickets).mockResolvedValue({ ok: false, data: null });

    await expect(getKubernetesManifestTickets()).rejects.toThrow(
      "No se pudieron obtener los tickets.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchKubernetesManifestTickets).mockRejectedValue(new Error("network down"));

    await expect(getKubernetesManifestTickets()).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchKubernetesManifestTickets).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getKubernetesManifestTickets(controller.signal)).rejects.toBe(abortError);
  });
});

describe("getKubernetesManifestTicket", () => {
  it("returns the ticket from the connector and forwards its arguments", async () => {
    vi.mocked(fetchKubernetesManifestTicket).mockResolvedValue({
      ok: true,
      status: 200,
      data: { number: 12 } as never,
    });
    const controller = new AbortController();

    const result = await getKubernetesManifestTicket("12", controller.signal);

    expect(result).toEqual({ number: 12 });
    expect(fetchKubernetesManifestTicket).toHaveBeenCalledWith("12", controller.signal);
  });

  it("throws a not-found message when the response status is 404", async () => {
    vi.mocked(fetchKubernetesManifestTicket).mockResolvedValue({
      ok: false,
      status: 404,
      data: { message: "Backend not found" },
    });

    await expect(getKubernetesManifestTicket("12")).rejects.toThrow(
      "No se encontró ningún ticket con ese número.",
    );
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(fetchKubernetesManifestTicket).mockResolvedValue({
      ok: false,
      status: 403,
      data: { message: "Forbidden" },
    });

    await expect(getKubernetesManifestTicket("12")).rejects.toThrow("Forbidden");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(fetchKubernetesManifestTicket).mockResolvedValue({
      ok: false,
      status: 500,
      data: null,
    });

    await expect(getKubernetesManifestTicket("12")).rejects.toThrow(
      "No se pudo obtener el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(fetchKubernetesManifestTicket).mockRejectedValue(new Error("network down"));

    await expect(getKubernetesManifestTicket("12")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(fetchKubernetesManifestTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(getKubernetesManifestTicket("12", controller.signal)).rejects.toBe(
      abortError,
    );
  });
});

describe("updateKubernetesManifestTicket", () => {
  it("returns the updated ticket and forwards its arguments", async () => {
    vi.mocked(patchKubernetesManifestTicket).mockResolvedValue({
      ok: true,
      data: { number: 12, status: "APPROVED" } as never,
    });
    const controller = new AbortController();

    const result = await updateKubernetesManifestTicket(12, "approve", controller.signal);

    expect(result).toEqual({ number: 12, status: "APPROVED" });
    expect(patchKubernetesManifestTicket).toHaveBeenCalledWith(12, "approve", controller.signal);
  });

  it("throws the server message when the response is not ok", async () => {
    vi.mocked(patchKubernetesManifestTicket).mockResolvedValue({
      ok: false,
      data: { message: "Conflict" },
    });

    await expect(updateKubernetesManifestTicket(12, "reject")).rejects.toThrow("Conflict");
  });

  it("throws a fallback message when the error has no message", async () => {
    vi.mocked(patchKubernetesManifestTicket).mockResolvedValue({ ok: false, data: null });

    await expect(updateKubernetesManifestTicket(12, "approve")).rejects.toThrow(
      "No se pudo actualizar el ticket.",
    );
  });

  it("throws a connection error when the request fails", async () => {
    vi.mocked(patchKubernetesManifestTicket).mockRejectedValue(new Error("network down"));

    await expect(updateKubernetesManifestTicket(12, "approve")).rejects.toThrow(
      "No se pudo conectar con el servidor.",
    );
  });

  it("rethrows the original error when the request was aborted", async () => {
    const abortError = new Error("aborted");
    vi.mocked(patchKubernetesManifestTicket).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();

    await expect(
      updateKubernetesManifestTicket(12, "approve", controller.signal),
    ).rejects.toBe(abortError);
  });
});
