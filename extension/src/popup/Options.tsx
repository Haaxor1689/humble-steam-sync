import allTagsPreview from './all-tags-preview.png';

import Button from '@/components/Button';
import useStorage from '@/utils/useStorage';

const Options = () => {
	const alwaysShowTag = useStorage<boolean>('alwaysShowTag');
	return (
		<details>
			<summary className="cursor-pointer text-lg">
				<h2 className="inline">Options</h2>
			</summary>

			<div className="mt-2 flex gap-2">
				<img
					src={allTagsPreview}
					className="aspect-auto w-1/3"
					alt="Preview of how steam link tag looks like"
				/>
				<div className="flex flex-col items-start gap-2">
					<label htmlFor="alwaysShowTag" className="">
						Always show a tag with link to Steam store next to all items on
						HumbleBundle pages?
					</label>

					<Button
						type="submit"
						title={alwaysShowTag.value ? 'Show' : "Don't show"}
						onClick={() => alwaysShowTag.set(!alwaysShowTag.value)}
					>
						{alwaysShowTag.value ? 'Always show' : "Don't show"}
						<img
							src="https://store.cloudflare.steamstatic.com/public/images/v6/icon_platform_linux.png"
							alt="Steam logo"
						/>
					</Button>
				</div>
			</div>
		</details>
	);
};

export default Options;
