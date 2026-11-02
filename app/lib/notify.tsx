import { toast, Toaster } from 'sonner';

export function AppNotifications() {
	return (
		<Toaster
			position='top-right'
			richColors
		/>
	);
}

export const notifySuccess = (message: string) => toast.success(message);
export const notifyError = (message: string) => toast.error(message, { duration: 8000 });
