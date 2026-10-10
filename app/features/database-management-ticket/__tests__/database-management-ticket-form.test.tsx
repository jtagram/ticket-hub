import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDatabaseManagementTicket,
  getAssignees,
  getDbNames,
  getDeployments,
} from "../database-management-ticket.service";
import { DatabaseManagementTicketForm } from "../database-management-ticket-form";

vi.mock("../database-management-ticket.service");

beforeEach(() => {
  vi.mocked(getAssignees).mockResolvedValue([
    { value: "ana@corp.com", label: "Ana" },
    { value: "bob@corp.com", label: "Bob" },
  ]);
  vi.mocked(getDeployments).mockResolvedValue([
    { value: "pg-main", label: "pg-main" },
    { value: "pg-alt", label: "pg-alt" },
  ]);
  vi.mocked(getDbNames).mockResolvedValue([
    { value: "orders", label: "orders" },
    { value: "users", label: "users" },
  ]);
});

afterEach(() => {
  vi.resetAllMocks();
});

function renderForm() {
  return render(<DatabaseManagementTicketForm informerEmail="informer@corp.com" />);
}

async function fillForm() {
  const user = userEvent.setup();
  await screen.findByRole("option", { name: "Ana" });
  await user.selectOptions(screen.getByLabelText("Responsable"), "ana@corp.com");
  await user.type(screen.getByLabelText("Asunto"), "Add index");
  await user.type(screen.getByLabelText("Descripción"), "Needs an index");
  await screen.findByRole("option", { name: "pg-main" });
  await user.selectOptions(screen.getByLabelText("Deployment"), "pg-main");
  await screen.findByRole("option", { name: "orders" });
  await user.selectOptions(screen.getByLabelText("Base de datos"), "orders");
  await user.type(screen.getByLabelText("SQL a ejecutar"), "select 1");
  return user;
}

describe("DatabaseManagementTicketForm", () => {
  it("shows the heading, the informer and the fixed fields", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Solicitar gestión de base de datos" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Informante")).toHaveValue("informer@corp.com");
    expect(screen.getByLabelText("Informante")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Departamento")).toHaveValue("BASE_DE_DATOS");
    expect(screen.getByLabelText("Departamento")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Namespace")).toHaveValue("databases");
    expect(screen.getByLabelText("Namespace")).toHaveAttribute("readonly");
  });

  it("loads the assignees with an abort signal and lists them", async () => {
    renderForm();

    expect(await screen.findByRole("option", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bob" })).toBeInTheDocument();
    expect(getAssignees).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("shows a loading message until the value lists are loaded", async () => {
    vi.mocked(getAssignees).mockReturnValue(new Promise(() => {}));
    vi.mocked(getDeployments).mockReturnValue(new Promise(() => {}));
    renderForm();

    expect(screen.getAllByText("Cargando…")).toHaveLength(2);
  });

  it("shows the error when the assignees cannot be loaded", async () => {
    vi.mocked(getAssignees).mockRejectedValue(new Error("Forbidden"));
    renderForm();

    expect(await screen.findByText("Forbidden")).toBeInTheDocument();
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
  });

  it("disables the submit button until the form is valid", async () => {
    renderForm();
    const button = screen.getByRole("button", { name: "Solicitar" });

    expect(button).toBeDisabled();

    await fillForm();

    await waitFor(() => expect(button).toBeEnabled());
  });

  it("creates the ticket, shows a success message and clears the typed fields", async () => {
    vi.mocked(createDatabaseManagementTicket).mockResolvedValue(undefined);
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(
      await screen.findByText("Ticket creado correctamente."),
    ).toBeInTheDocument();
    expect(createDatabaseManagementTicket).toHaveBeenCalledWith({
      assignee: "ana@corp.com",
      subject: "Add index",
      description: "Needs an index",
      dbDeployment: "pg-main",
      dbName: "orders",
      sqlCode: "select 1",
    });
    expect(screen.getByLabelText("Asunto")).toHaveValue("");
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
    expect(screen.getByLabelText("SQL a ejecutar")).toHaveValue("");
    expect(screen.getByLabelText("Deployment")).toHaveValue("pg-main");
    expect(screen.getByLabelText("Base de datos")).toHaveValue("orders");
    expect(screen.getByLabelText("Responsable")).toHaveValue("ana@corp.com");
  });

  it("shows the error when creation fails", async () => {
    vi.mocked(createDatabaseManagementTicket).mockRejectedValue(new Error("Duplicated"));
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("Duplicated")).toBeInTheDocument();
    expect(screen.queryByText("Ticket creado correctamente.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Asunto")).toHaveValue("Add index");
  });

  it("clears a previous success message when submitting again", async () => {
    vi.mocked(createDatabaseManagementTicket)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Duplicated"));
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));
    expect(await screen.findByText("Ticket creado correctamente.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Asunto"), "Again");
    await user.type(screen.getByLabelText("Descripción"), "Again");
    await user.type(screen.getByLabelText("SQL a ejecutar"), "select 2");
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("Duplicated")).toBeInTheDocument();
    expect(screen.queryByText("Ticket creado correctamente.")).not.toBeInTheDocument();
  });

  it("shows a submitting label while the request is pending", async () => {
    let resolveCreate!: () => void;
    vi.mocked(createDatabaseManagementTicket).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();

    resolveCreate();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Solicitar" })).toBeInTheDocument(),
    );
  });

  it("requires the subject and the description", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Asunto"), "x");
    await user.clear(screen.getByLabelText("Asunto"));
    await user.type(screen.getByLabelText("Descripción"), "x");
    await user.clear(screen.getByLabelText("Descripción"));

    expect(await screen.findByText("El asunto es obligatorio.")).toHaveClass("text-danger");
    expect(screen.getByText("La descripción es obligatoria.")).toHaveClass("text-danger");
  });

  it("validates the maximum length of subject and description", async () => {
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Asunto"));
    await user.paste("x".repeat(501));
    await user.click(screen.getByLabelText("Descripción"));
    await user.paste("y".repeat(501));

    expect(await screen.findAllByText("Máximo 500 caracteres.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Solicitar" })).toBeDisabled();
  });

  it("aborts the pending requests when unmounted", () => {
    vi.mocked(getAssignees).mockReturnValue(new Promise(() => {}));
    vi.mocked(getDeployments).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderForm();

    const signal = vi.mocked(getAssignees).mock.calls[0][0] as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it("loads the deployments of the fixed namespace and lists them", async () => {
    renderForm();

    expect(await screen.findByRole("option", { name: "pg-main" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "pg-alt" })).toBeInTheDocument();
    expect(getDeployments).toHaveBeenCalledWith("databases", expect.any(AbortSignal));
  });

  it("shows the error when the deployments cannot be loaded", async () => {
    vi.mocked(getDeployments).mockRejectedValue(new Error("Deployments down"));
    renderForm();

    expect(await screen.findByText("Deployments down")).toBeInTheDocument();
  });

  it("asks to pick a deployment before listing databases", () => {
    renderForm();

    expect(screen.getByText("Seleccioná un deployment primero.")).toBeInTheDocument();
    expect(getDbNames).not.toHaveBeenCalled();
  });

  it("loads the databases of the selected deployment", async () => {
    renderForm();
    const user = userEvent.setup();
    await screen.findByRole("option", { name: "pg-main" });

    await user.selectOptions(screen.getByLabelText("Deployment"), "pg-main");

    expect(await screen.findByRole("option", { name: "orders" })).toBeInTheDocument();
    expect(getDbNames).toHaveBeenCalledWith("databases", "pg-main", expect.any(AbortSignal));
    expect(screen.queryByText("Seleccioná un deployment primero.")).not.toBeInTheDocument();
  });

  it("shows a loading message while the databases are loading", async () => {
    vi.mocked(getDbNames).mockReturnValue(new Promise(() => {}));
    renderForm();
    const user = userEvent.setup();
    await screen.findByRole("option", { name: "pg-main" });

    await user.selectOptions(screen.getByLabelText("Deployment"), "pg-main");

    expect(await screen.findByText("Cargando…")).toBeInTheDocument();
  });

  it("shows the error when the databases cannot be loaded", async () => {
    vi.mocked(getDbNames).mockRejectedValue(new Error("Names down"));
    renderForm();
    const user = userEvent.setup();
    await screen.findByRole("option", { name: "pg-main" });

    await user.selectOptions(screen.getByLabelText("Deployment"), "pg-main");

    expect(await screen.findByText("Names down")).toBeInTheDocument();
  });

  it("reloads the databases and clears the selection when the deployment changes", async () => {
    vi.mocked(getDbNames).mockImplementation(async (_ns, deployment) =>
      deployment === "pg-main"
        ? [{ value: "orders", label: "orders" }]
        : [{ value: "billing", label: "billing" }],
    );
    renderForm();
    const user = userEvent.setup();
    await screen.findByRole("option", { name: "pg-main" });

    await user.selectOptions(screen.getByLabelText("Deployment"), "pg-main");
    await screen.findByRole("option", { name: "orders" });
    await user.selectOptions(screen.getByLabelText("Base de datos"), "orders");
    expect(screen.getByLabelText("Base de datos")).toHaveValue("orders");

    await user.selectOptions(screen.getByLabelText("Deployment"), "pg-alt");

    expect(await screen.findByRole("option", { name: "billing" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "orders" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Base de datos")).toHaveValue("");
    expect(getDbNames).toHaveBeenLastCalledWith("databases", "pg-alt", expect.any(AbortSignal));
  });
});
