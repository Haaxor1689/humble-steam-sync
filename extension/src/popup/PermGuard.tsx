import { type PropsWithChildren } from 'react';
import { AlertTriangle, Unlock } from 'lucide-react';

import Button from '@/components/Button';
import Spinner from '@/components/Spinner';
import usePermissions from '@/utils/usePermissions';

const PermGuard = ({ children }: PropsWithChildren) => {
	const { hasAll, loading, request } = usePermissions();

	if (loading)
		return (
			<div className="flex aspect-video w-screen items-center justify-center">
				<Spinner />
			</div>
		);

	if (!hasAll)
		return (
			<div className="flex items-center gap-2">
				<AlertTriangle size={48} />
				<p className="text-center font-semibold">
					Please, grant all required permissions to this extension, for it to
					function properly
				</p>
				<Button title="Grant permissions" onClick={request}>
					<Unlock size={18} />
				</Button>
			</div>
		);

	return children;
};

export default PermGuard;
