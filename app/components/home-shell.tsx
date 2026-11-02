'use client';

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

interface HomeShellProps {
	informerEmail: string;
}

export function HomeShell({ informerEmail }: HomeShellProps) {
	return (
		<Tab.Container
			defaultActiveKey='request-database-management'
			transition={false}
		>
			<Row className='flex-grow-1 flex-nowrap g-0 overflow-hidden'>
				<Col
					md={3}
					className='border-end bg-light p-3 overflow-auto'
				>
					<Accordion
						defaultActiveKey={['database']}
						alwaysOpen
						flush
						className='sidebar-accordion'
					>
						<Accordion.Item eventKey='database'>
							<Accordion.Header>Base de datos</Accordion.Header>
							<Accordion.Body>
								<Nav
									variant='pills'
									className='flex-column flex-nowrap'
								>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='request-database-management'>
											Solicitar gestión de base de datos
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='view-database-management-tickets'>
											Ver ticket de gestión de base de datos
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='search-database-management-ticket'>
											Buscar ticket de gestión de base de datos
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='request-database-provisioning'>
											Solicitar aprovisionamiento de base de datos
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='view-database-provisioning-tickets'>
											Ver tickets de aprovisionamiento de base de datos
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='search-database-provisioning-ticket'>
											Buscar ticket de aprovisionamiento de base de datos
										</Nav.Link>
									</Nav.Item>
								</Nav>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey='server'>
							<Accordion.Header>Servidor</Accordion.Header>
							<Accordion.Body>
								<Nav
									variant='pills'
									className='flex-column flex-nowrap'
								>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='request-server-management'>
											Solicitar gestión de servidor
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='view-server-management-tickets'>
											Ver tickets de gestión de servidor
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='search-server-management-ticket'>
											Buscar ticket de gestión de servidor
										</Nav.Link>
									</Nav.Item>
								</Nav>
							</Accordion.Body>
						</Accordion.Item>

						<Accordion.Item eventKey='kubernetes'>
							<Accordion.Header>Kubernetes</Accordion.Header>
							<Accordion.Body>
								<Nav
									variant='pills'
									className='flex-column flex-nowrap'
								>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='request-kubernetes-manifest'>
											Solicitar gestión de manifiestos de Kubernetes
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='view-kubernetes-manifest-tickets'>
											Ver tickets de gestión de manifiestos de Kubernetes
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='search-kubernetes-manifest-ticket'>
											Buscar ticket de gestión de manifiestos de Kubernetes
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='request-kubectl-command'>
											Solicitar ejecución de comando kubectl
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='view-kubectl-command-tickets'>
											Ver tickets de ejecución de comando kubectl
										</Nav.Link>
									</Nav.Item>
									<Nav.Item className='mb-1'>
										<Nav.Link eventKey='search-kubectl-command-ticket'>
											Buscar ticket de ejecución de comando kubectl
										</Nav.Link>
									</Nav.Item>
								</Nav>
							</Accordion.Body>
						</Accordion.Item>
					</Accordion>
				</Col>

				<Col
					md={9}
					className='p-4 overflow-auto'
				>
					<Tab.Content>
						<Tab.Pane
							eventKey='request-database-management'
							mountOnEnter
							unmountOnExit
						>
							<DatabaseManagementTicketForm informerEmail={informerEmail} />
						</Tab.Pane>
						<Tab.Pane
							eventKey='view-database-management-tickets'
							mountOnEnter
							unmountOnExit
						>
							<DatabaseManagementTicketList />
						</Tab.Pane>
						<Tab.Pane
							eventKey='search-database-management-ticket'
							mountOnEnter
							unmountOnExit
						>
							<DatabaseManagementTicketSearch />
						</Tab.Pane>
						<Tab.Pane
							eventKey='request-database-provisioning'
							mountOnEnter
							unmountOnExit
						>
							<DatabaseProvisioningTicketForm informerEmail={informerEmail} />
						</Tab.Pane>
						<Tab.Pane
							eventKey='view-database-provisioning-tickets'
							mountOnEnter
							unmountOnExit
						>
							<DatabaseProvisioningTicketList />
						</Tab.Pane>
						<Tab.Pane
							eventKey='search-database-provisioning-ticket'
							mountOnEnter
							unmountOnExit
						>
							<DatabaseProvisioningTicketSearch />
						</Tab.Pane>
						<Tab.Pane
							eventKey='request-server-management'
							mountOnEnter
							unmountOnExit
						>
							<ServerManagementTicketForm informerEmail={informerEmail} />
						</Tab.Pane>
						<Tab.Pane
							eventKey='view-server-management-tickets'
							mountOnEnter
							unmountOnExit
						>
							<ServerManagementTicketList />
						</Tab.Pane>
						<Tab.Pane
							eventKey='search-server-management-ticket'
							mountOnEnter
							unmountOnExit
						>
							<ServerManagementTicketSearch />
						</Tab.Pane>
						<Tab.Pane
							eventKey='request-kubernetes-manifest'
							mountOnEnter
							unmountOnExit
						>
							<KubernetesManifestTicketForm informerEmail={informerEmail} />
						</Tab.Pane>
						<Tab.Pane
							eventKey='view-kubernetes-manifest-tickets'
							mountOnEnter
							unmountOnExit
						>
							<KubernetesManifestTicketList />
						</Tab.Pane>
						<Tab.Pane
							eventKey='search-kubernetes-manifest-ticket'
							mountOnEnter
							unmountOnExit
						>
							<KubernetesManifestTicketSearch />
						</Tab.Pane>
						<Tab.Pane
							eventKey='request-kubectl-command'
							mountOnEnter
							unmountOnExit
						>
							<KubectlCommandTicketForm informerEmail={informerEmail} />
						</Tab.Pane>
						<Tab.Pane
							eventKey='view-kubectl-command-tickets'
							mountOnEnter
							unmountOnExit
						>
							<KubectlCommandTicketList />
						</Tab.Pane>
						<Tab.Pane
							eventKey='search-kubectl-command-ticket'
							mountOnEnter
							unmountOnExit
						>
							<KubectlCommandTicketSearch />
						</Tab.Pane>
					</Tab.Content>
				</Col>
			</Row>
		</Tab.Container>
	);
}
