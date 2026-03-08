import { Bug } from 'lucide-react';

const About = () => (
	<details>
		<summary className="cursor-pointer text-lg">
			<h2 className="inline">About</h2>
		</summary>

		<div className="flex flex-col items-start gap-1 text-sm">
			<p className="flex items-center gap-1 text-white/70">
				<span>Created by</span>
				<a
					href="https://haaxor1689.dev"
					target="_blank"
					rel="noreferrer"
					className="hover:underline"
				>
					Haaxor1689
				</a>
			</p>

			<a
				href="https://ko-fi.com/haaxor1689"
				target="_blank"
				rel="noreferrer"
				className="flex items-center gap-1 hover:underline"
			>
				<img
					src="https://storage.ko-fi.com/cdn/logomarkLogo.png"
					alt="Ko-fi logo"
					className="w-4"
				/>
				<span>Support me</span>
			</a>

			<a
				href="https://discord.gg/pDeTHQH99B"
				target="_blank"
				rel="noreferrer"
				className="text-primary flex items-center gap-1 hover:underline"
			>
				<Bug size={16} />
				<span>Report a bug</span>
			</a>
		</div>
	</details>
);

export default About;
