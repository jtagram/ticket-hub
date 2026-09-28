"use client";

import { useState } from "react";
import { NAV_ITEMS, type NavItemId } from "@/app/lib/nav-items";
import { DatabaseManagementTicketForm } from "@/app/features/database-management-ticket/database-management-ticket-form";
import { DatabaseManagementTicketList } from "@/app/features/database-management-ticket/database-management-ticket-list";
import { DatabaseManagementTicketSearch } from "@/app/features/database-management-ticket/database-management-ticket-search";
import { DatabaseProvisioningTicketForm } from "@/app/features/database-provisioning-ticket/database-provisioning-ticket-form";
import { DatabaseProvisioningTicketList } from "@/app/features/database-provisioning-ticket/database-provisioning-ticket-list";
import { DatabaseProvisioningTicketSearch } from "@/app/features/database-provisioning-ticket/database-provisioning-ticket-search";
import { ServerManagementTicketForm } from "@/app/features/server-management-ticket/server-management-ticket-form";
import { ServerManagementTicketList } from "@/app/features/server-management-ticket/server-management-ticket-list";
import { ServerManagementTicketSearch } from "@/app/features/server-management-ticket/server-management-ticket-search";
import { KubernetesManifestTicketForm } from "@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-form";
import { KubernetesManifestTicketList } from "@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-list";
import { KubernetesManifestTicketSearch } from "@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-search";
import { KubectlCommandTicketForm } from "@/app/features/kubectl-command-ticket/kubectl-command-ticket-form";
import { KubectlCommandTicketList } from "@/app/features/kubectl-command-ticket/kubectl-command-ticket-list";
import { KubectlCommandTicketSearch } from "@/app/features/kubectl-command-ticket/kubectl-command-ticket-search";

interface HomeShellProps {
  informerEmail: string;
}

export function HomeShell({ informerEmail }: HomeShellProps) {
  const [selected, setSelected] = useState<NavItemId>(NAV_ITEMS[0].id);

  return (
    <div className="flex flex-1">
      <aside className="w-64 shrink-0 border-r border-black/[.08] bg-zinc-50 p-4 dark:border-white/[.145] dark:bg-zinc-950">
        <nav>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item.id)}
                  aria-current={selected === item.id ? "page" : undefined}
                  className={`w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selected === item.id
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-zinc-700 hover:bg-black/[.05] dark:text-zinc-300 dark:hover:bg-white/[.08]"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {selected === "request-database-management" && (
          <DatabaseManagementTicketForm informerEmail={informerEmail} />
        )}
        {selected === "view-database-management-tickets" && (
          <DatabaseManagementTicketList />
        )}
        {selected === "search-database-management-ticket" && (
          <DatabaseManagementTicketSearch />
        )}
        {selected === "request-database-provisioning" && (
          <DatabaseProvisioningTicketForm informerEmail={informerEmail} />
        )}
        {selected === "view-database-provisioning-tickets" && (
          <DatabaseProvisioningTicketList />
        )}
        {selected === "search-database-provisioning-ticket" && (
          <DatabaseProvisioningTicketSearch />
        )}
        {selected === "request-server-management" && (
          <ServerManagementTicketForm informerEmail={informerEmail} />
        )}
        {selected === "view-server-management-tickets" && (
          <ServerManagementTicketList />
        )}
        {selected === "search-server-management-ticket" && (
          <ServerManagementTicketSearch />
        )}
        {selected === "request-kubernetes-manifest" && (
          <KubernetesManifestTicketForm informerEmail={informerEmail} />
        )}
        {selected === "view-kubernetes-manifest-tickets" && (
          <KubernetesManifestTicketList />
        )}
        {selected === "search-kubernetes-manifest-ticket" && (
          <KubernetesManifestTicketSearch />
        )}
        {selected === "request-kubectl-command" && (
          <KubectlCommandTicketForm informerEmail={informerEmail} />
        )}
        {selected === "view-kubectl-command-tickets" && (
          <KubectlCommandTicketList />
        )}
        {selected === "search-kubectl-command-ticket" && (
          <KubectlCommandTicketSearch />
        )}
      </main>
    </div>
  );
}
