import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import './global.css';
import Popup from './Popup';

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
