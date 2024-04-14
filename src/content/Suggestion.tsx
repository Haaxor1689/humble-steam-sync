import { useMutation } from '@tanstack/react-query';

import Button from '../components/Button';
import useField from '../utils/useField';
import Spinner from '../components/Spinner';
import { type ApiMethodsData } from '../worker';
import { sendWorkerMessage } from '../worker/helpers';
import Input from '../components/Input';

type Props = { close: () => void };

const Suggestion = ({ close }: Props) => {
	const suggest = useMutation((...args: ApiMethodsData<'suggestTag'>) =>
		sendWorkerMessage('suggestTag', ...args)
	);

	const steamName = useField('steam_name');
	const humbleName = useField('humble_name');

	return (
		<form
			onSubmit={async e => {
				e.preventDefault();
				if (suggest.isLoading) return;
				await suggest.mutateAsync({
					steam_name: steamName.props.value,
					humble_name: humbleName.props.value
				});
			}}
			className="hss-background relative flex max-w-sm flex-col items-start gap-2 p-3"
		>
			{suggest.isLoading && (
				<div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center backdrop-blur-sm">
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
				{suggest.data?.status === 'created' && (
					<p className="text-primary">Successfully submitted</p>
				)}
				{suggest.data?.status === 'badRequest' && (
					<p className="text-primary">Both fields are required</p>
				)}
				{suggest.data?.status === 'created' ? (
					<Button onClick={close}>Close</Button>
				) : (
					<Button type="submit">Submit tag</Button>
				)}
			</div>
		</form>
	);
};

export default Suggestion;
