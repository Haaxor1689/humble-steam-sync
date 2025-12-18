import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Popup from './Popup';

import '@/global.css';

export const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 0 } }
});

const rootElem = document.getElementById('root');
if (!rootElem) throw new Error('Root element not found');
createRoot(rootElem).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<Popup />
		</QueryClientProvider>
	</StrictMode>
);
