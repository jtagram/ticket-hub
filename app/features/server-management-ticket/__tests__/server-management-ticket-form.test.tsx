import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createServerManagementTicket,
  getAssignees,
} from "../server-management-ticket.service";
import { ServerManagementTicketForm } from "../server-management-ticket-form";

vi.mock("../server-management-ticket.service");

beforeEach(() => {
  vi.mocked(getAssignees).mockResolvedValue([
    { value: "ana@corp.com", label: "Ana" },
    { value: "bob@corp.com", label: "Bob" },
  ]);
});

afterEach(() => {
  vi.resetAllMocks();
});

function renderForm() {
  return render(<ServerManagementTicketForm informerEmail="informer@corp.com" />);
}

async function fillForm() {
  const user = userEvent.setup();
  await screen.findByRole("option", { name: "Ana" });
  await user.selectOptions(screen.getByLabelText("Responsable"), "ana@corp.com");
  await user.type(screen.getByLabelText("Asunto"), "Add index");
  await user.type(screen.getByLabelText("Descripción"), "Needs an index");
  await user.type(screen.getByLabelText("Código Ansible"), "- hosts: all");
  return user;
}

describe("ServerManagementTicketForm", () => {
  it("shows the heading, the informer and the fixed fields", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Solicitar gestión de servidor" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Informante")).toHaveValue("informer@corp.com");
    expect(screen.getByLabelText("Informante")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Departamento")).toHaveValue("SERVIDORES");
    expect(screen.getByLabelText("Departamento")).toHaveAttribute("readonly");
  });

  it("loads the assignees with an abort signal and lists them", async () => {
    renderForm();

    expect(await screen.findByRole("option", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bob" })).toBeInTheDocument();
    expect(getAssignees).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("shows a loading message until the value lists are loaded", async () => {
    vi.mocked(getAssignees).mockReturnValue(new Promise(() => {}));
    renderForm();

    expect(screen.getAllByText("Cargando…")).toHaveLength(1);
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
    vi.mocked(createServerManagementTicket).mockResolvedValue(undefined);
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(
      await screen.findByText("Ticket creado correctamente."),
    ).toBeInTheDocument();
    expect(createServerManagementTicket).toHaveBeenCalledWith({
      assignee: "ana@corp.com",
      subject: "Add index",
      description: "Needs an index",
      codeAnsible: "- hosts: all",
    });
    expect(screen.getByLabelText("Asunto")).toHaveValue("");
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
    expect(screen.getByLabelText("Código Ansible")).toHaveValue("");
    expect(screen.getByLabelText("Responsable")).toHaveValue("ana@corp.com");
  });

  it("shows the error when creation fails", async () => {
    vi.mocked(createServerManagementTicket).mockRejectedValue(new Error("Duplicated"));
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("Duplicated")).toBeInTheDocument();
    expect(screen.queryByText("Ticket creado correctamente.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Asunto")).toHaveValue("Add index");
  });

  it("clears a previous success message when submitting again", async () => {
    vi.mocked(createServerManagementTicket)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Duplicated"));
    renderForm();

    const user = await fillForm();
    await user.click(screen.getByRole("button", { name: "Solicitar" }));
    expect(await screen.findByText("Ticket creado correctamente.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Asunto"), "Again");
    await user.type(screen.getByLabelText("Descripción"), "Again");
    await user.type(screen.getByLabelText("Código Ansible"), "- hosts: web");
    await user.click(screen.getByRole("button", { name: "Solicitar" }));

    expect(await screen.findByText("Duplicated")).toBeInTheDocument();
    expect(screen.queryByText("Ticket creado correctamente.")).not.toBeInTheDocument();
  });

  it("shows a submitting label while the request is pending", async () => {
    let resolveCreate!: () => void;
    vi.mocked(createServerManagementTicket).mockReturnValue(
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
    const { unmount } = renderForm();

    const signal = vi.mocked(getAssignees).mock.calls[0][0] as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
