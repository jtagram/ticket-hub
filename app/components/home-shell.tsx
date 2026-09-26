"use client";

import { useState } from "react";
import { NAV_ITEMS, type NavItemId } from "@/app/lib/nav-items";
import { DatabaseManagementTicketForm } from "@/app/components/database-management-ticket-form";
import { DatabaseManagementTicketList } from "@/app/components/database-management-ticket-list";
import { DatabaseManagementTicketSearch } from "@/app/components/database-management-ticket-search";
import { DatabaseProvisioningTicketForm } from "@/app/components/database-provisioning-ticket-form";
import { DatabaseProvisioningTicketList } from "@/app/components/database-provisioning-ticket-list";
import { DatabaseProvisioningTicketSearch } from "@/app/components/database-provisioning-ticket-search";
import { ServerManagementTicketForm } from "@/app/components/server-management-ticket-form";
import { ServerManagementTicketList } from "@/app/components/server-management-ticket-list";
import { ServerManagementTicketSearch } from "@/app/components/server-management-ticket-search";
import { KubernetesManifestTicketForm } from "@/app/components/kubernetes-manifest-ticket-form";
import { KubernetesManifestTicketList } from "@/app/components/kubernetes-manifest-ticket-list";
import { KubernetesManifestTicketSearch } from "@/app/components/kubernetes-manifest-ticket-search";

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
      </main>
    </div>
  );
}
