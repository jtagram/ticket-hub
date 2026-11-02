'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import {
	createDatabaseProvisioningTicket,
	getAssignees,
	getDeployments,
} from '@/app/features/database-provisioning-ticket/database-provisioning-ticket.service';
import {
	DATABASE_PROVISIONING_TICKET_DEPARTMENT,
	DATABASE_PROVISIONING_TICKET_NAMESPACE,
} from '@/app/features/database-provisioning-ticket/database-provisioning-ticket-constants';
import { notifyError, notifySuccess } from '@/app/lib/notify';

interface ValueListItem {
	value: string;
	label: string;
}

interface DatabaseProvisioningTicketFormValues {
	assignee: string;
	subject: string;
	description: string;
	dbDeployment: string;
	newDbName: string;
}

interface DatabaseProvisioningTicketFormProps {
	informerEmail: string;
}

export function DatabaseProvisioningTicketForm({
	informerEmail,
}: DatabaseProvisioningTicketFormProps) {
	const [assignees, setAssignees] = useState<ValueListItem[] | null>(null);
	const [assigneesError, setAssigneesError] = useState<string | null>(null);

	const [deployments, setDeployments] = useState<ValueListItem[] | null>(null);
	const [deploymentsError, setDeploymentsError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		resetField,
		formState: { errors, isSubmitting, isValid },
	} = useForm<DatabaseProvisioningTicketFormValues>({
		mode: 'onChange',
		defaultValues: {
			assignee: '',
			subject: '',
			description: '',
			dbDeployment: '',
			newDbName: '',
		},
	});

	useEffect(() => {
		const controller = new AbortController();

		async function loadAssignees() {
			try {
				const loaded = await getAssignees(controller.signal);
				setAssignees(loaded);
			} catch (err) {
				if (controller.signal.aborted) return;
				setAssigneesError((err as Error).message);
			}
		}

		void loadAssignees();
		return () => controller.abort();
	}, []);

	useEffect(() => {
		const controller = new AbortController();

		async function loadDeployments() {
			try {
				const loaded = await getDeployments(
					DATABASE_PROVISIONING_TICKET_NAMESPACE,
					controller.signal,
				);
				setDeployments(loaded);
			} catch (err) {
				if (controller.signal.aborted) return;
				setDeploymentsError((err as Error).message);
			}
		}

		void loadDeployments();
		return () => controller.abort();
	}, []);

	const onSubmit = handleSubmit(async (data) => {
		try {
			await createDatabaseProvisioningTicket(data);

			notifySuccess('Ticket creado correctamente.');
			resetField('subject');
			resetField('description');
			resetField('newDbName');
		} catch (err) {
			notifyError((err as Error).message);
		}
	});

	return (
		<div style={{ maxWidth: 520 }}>
			<h2 className='h4 mb-4'>Solicitar aprovisionamiento de base de datos</h2>

			<Form onSubmit={onSubmit}>
				<Form.Group
					className='mb-3'
					controlId='informer'
				>
					<Form.Label>Informante</Form.Label>
					<Form.Control
						plaintext
						readOnly
						value={informerEmail}
					/>
				</Form.Group>

				<Form.Group
					className='mb-3'
					controlId='assignee'
				>
					<Form.Label className='required-label'>Responsable</Form.Label>
					<Form.Select
						aria-required='true'
						{...register('assignee', { required: true })}
					>
						<option
							value=''
							disabled
						>
							Seleccionar
						</option>
						{assignees?.map((item) => (
							<option
								key={item.value}
								value={item.value}
							>
								{item.label}
							</option>
						))}
					</Form.Select>
					{assigneesError && (
						<Alert
							variant='danger'
							className='mt-2'
						>
							{assigneesError}
						</Alert>
					)}
					{!assigneesError && assignees === null && (
						<Form.Text className='text-muted'>Cargando…</Form.Text>
					)}
				</Form.Group>

				<Form.Group
					className='mb-3'
					controlId='department'
				>
					<Form.Label>Departamento</Form.Label>
					<Form.Control
						plaintext
						readOnly
						value={DATABASE_PROVISIONING_TICKET_DEPARTMENT}
					/>
				</Form.Group>

				<Form.Group
					className='mb-3'
					controlId='subject'
				>
					<Form.Label className='required-label'>Asunto</Form.Label>
					<Form.Control
						aria-required='true'
						{...register('subject', {
							required: 'El asunto es obligatorio.',
							maxLength: { value: 500, message: 'Máximo 500 caracteres.' },
						})}
					/>
					{errors.subject && (
						<Form.Text className='text-danger'>{errors.subject.message}</Form.Text>
					)}
				</Form.Group>

				<Form.Group
					className='mb-3'
					controlId='description'
				>
					<Form.Label className='required-label'>Descripción</Form.Label>
					<Form.Control
						aria-required='true'
						as='textarea'
						rows={3}
						{...register('description', {
							required: 'La descripción es obligatoria.',
							maxLength: { value: 500, message: 'Máximo 500 caracteres.' },
						})}
					/>
					{errors.description && (
						<Form.Text className='text-danger'>{errors.description.message}</Form.Text>
					)}
				</Form.Group>

				<Form.Group
					className='mb-3'
					controlId='dbNamespace'
				>
					<Form.Label>Namespace</Form.Label>
					<Form.Control
						plaintext
						readOnly
						value={DATABASE_PROVISIONING_TICKET_NAMESPACE}
					/>
				</Form.Group>

				<Form.Group
					className='mb-3'
					controlId='dbDeployment'
				>
					<Form.Label className='required-label'>Deployment</Form.Label>
					<Form.Select
						aria-required='true'
						{...register('dbDeployment', { required: true })}
					>
						<option
							value=''
							disabled
						>
							Seleccionar
						</option>
						{deployments?.map((item) => (
							<option
								key={item.value}
								value={item.value}
							>
								{item.label}
							</option>
						))}
					</Form.Select>
					{deploymentsError && (
						<Alert
							variant='danger'
							className='mt-2'
						>
							{deploymentsError}
						</Alert>
					)}
					{!deploymentsError && deployments === null && (
						<Form.Text className='text-muted'>Cargando…</Form.Text>
					)}
				</Form.Group>

				<Form.Group
					className='mb-4'
					controlId='newDbName'
				>
					<Form.Label className='required-label'>Nombre de la nueva base de datos</Form.Label>
					<Form.Control
						aria-required='true'
						className='font-monospace'
						{...register('newDbName', {
							required: 'El nombre de la base de datos es obligatorio.',
							maxLength: { value: 63, message: 'Máximo 63 caracteres.' },
							pattern: {
								value: /^[a-z_][a-z0-9_]*$/,
								message:
									'Solo minúsculas, números y guion bajo (_), y no puede empezar con un número.',
							},
						})}
					/>
					{errors.newDbName && (
						<Form.Text className='text-danger'>{errors.newDbName.message}</Form.Text>
					)}
				</Form.Group>

				<Button
					type='submit'
					variant='dark'
					disabled={isSubmitting || !isValid}
				>
					{isSubmitting ? 'Enviando…' : 'Solicitar'}
				</Button>
			</Form>
		</div>
	);
}
