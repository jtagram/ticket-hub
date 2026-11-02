'use client';

import type { ReactNode } from 'react';
import { Accordion, Col, Nav, Row, Tab } from 'react-bootstrap';

import { DatabaseManagementTicketForm } from '@/app/features/database-management-ticket/database-management-ticket-form';
import { DatabaseManagementTicketList } from '@/app/features/database-management-ticket/database-management-ticket-list';
import { DatabaseManagementTicketSearch } from '@/app/features/database-management-ticket/database-management-ticket-search';
import { DatabaseProvisioningTicketForm } from '@/app/features/database-provisioning-ticket/database-provisioning-ticket-form';
import { DatabaseProvisioningTicketList } from '@/app/features/database-provisioning-ticket/database-provisioning-ticket-list';
import { DatabaseProvisioningTicketSearch } from '@/app/features/database-provisioning-ticket/database-provisioning-ticket-search';
import { KubectlCommandTicketForm } from '@/app/features/kubectl-command-ticket/kubectl-command-ticket-form';
import { KubectlCommandTicketList } from '@/app/features/kubectl-command-ticket/kubectl-command-ticket-list';
import { KubectlCommandTicketSearch } from '@/app/features/kubectl-command-ticket/kubectl-command-ticket-search';
import { KubernetesManifestTicketForm } from '@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-form';
import { KubernetesManifestTicketList } from '@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-list';
import { KubernetesManifestTicketSearch } from '@/app/features/kubernetes-manifest-ticket/kubernetes-manifest-ticket-search';
import { ServerManagementTicketForm } from '@/app/features/server-management-ticket/server-management-ticket-form';
import { ServerManagementTicketList } from '@/app/features/server-management-ticket/server-management-ticket-list';
import { ServerManagementTicketSearch } from '@/app/features/server-management-ticket/server-management-ticket-search';
import { NAV_GROUPS, NAV_ITEMS, type NavItemId } from '@/app/lib/nav-items';

interface HomeShellProps {
	informerEmail: string;
}

export function HomeShell({ informerEmail }: HomeShellProps) {
	const defaultItem = NAV_ITEMS[0];
	const defaultGroup = NAV_GROUPS.find((group) =>
		group.items.some((item) => item.id === defaultItem.id),
	);

	const views: Record<NavItemId, ReactNode> = {
		'request-database-management': <DatabaseManagementTicketForm informerEmail={informerEmail} />,
		'view-database-management-tickets': <DatabaseManagementTicketList />,
		'search-database-management-ticket': <DatabaseManagementTicketSearch />,
		'request-database-provisioning': (
			<DatabaseProvisioningTicketForm informerEmail={informerEmail} />
		),
		'view-database-provisioning-tickets': <DatabaseProvisioningTicketList />,
		'search-database-provisioning-ticket': <DatabaseProvisioningTicketSearch />,
		'request-server-management': <ServerManagementTicketForm informerEmail={informerEmail} />,
		'view-server-management-tickets': <ServerManagementTicketList />,
		'search-server-management-ticket': <ServerManagementTicketSearch />,
		'request-kubernetes-manifest': <KubernetesManifestTicketForm informerEmail={informerEmail} />,
		'view-kubernetes-manifest-tickets': <KubernetesManifestTicketList />,
		'search-kubernetes-manifest-ticket': <KubernetesManifestTicketSearch />,
		'request-kubectl-command': <KubectlCommandTicketForm informerEmail={informerEmail} />,
		'view-kubectl-command-tickets': <KubectlCommandTicketList />,
		'search-kubectl-command-ticket': <KubectlCommandTicketSearch />,
	};

	return (
		<Tab.Container
			defaultActiveKey={defaultItem.id}
			transition={false}
		>
			<Row className='flex-grow-1 flex-nowrap g-0 overflow-hidden'>
				<Col
					md={3}
					className='border-end bg-light p-3 overflow-auto'
				>
					<Accordion
						defaultActiveKey={defaultGroup ? [defaultGroup.title] : []}
						alwaysOpen
						flush
						className='sidebar-accordion'
					>
						{NAV_GROUPS.map((group) => (
							<Accordion.Item
								key={group.title}
								eventKey={group.title}
							>
								<Accordion.Header>{group.title}</Accordion.Header>
								<Accordion.Body>
									<Nav
										variant='pills'
										className='flex-column flex-nowrap'
									>
										{group.items.map((item) => (
											<Nav.Item
												key={item.id}
												className='mb-1'
											>
												<Nav.Link eventKey={item.id}>{item.label}</Nav.Link>
											</Nav.Item>
										))}
									</Nav>
								</Accordion.Body>
							</Accordion.Item>
						))}
					</Accordion>
				</Col>

				<Col
					md={9}
					className='p-4 overflow-auto'
				>
					<Tab.Content>
						{NAV_ITEMS.map((item) => (
							<Tab.Pane
								key={item.id}
								eventKey={item.id}
								mountOnEnter
								unmountOnExit
							>
								{views[item.id]}
							</Tab.Pane>
						))}
					</Tab.Content>
				</Col>
			</Row>
		</Tab.Container>
	);
}
