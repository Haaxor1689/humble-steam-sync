import { Bug, Github, History, Trash2 } from 'lucide-react';

import pkg from '../../package.json';

import { Storage } from '@/worker/helpers';

const About = () => (
	<details>
		<summary className="cursor-pointer text-lg">
			<h2 className="inline">About</h2>
		</summary>

		<div className="flex flex-col items-start gap-1">
			<p className="flex items-center gap-1 text-sm text-white/50">
				<History size={16} />
				<span>v{pkg.version}</span>
			</p>

			<a
				href="https://github.com/Haaxor1689/humble-steam-sync"
				target="_blank"
				className="flex items-center gap-1 text-sm"
				rel="noreferrer"
			>
				<Github size={16} />
				<span>Homepage</span>
			</a>

			<a
				href="https://github.com/Haaxor1689/humble-steam-sync/issues/new"
				target="_blank"
				className="text-primary flex items-center gap-1 text-sm"
				rel="noreferrer"
			>
				<Bug size={16} />
				<span>Report issues</span>
			</a>

			<button
				className="text-error flex items-center gap-1 text-sm"
				onClick={() => Storage.clear().then(() => window.location.reload())}
			>
				<Trash2 size={16} />
				<span>Reset ALL data</span>
			</button>
		</div>
	</details>
);

export default About;
