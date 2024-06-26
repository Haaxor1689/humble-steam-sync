import fs from 'fs-extra';
import archiver from 'archiver';

const createArchive = archiveName =>
	new Promise(resolve => {
		const archive = archiver('zip', { zlib: { level: 9 } });
		const output = fs.createWriteStream(archiveName);
		archive.pipe(output);
		archive.directory('dist', false);
		archive.on('end', () => resolve());
		archive.finalize();
	});

try {
	console.log('Preparing archives for publishing...');

	// Create Chrome archive
	await createArchive('publish.chrome.zip');

	// Create Firefox archive
	const manifest = await fs.readJSON('dist/manifest.json');

	const worker = manifest.background.service_worker;
	delete manifest.background;
	manifest.background = { scripts: [worker], type: 'module' };

	manifest.browser_specific_settings = {
		gecko: { id: '{786b395b-16f4-43a0-ad5c-8fecbe747a1e}' }
	};

	await fs.writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2));

	// Create firefox archive (and source)
	await createArchive('publish.firefox.zip');
	await createArchive('source.firefox.zip');

	// Generate description for extension store pages
	const readme = await fs.readFile('README.md', { encoding: 'utf-8' });
	const description = readme.match(/## Description\n\n([^#]+)/)[1];
	const changelog = readme
		.match(/## (Changelog[^#]+)/)[1]
		.replace(/\*\*|`/g, '');
	await fs.writeFile('publish.txt', description + changelog);

	console.log(
		'Successfully prepared archives for publishing. Submit new build at links below:.\n' +
			'Chrome: https://chrome.google.com/webstore/devconsole/a428d701-d9f6-455e-94f4-63c7b9ad2114/fcinjfniedmmfaalakcallcbjepfiabi/edit/package' +
			'\n' +
			'Firefox: https://addons.mozilla.org/en-US/developers/addon/steam-tags-for-humble-bundle/edit'
	);
} catch (e) {
	console.log('Failed to build archives for publishing.');
	console.log(e);
}
