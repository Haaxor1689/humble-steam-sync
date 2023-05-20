import fs from 'fs-extra';
import archiver from 'archiver';

// Create archive
const archive = archiver('zip', { zlib: { level: 9 } });
const output = fs.createWriteStream('publish.zip');
archive.pipe(output);
archive.directory('dist', false);
archive.finalize();

// Generate description for extension store pages
const readme = fs.readFileSync('README.md', { encoding: 'utf-8' });
const description = readme.match(/## Description\n\n([^#]+)/)[1];
const changelog = readme.match(/## (Changelog[^#]+)/)[1].replace(/\*\*|`/g, '');
fs.writeFileSync('publish.txt', description + changelog);
