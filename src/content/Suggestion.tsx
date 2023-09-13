import { useMutation } from '@tanstack/react-query';
import browser from 'webextension-polyfill';
import Button from '../components/Button';
import useField from '../utils/useField';
import Spinner from '../components/Spinner';
import { Message, suggestTag } from '../worker';

type Props = { close: () => void };

const Suggestion = ({ close }: Props) => {
  const suggest = useMutation(
    async (suggestion: Parameters<typeof suggestTag>[0]) =>
      (await browser.runtime.sendMessage({
        action: 'suggestTag',
        suggestion
      } satisfies Message)) as ReturnType<typeof suggestTag>
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
      className="hss-background relative flex flex-col gap-2 p-3 max-w-sm items-start"
    >
      {suggest.isLoading && (
        <div className="text-[var(--main-text-color)] flex justify-center absolute top-0 left-0 right-0 bottom-0 items-center backdrop-blur-sm">
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
      <input
        {...steamName.props}
        className="text-[var(--main-text-color)] border-b border-[var(--btn-outline)] bg-transparent p-2 self-stretch"
      />
      <label htmlFor={humbleName.props.id}>Humble bundle name</label>
      <input
        {...humbleName.props}
        className="text-[var(--main-text-color)] border-b border-[var(--btn-outline)] bg-transparent p-2 self-stretch"
      />
      <div className="flex justify-end gap-2 self-stretch items-center">
        {suggest.data?.status === 'exists' && (
          <p className="text-[#7cb8e4]">
            This combination was already reported
          </p>
        )}
        {suggest.data?.status === 'created' && (
          <p className="text-[#7cb8e4]">Successfully submitted</p>
        )}
        {suggest.data?.status === 'badRequest' && (
          <p className="text-[#7cb8e4]">Both fields are required</p>
        )}
        {suggest.data?.status === 'created' ||
        suggest.data?.status === 'exists' ? (
          <Button onClick={close}>Close</Button>
        ) : (
          <Button type="submit">Submit tag</Button>
        )}
      </div>
    </form>
  );
};

export default Suggestion;
