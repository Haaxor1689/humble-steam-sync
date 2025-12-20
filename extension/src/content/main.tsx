import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import Toast from './Toast';

import '@/global.css';
import './content.css';

const rootElem = document.createElement('div');
document.body.appendChild(rootElem);

ReactDOM.createRoot(rootElem).render(
	<StrictMode>
		<Toast />
	</StrictMode>
);
