import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDatabaseProvisioningTickets } from "./database-provisioning-ticket.service";
import { DatabaseProvisioningTicketList } from "./database-provisioning-ticket-list";

vi.mock("./database-provisioning-ticket.service");

afterEach(() => {
  vi.resetAllMocks();
});

const tickets = [
  { id: 101, number: 1, informer: "ana@corp.com", subject: "First subject", createdAt: "2024-03-05T12:00:00Z" },
  { id: 102, number: 2, informer: "bob@corp.com", subject: "Second subject", createdAt: "2024-03-07T12:00:00Z" },
] as never;

describe("DatabaseProvisioningTicketList", () => {
  it("shows the heading", () => {
    vi.mocked(getDatabaseProvisioningTickets).mockReturnValue(new Promise(() => {}));
    render(<DatabaseProvisioningTicketList />);

    expect(
      screen.getByRole("heading", { name: "Tickets de aprovisionamiento de base de datos" }),
    ).toBeInTheDocument();
  });

  it("shows a loading message while fetching", () => {
    vi.mocked(getDatabaseProvisioningTickets).mockReturnValue(new Promise(() => {}));
    render(<DatabaseProvisioningTicketList />);

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("renders every ticket with its number, subject, informer, id and date", async () => {
    vi.mocked(getDatabaseProvisioningTickets).mockResolvedValue(tickets);
    render(<DatabaseProvisioningTicketList />);

    expect(await screen.findByText("Ticket #1")).toBeInTheDocument();
    expect(screen.getByText("First subject")).toBeInTheDocument();
    expect(screen.getByText("Informante: ana@corp.com")).toBeInTheDocument();
    expect(screen.getByText("ID: 101")).toBeInTheDocument();
    expect(screen.getByText("5/3/2024")).toBeInTheDocument();
    expect(screen.getByText("Ticket #2")).toBeInTheDocument();
    expect(screen.getByText("Second subject")).toBeInTheDocument();
    expect(screen.getByText("Informante: bob@corp.com")).toBeInTheDocument();
    expect(screen.getByText("ID: 102")).toBeInTheDocument();
    expect(screen.getByText("7/3/2024")).toBeInTheDocument();
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
  });

  it("shows an empty message when there are no tickets", async () => {
    vi.mocked(getDatabaseProvisioningTickets).mockResolvedValue([]);
    render(<DatabaseProvisioningTicketList />);

    expect(
      await screen.findByText("Todavía no hay tickets creados."),
    ).toBeInTheDocument();
  });

  it("shows the error message when loading fails", async () => {
    vi.mocked(getDatabaseProvisioningTickets).mockRejectedValue(new Error("Forbidden"));
    render(<DatabaseProvisioningTicketList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Forbidden");
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
  });

  it("aborts the request when unmounted", () => {
    vi.mocked(getDatabaseProvisioningTickets).mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<DatabaseProvisioningTicketList />);

    const signal = vi.mocked(getDatabaseProvisioningTickets).mock.calls[0][0] as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
