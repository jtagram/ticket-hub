import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDatabaseManagementTicket, updateDatabaseManagementTicket } from "../database-management-ticket.service";
import type { DatabaseManagementTicket } from "../database-management-ticket.dto";
import { DatabaseManagementTicketSearch } from "../database-management-ticket-search";

vi.mock("../database-management-ticket.service");

afterEach(() => {
  vi.resetAllMocks();
});

const openTicket: DatabaseManagementTicket = {
  id: 99,
  number: 12,
  informer: "informer@corp.com",
  assignee: "ana@corp.com",
  department: "BASE_DE_DATOS",
  subject: "Ticket subject",
  status: "OPEN",
  description: "Ticket description",
  response: "",
  dbNamespace: "databases", dbDeployment: "pg-main", dbName: "orders", sqlCode: "CREATE INDEX i ON t(c);",
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

describe("DatabaseManagementTicketSearch", () => {
  it("shows the heading and the search form without a result", () => {
    render(<DatabaseManagementTicketSearch />);

    expect(
      screen.getByRole("heading", { name: "Buscar ticket de gestión de base de datos" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Número de ticket")).toHaveValue(null);
    expect(screen.getByRole("button", { name: "Buscar" })).toBeEnabled();
    expect(screen.queryByText(/^Ticket #/)).not.toBeInTheDocument();
    expect(getDatabaseManagementTicket).not.toHaveBeenCalled();
  });

  it("does not search while the ticket number is empty", async () => {
    render(<DatabaseManagementTicketSearch />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Buscar" }));

    expect(getDatabaseManagementTicket).not.toHaveBeenCalled();
  });

  it("searches by the typed number and shows the ticket details", async () => {
    vi.mocked(getDatabaseManagementTicket).mockResolvedValue(openTicket);
    render(<DatabaseManagementTicketSearch />);

    await search("12");

    expect(await screen.findByText("Ticket #12")).toBeInTheDocument();
    expect(getDatabaseManagementTicket).toHaveBeenCalledWith("12");
    expect(valueOf("ID")).toHaveTextContent("99");
    expect(valueOf("Informante")).toHaveTextContent("informer@corp.com");
    expect(valueOf("Responsable")).toHaveTextContent("ana@corp.com");
    expect(valueOf("Departamento")).toHaveTextContent("BASE_DE_DATOS");
    expect(valueOf("Namespace")).toHaveTextContent("databases");
    expect(valueOf("Deployment")).toHaveTextContent("pg-main");
    expect(valueOf("Base de datos")).toHaveTextContent("orders");
    expect(valueOf("Fecha de creación")).toHaveTextContent("5/3/2024");
    expect(valueOf("Última actualización")).toHaveTextContent("7/3/2024");
    expect(valueOf("Asunto")).toHaveTextContent("Ticket subject");
    expect(valueOf("Descripción")).toHaveTextContent("Ticket description");
    expect(valueOf("SQL a ejecutar")).toHaveTextContent("CREATE INDEX i ON t(c);");
  });

  it("shows a searching label and disables the button while the request is pending", async () => {
    let resolveSearch!: (value: DatabaseManagementTicket) => void;
    vi.mocked(getDatabaseManagementTicket).mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    render(<DatabaseManagementTicketSearch />);

    await search();

    expect(screen.getByRole("button", { name: "Buscando…" })).toBeDisabled();

    resolveSearch(openTicket);
    expect(await screen.findByText("Ticket #12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeEnabled();
  });

  it("shows the error and no ticket when the search fails", async () => {
    vi.mocked(getDatabaseManagementTicket).mockRejectedValue(
      new Error("No se encontró ningún ticket con ese número."),
    );
    render(<DatabaseManagementTicketSearch />);

    await search("404");

    expect(
      await screen.findByText("No se encontró ningún ticket con ese número."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Ticket #/)).not.toBeInTheDocument();
  });

  it("clears the previous result when a new search starts", async () => {
    vi.mocked(getDatabaseManagementTicket).mockResolvedValueOnce(openTicket);
    render(<DatabaseManagementTicketSearch />);
    const user = await search("12");
    expect(await screen.findByText("Ticket #12")).toBeInTheDocument();

    vi.mocked(getDatabaseManagementTicket).mockRejectedValueOnce(new Error("Boom"));
    await user.clear(screen.getByLabelText("Número de ticket"));
    await user.type(screen.getByLabelText("Número de ticket"), "13");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Boom")).toBeInTheDocument();
    expect(screen.queryByText("Ticket #12")).not.toBeInTheDocument();
  });

  it.each([
    ["OPEN", "Abierto"],
    ["IN_PROGRESS", "En progreso"],
    ["APPROVED", "Aprobado"],
    ["REJECTED", "Rechazado"],
  ] as const)("shows the %s status as %s", async (status, label) => {
    vi.mocked(getDatabaseManagementTicket).mockResolvedValue({ ...openTicket, status });
    render(<DatabaseManagementTicketSearch />);

    await search();

    expect(await screen.findByText(label, { selector: ".badge" })).toBeInTheDocument();
  });

  it.each(["IN_PROGRESS", "APPROVED", "REJECTED"] as const)(
    "does not offer decisions for a %s ticket",
    async (status) => {
      vi.mocked(getDatabaseManagementTicket).mockResolvedValue({ ...openTicket, status });
      render(<DatabaseManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    },
  );

  it("offers approve and reject for an open ticket", async () => {
    vi.mocked(getDatabaseManagementTicket).mockResolvedValue(openTicket);
    render(<DatabaseManagementTicketSearch />);

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
      vi.mocked(getDatabaseManagementTicket).mockResolvedValue(openTicket);
      vi.mocked(updateDatabaseManagementTicket).mockResolvedValue({ ...openTicket, status });
      render(<DatabaseManagementTicketSearch />);
      const user = await search();

      await user.click(await screen.findByRole("button", { name: buttonName }));

      expect(
        await screen.findByText(statusLabel, { selector: ".badge" }),
      ).toBeInTheDocument();
      expect(updateDatabaseManagementTicket).toHaveBeenCalledWith(12, action);
      expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    },
  );

  it("disables both decision buttons while the update is pending", async () => {
    let resolveUpdate!: (value: DatabaseManagementTicket) => void;
    vi.mocked(getDatabaseManagementTicket).mockResolvedValue(openTicket);
    vi.mocked(updateDatabaseManagementTicket).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    render(<DatabaseManagementTicketSearch />);
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
    vi.mocked(getDatabaseManagementTicket).mockResolvedValue(openTicket);
    vi.mocked(updateDatabaseManagementTicket).mockRejectedValue(new Error("Conflict"));
    render(<DatabaseManagementTicketSearch />);
    const user = await search();

    await user.click(await screen.findByRole("button", { name: "Rechazar" }));

    expect(await screen.findByText("Conflict")).toBeInTheDocument();
    expect(screen.queryByText("Ticket #12")).not.toBeInTheDocument();
  });

  describe("execution response", () => {
    it("shows a placeholder when there is no response yet", async () => {
      vi.mocked(getDatabaseManagementTicket).mockResolvedValue({ ...openTicket, response: "" });
      render(<DatabaseManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(valueOf("Respuesta de ejecución")).toHaveTextContent(
        "Sin respuesta todavía.",
      );
    });

    it("pretty-prints a JSON response", async () => {
      vi.mocked(getDatabaseManagementTicket).mockResolvedValue({
        ...openTicket,
        response: '{"rows":1}',
      });
      render(<DatabaseManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(valueOf("Respuesta de ejecución")?.textContent).toBe(
        '{\n  "rows": 1\n}',
      );
    });

    it("shows a non-JSON response as-is", async () => {
      vi.mocked(getDatabaseManagementTicket).mockResolvedValue({
        ...openTicket,
        response: "plain text output",
      });
      render(<DatabaseManagementTicketSearch />);

      await search();

      await screen.findByText("Ticket #12");
      expect(valueOf("Respuesta de ejecución")?.textContent).toBe(
        "plain text output",
      );
    });
  });
});
