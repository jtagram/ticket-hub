import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerManagementTicket, updateServerManagementTicket } from "./server-management-ticket.service";
import type { ServerManagementTicket } from "./server-management-ticket.dto";
import { ServerManagementTicketSearch } from "./server-management-ticket-search";

vi.mock("./server-management-ticket.service");

afterEach(() => {
  vi.resetAllMocks();
});

const openTicket: ServerManagementTicket = {
  id: 99,
  number: 12,
  informer: "informer@corp.com",
  assignee: "ana@corp.com",
  department: "SERVIDORES",
  subject: "Ticket subject",
  status: "OPEN",
  description: "Ticket description",
  response: "",
  codeAnsible: "- hosts: all",
  createdAt: "2024-03-05T12:00:00Z",
  updatedAt: "2024-03-07T12:00:00Z",
};

function valueOf(label: string) {
  return screen.getByText(label).nextElementSibling;
}

async function search(number = "12") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Número de ticket"), number);
  await user.click(screen.getByRole("button", { name: "Buscar" }));
  return user;
}

describe("ServerManagementTicketSearch", () => {
  it("shows the heading and the search form without a result", () => {
    render(<ServerManagementTicketSearch />);

    expect(
      screen.getByRole("heading", { name: "Buscar ticket de gestión de servidor" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Número de ticket")).toHaveValue(null);
    expect(screen.getByRole("button", { name: "Buscar" })).toBeEnabled();
    expect(screen.queryByText(/^Ticket #/)).not.toBeInTheDocument();
    expect(getServerManagementTicket).not.toHaveBeenCalled();
  });

  it("does not search while the ticket number is empty", async () => {
    render(<ServerManagementTicketSearch />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Buscar" }));

    expect(getServerManagementTicket).not.toHaveBeenCalled();
  });

  it("searches by the typed number and shows the ticket details", async () => {
    vi.mocked(getServerManagementTicket).mockResolvedValue(openTicket);
    render(<ServerManagementTicketSearch />);

    await search("12");

    expect(await screen.findByText("Ticket #12")).toBeInTheDocument();
    expect(getServerManagementTicket).toHaveBeenCalledWith("12");
    expect(valueOf("ID")).toHaveTextContent("99");
    expect(valueOf("Informante")).toHaveTextContent("informer@corp.com");
    expect(valueOf("Responsable")).toHaveTextContent("ana@corp.com");
    expect(valueOf("Departamento")).toHaveTextContent("SERVIDORES");
    expect(valueOf("Fecha de creación")).toHaveTextContent("5/3/2024");
    expect(valueOf("Última actualización")).toHaveTextContent("7/3/2024");
    expect(valueOf("Asunto")).toHaveTextContent("Ticket subject");
    expect(valueOf("Descripción")).toHaveTextContent("Ticket description");
    expect(valueOf("Código Ansible")).toHaveTextContent("- hosts: all");
  });

  it("shows a searching label and disables the button while the request is pending", async () => {
    let resolveSearch!: (value: ServerManagementTicket) => void;
    vi.mocked(getServerManagementTicket).mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    render(<ServerManagementTicketSearch />);

    await search();

    expect(screen.getByRole("button", { name: "Buscando…" })).toBeDisabled();

    resolveSearch(openTicket);
    expect(await screen.findByText("Ticket #12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeEnabled();
  });

  it("shows the error and no ticket when the search fails", async () => {
    vi.mocked(getServerManagementTicket).mockRejectedValue(
      new Error("No se encontró ningún ticket con ese número."),
    );
    render(<ServerManagementTicketSearch />);

    await search("404");

    expect(
      await screen.findByText("No se encontró ningún ticket con ese número."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Ticket #/)).not.toBeInTheDocument();
  });

  it("clears the previous result when a new search starts", async () => {
    vi.mocked(getServerManagementTicket).mockResolvedValueOnce(openTicket);
    render(<ServerManagementTicketSearch />);
    const user = await search("12");
    expect(await screen.findByText("Ticket #12")).toBeInTheDocument();

    vi.mocked(getServerManagementTicket).mockRejectedValueOnce(new Error("Boom"));
    await user.clear(screen.getByLabelText("Número de ticket"));
    await user.type(screen.getByLabelText("Número de ticket"), "13");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Boom")).toBeInTheDocument();
    expect(screen.queryByText("Ticket #12")).not.toBeInTheDocument();
  });

  it.each([
    ["OPEN", "Abierto"],
    ["APPROVED", "Aprobado"],
    ["REJECTED", "Rechazado"],
  ] as const)("shows the %s status as %s", async (status, label) => {
    vi.mocked(getServerManagementTicket).mockResolvedValue({ ...openTicket, status });
    render(<ServerManagementTicketSearch />);

    await search();

    expect(await screen.findByText(label, { selector: ".badge" })).toBeInTheDocument();
  });

  it.each(["APPROVED", "REJECTED"] as const)(
    "does not offer decisions for a %s ticket",
    async (status) => {
      vi.mocked(getServerManagementTicket).mockResolvedValue({ ...openTicket, status });
      render(<ServerManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    },
  );

  it("offers approve and reject for an open ticket", async () => {
    vi.mocked(getServerManagementTicket).mockResolvedValue(openTicket);
    render(<ServerManagementTicketSearch />);

    await search();

    expect(await screen.findByRole("button", { name: "Aprobar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeEnabled();
  });

  it.each([
    ["Aprobar", "approve", "APPROVED", "Aprobado"],
    ["Rechazar", "reject", "REJECTED", "Rechazado"],
  ] as const)(
    "clicking %s updates the ticket and shows its new status",
    async (buttonName, action, status, statusLabel) => {
      vi.mocked(getServerManagementTicket).mockResolvedValue(openTicket);
      vi.mocked(updateServerManagementTicket).mockResolvedValue({ ...openTicket, status });
      render(<ServerManagementTicketSearch />);
      const user = await search();

      await user.click(await screen.findByRole("button", { name: buttonName }));

      expect(
        await screen.findByText(statusLabel, { selector: ".badge" }),
      ).toBeInTheDocument();
      expect(updateServerManagementTicket).toHaveBeenCalledWith(12, action);
      expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    },
  );

  it("disables both decision buttons while the update is pending", async () => {
    let resolveUpdate!: (value: ServerManagementTicket) => void;
    vi.mocked(getServerManagementTicket).mockResolvedValue(openTicket);
    vi.mocked(updateServerManagementTicket).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    render(<ServerManagementTicketSearch />);
    const user = await search();

    await user.click(await screen.findByRole("button", { name: "Aprobar" }));

    const pending = screen.getAllByRole("button", { name: "Procesando…" });
    expect(pending).toHaveLength(2);
    pending.forEach((button) => expect(button).toBeDisabled());

    resolveUpdate({ ...openTicket, status: "APPROVED" });
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Procesando…" })).not.toBeInTheDocument(),
    );
  });

  it("shows the error instead of the ticket when the update fails", async () => {
    vi.mocked(getServerManagementTicket).mockResolvedValue(openTicket);
    vi.mocked(updateServerManagementTicket).mockRejectedValue(new Error("Conflict"));
    render(<ServerManagementTicketSearch />);
    const user = await search();

    await user.click(await screen.findByRole("button", { name: "Rechazar" }));

    expect(await screen.findByText("Conflict")).toBeInTheDocument();
    expect(screen.queryByText("Ticket #12")).not.toBeInTheDocument();
  });

  describe("execution response", () => {
    it("shows a placeholder when there is no response yet", async () => {
      vi.mocked(getServerManagementTicket).mockResolvedValue({ ...openTicket, response: "" });
      render(<ServerManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(valueOf("Respuesta de ejecución")).toHaveTextContent(
        "Sin respuesta todavía.",
      );
    });

    it("pretty-prints a JSON response", async () => {
      vi.mocked(getServerManagementTicket).mockResolvedValue({
        ...openTicket,
        response: '{"rows":1}',
      });
      render(<ServerManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(valueOf("Respuesta de ejecución")?.textContent).toBe(
        '{\n  "rows": 1\n}',
      );
    });

    it("shows a non-JSON response as-is", async () => {
      vi.mocked(getServerManagementTicket).mockResolvedValue({
        ...openTicket,
        response: "plain text output",
      });
      render(<ServerManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(valueOf("Respuesta de ejecución")?.textContent).toBe(
        "plain text output",
      );
    });
  });
});
