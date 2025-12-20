import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import PermGuard from './PermGuard';
import Popup from './Popup';

import '@/global.css';

const rootElem = document.getElementById('root');
if (!rootElem) throw new Error('Root element not found');
createRoot(rootElem).render(
	<StrictMode>
		<PermGuard>
			<Popup />
		</PermGuard>
	</StrictMode>
);
