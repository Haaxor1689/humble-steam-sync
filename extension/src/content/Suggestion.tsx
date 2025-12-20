import { useState } from 'react';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Spinner from '@/components/Spinner';
import useField from '@/utils/useField';
import { type ApiMethodsReturn } from '@/worker';
import { callApi } from '@/worker/helpers';

type Props = { close: () => void };

const Suggestion = ({ close }: Props) => {
	const steamName = useField('steam_name');
	const humbleName = useField('humble_name');

	const [loading, setLoading] = useState(false);
	const [response, setResponse] =
		useState<Awaited<ApiMethodsReturn<'suggestTag'>>>();

	return (
		<form
			onSubmit={async e => {
				e.preventDefault();
				setLoading(true);
				setResponse(undefined);
				await callApi('suggestTag', {
					steam_name: steamName.props.value,
					humble_name: humbleName.props.value
				})
					.then(setResponse)
					.finally(() => setLoading(false));
			}}
			className="hss-background relative flex max-w-sm flex-col items-start gap-2 p-3"
		>
			{loading && (
				<div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center backdrop-blur-sm">
					<Spinner />
				</div>
			)}

			<h2 className="text-2xl text-white">Submit missing tag</h2>

			<p className="text-xs">
				Using this dialog, you can suggest missing tags to be added. Please
				provide full names of the product as they are displayed on Steam store
				and Humble Bundle pages.
			</p>

			<label htmlFor={steamName.props.id}>Steam name</label>
			<Input {...steamName.props} />

			<label htmlFor={humbleName.props.id}>Humble bundle name</label>
			<Input {...humbleName.props} />

			<div className="flex items-center justify-end gap-2 self-stretch">
				{response?.status === 'created' && (
					<p className="text-primary">Successfully submitted</p>
				)}
				{response?.status === 'badRequest' && (
					<p className="text-primary">Both fields are required</p>
				)}
				{response?.status === 'created' ? (
					<Button onClick={close}>Close</Button>
				) : (
					<Button type="submit">Submit tag</Button>
				)}
			</div>
		</form>
	);
};

export default Suggestion;
