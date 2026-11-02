import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HomeShell } from '../home-shell';

vi.mock('@/app/features/database-management-ticket/database-management-ticket-form', () => ({
	DatabaseManagementTicketForm: ({ informerEmail }: { informerEmail: string }) => (
		<div>stub:request-database-management:{informerEmail}</div>
	),
}));
vi.mock('@/app/features/database-management-ticket/database-management-ticket-list', () => ({
	DatabaseManagementTicketList: () => <div>stub:view-database-management-tickets</div>,
}));
vi.mock('@/app/features/database-management-ticket/database-management-ticket-search', () => ({
	DatabaseManagementTicketSearch: () => <div>stub:search-database-management-ticket</div>,
}));
vi.mock('@/app/features/database-provisioning-ticket/database-provisioning-ticket-form', () => ({
	DatabaseProvisioningTicketForm: ({ informerEmail }: { informerEmail: string }) => (
		<div>stub:request-database-provisioning:{informerEmail}</div>
	),
}));
vi.mock('@/app/features/database-provisioning-ticket/database-provisioning-ticket-list', () => ({
	DatabaseProvisioningTicketList: () => <div>stub:view-database-provisioning-tickets</div>,
}));
vi.mock('@/app/features/database-provisioning-ticket/database-provisioning-ticket-search', () => ({
	DatabaseProvisioningTicketSearch: () => <div>stub:search-database-provisioning-ticket</div>,
}));
vi.mock('@/app/features/server-management-ticket/server-management-ticket-form', () => ({
	ServerManagementTicketForm: ({ informerEmail }: { informerEmail: string }) => (
		<div>stub:request-server-management:{informerEmail}</div>
	),
}));
vi.mock('@/app/features/server-management-ticket/server-management-ticket-list', () => ({
	ServerManagementTicketList: () => <div>stub:view-server-management-tickets</div>,
}));
vi.mock('@/app/features/server-management-ticket/server-management-ticket-search', () => ({
	ServerManagementTicketSearch: () => <div>stub:search-server-management-ticket</div>,
}));
vi.mock('@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-form', () => ({
	KubernetesManifestTicketForm: ({ informerEmail }: { informerEmail: string }) => (
		<div>stub:request-kubernetes-manifest:{informerEmail}</div>
	),
}));
vi.mock('@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-list', () => ({
	KubernetesManifestTicketList: () => <div>stub:view-kubernetes-manifest-tickets</div>,
}));
vi.mock('@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-search', () => ({
	KubernetesManifestTicketSearch: () => <div>stub:search-kubernetes-manifest-ticket</div>,
}));
vi.mock('@/app/features/kubectl-command-ticket/kubectl-command-ticket-form', () => ({
	KubectlCommandTicketForm: ({ informerEmail }: { informerEmail: string }) => (
		<div>stub:request-kubectl-command:{informerEmail}</div>
	),
}));
vi.mock('@/app/features/kubectl-command-ticket/kubectl-command-ticket-list', () => ({
	KubectlCommandTicketList: () => <div>stub:view-kubectl-command-tickets</div>,
}));
vi.mock('@/app/features/kubectl-command-ticket/kubectl-command-ticket-search', () => ({
	KubectlCommandTicketSearch: () => <div>stub:search-kubectl-command-ticket</div>,
}));

const NAV_ITEMS = [
	{ id: 'request-database-management', label: 'Solicitar gestión de base de datos' },
	{ id: 'view-database-management-tickets', label: 'Ver ticket de gestión de base de datos' },
	{ id: 'search-database-management-ticket', label: 'Buscar ticket de gestión de base de datos' },
	{ id: 'request-database-provisioning', label: 'Solicitar aprovisionamiento de base de datos' },
	{
		id: 'view-database-provisioning-tickets',
		label: 'Ver tickets de aprovisionamiento de base de datos',
	},
	{
		id: 'search-database-provisioning-ticket',
		label: 'Buscar ticket de aprovisionamiento de base de datos',
	},
	{ id: 'request-server-management', label: 'Solicitar gestión de servidor' },
	{ id: 'view-server-management-tickets', label: 'Ver tickets de gestión de servidor' },
	{ id: 'search-server-management-ticket', label: 'Buscar ticket de gestión de servidor' },
	{ id: 'request-kubernetes-manifest', label: 'Solicitar gestión de manifiestos de Kubernetes' },
	{
		id: 'view-kubernetes-manifest-tickets',
		label: 'Ver tickets de gestión de manifiestos de Kubernetes',
	},
	{
		id: 'search-kubernetes-manifest-ticket',
		label: 'Buscar ticket de gestión de manifiestos de Kubernetes',
	},
	{ id: 'request-kubectl-command', label: 'Solicitar ejecución de comando kubectl' },
	{ id: 'view-kubectl-command-tickets', label: 'Ver tickets de ejecución de comando kubectl' },
	{ id: 'search-kubectl-command-ticket', label: 'Buscar ticket de ejecución de comando kubectl' },
];

// Forms receive the informer email, so their stub text carries it.
function expectedStub(id: string) {
	return id.startsWith('request-') ? `stub:${id}:informer@corp.com` : `stub:${id}`;
}

describe('HomeShell', () => {
	it('renders every navigation entry', () => {
		render(<HomeShell informerEmail='informer@corp.com' />);

		for (const item of NAV_ITEMS) {
			expect(screen.getByRole('tab', { name: item.label })).toBeInTheDocument();
		}
	});

	it('renders every accordion group', () => {
		render(<HomeShell informerEmail='informer@corp.com' />);

		for (const title of ['Base de datos', 'Servidor', 'Kubernetes']) {
			expect(screen.getByRole('button', { name: title })).toBeInTheDocument();
		}
	});

	it('shows the first navigation item by default', () => {
		render(<HomeShell informerEmail='informer@corp.com' />);

		expect(screen.getByText(expectedStub(NAV_ITEMS[0].id))).toBeInTheDocument();
	});

	it.each(NAV_ITEMS)('shows the matching view when selecting $label', async (item) => {
		render(<HomeShell informerEmail='informer@corp.com' />);

		await userEvent.setup().click(screen.getByRole('tab', { name: item.label }));

		expect(screen.getByText(expectedStub(item.id))).toBeInTheDocument();
		expect(screen.getAllByText(/^stub:/)).toHaveLength(1);
	});
});
