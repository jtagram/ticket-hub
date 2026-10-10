import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDatabaseProvisioningTicket,
  getAssignees,
  getDeployments,
} from "../database-provisioning-ticket.service";
import { DatabaseProvisioningTicketForm } from "../database-provisioning-ticket-form";

vi.mock("../database-provisioning-ticket.service");

beforeEach(() => {
  vi.mocked(getAssignees).mockResolvedValue([
    { value: "ana@corp.com", label: "Ana" },
    { value: "bob@corp.com", label: "Bob" },
  ]);
  vi.mocked(getDeployments).mockResolvedValue([
    { value: "pg-main", label: "pg-main" },
    { value: "pg-alt", label: "pg-alt" },
  ]);
});

afterEach(() => {
  vi.resetAllMocks();
});

function renderForm() {
  return render(<DatabaseProvisioningTicketForm informerEmail="informer@corp.com" />);
}

async function fillForm(newDbName = "new_db") {
  const user = userEvent.setup();
  await screen.findByRole("option", { name: "Ana" });
  await user.selectOptions(screen.getByLabelText("Responsable"), "ana@corp.com");
  await user.type(screen.getByLabelText("Asunto"), "Add index");
  await user.type(screen.getByLabelText("Descripción"), "Needs an index");
  await screen.findByRole("option", { name: "pg-main" });
  await user.selectOptions(screen.getByLabelText("Deployment"), "pg-main");
  await user.type(screen.getByLabelText("Nombre de la nueva base de datos"), newDbName);
  return user;
}

describe("DatabaseProvisioningTicketForm", () => {
  it("shows the heading, the informer and the fixed fields", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Solicitar aprovisionamiento de base de datos" }),
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
    vi.mocked(createDatabaseProvisioningTicket).mockResolvedValue(undefined);
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(
      await screen.findByText("Ticket creado correctamente."),
    ).toBeInTheDocument();
    expect(createDatabaseProvisioningTicket).toHaveBeenCalledWith({
      assignee: "ana@corp.com",
      subject: "Add index",
      description: "Needs an index",
      dbDeployment: "pg-main",
      newDbName: "new_db",
    });
    expect(screen.getByLabelText("Asunto")).toHaveValue("");
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
    expect(screen.getByLabelText("Nombre de la nueva base de datos")).toHaveValue("");
    expect(screen.getByLabelText("Deployment")).toHaveValue("pg-main");
    expect(screen.getByLabelText("Responsable")).toHaveValue("ana@corp.com");
  });

  it("shows the error when creation fails", async () => {
    vi.mocked(createDatabaseProvisioningTicket).mockRejectedValue(new Error("Duplicated"));
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("Duplicated")).toBeInTheDocument();
    expect(screen.queryByText("Ticket creado correctamente.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Asunto")).toHaveValue("Add index");
  });

  it("clears a previous success message when submitting again", async () => {
    vi.mocked(createDatabaseProvisioningTicket)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Duplicated"));
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));
    expect(await screen.findByText("Ticket creado correctamente.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Asunto"), "Again");
    await user.type(screen.getByLabelText("Descripción"), "Again");
    await user.type(screen.getByLabelText("Nombre de la nueva base de datos"), "other_db");
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("Duplicated")).toBeInTheDocument();
    expect(screen.queryByText("Ticket creado correctamente.")).not.toBeInTheDocument();
  });

  it("shows a submitting label while the request is pending", async () => {
    let resolveCreate!: () => void;
    vi.mocked(createDatabaseProvisioningTicket).mockReturnValue(
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

  it.each(["Upper", "1abc", "has-dash", "a".repeat(64)])(
    "keeps the form invalid for the database name %j",
    async (name) => {
      renderForm();

      await fillForm(name);

      await waitFor(() =>
        expect(screen.getByLabelText("Nombre de la nueva base de datos")).toHaveValue(name),
      );
      expect(screen.getByRole("button", { name: "Solicitar" })).toBeDisabled();
    },
  );

  it.each(["new_db", "_internal", "db1", "a".repeat(63)])(
    "accepts the database name %j",
    async (name) => {
      renderForm();

      await fillForm(name);

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Solicitar" })).toBeEnabled(),
      );
    },
  );

  it("requires the database name", async () => {
    renderForm();
    const user = userEvent.setup();
    const input = screen.getByLabelText("Nombre de la nueva base de datos");

    await user.type(input, "x");
    await user.clear(input);

    expect(
      await screen.findByText("El nombre de la base de datos es obligatorio."),
    ).toHaveClass("text-danger");
  });

  it.each(["Upper", "1abc", "has-dash"])(
    "explains the allowed format for the database name %j",
    async (name) => {
      renderForm();

      await fillForm(name);

      expect(
        await screen.findByText(
          "Solo minúsculas, números y guion bajo (_), y no puede empezar con un número.",
        ),
      ).toHaveClass("text-danger");
    },
  );

  it("explains the maximum length for the database name", async () => {
    renderForm();

    await fillForm("a".repeat(64));

    expect(await screen.findByText("Máximo 63 caracteres.")).toHaveClass("text-danger");
  });

  it("shows no database name message for a valid name", async () => {
    renderForm();

    await fillForm("new_db");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Solicitar" })).toBeEnabled(),
    );
    expect(screen.queryByText(/Solo minúsculas/)).not.toBeInTheDocument();
    expect(screen.queryByText("Máximo 63 caracteres.")).not.toBeInTheDocument();
  });
});
