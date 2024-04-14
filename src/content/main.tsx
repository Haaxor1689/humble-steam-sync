import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../global.css';
import './content.css';

import Toast from './Toast';

const rootElem = document.createElement('div');
document.body.appendChild(rootElem);

export const queryClient = new QueryClient({
	defaultOptions: { queries: { refetchOnWindowFocus: false } }
});

ReactDOM.createRoot(rootElem).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<Toast />
		</QueryClientProvider>
	</StrictMode>
);
