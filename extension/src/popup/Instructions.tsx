const Instructions = () => (
	<details>
		<summary className="cursor-pointer text-lg">
			<h2 className="inline">Instructions</h2>
		</summary>
		<p>
			You can get your SteamId or CustomUrl from your steam community profile
			page url:
		</p>
		<ul className="list-inside list-disc">
			<li className="whitespace-nowrap">
				https://steamcommunity.com/profiles/
				<span className="font-bold">SteamId</span>/
			</li>
			<li className="whitespace-nowrap">
				https://steamcommunity.com/id/
				<span className="font-bold">CustomUrl</span>/
			</li>
		</ul>
	</details>
);

export default Instructions;
