export const apiUrl =
	(import.meta.env?.NODE_ENV ?? process.env.NODE_ENV) === 'production'
		? 'https://humble-steam-sync.haaxor1689.dev/api'
		: 'http://localhost:3005/api';
console.log('API URL:', apiUrl);

export const host_permissions = [
	'https://store.steampowered.com/dynamicstore/userdata/',
	apiUrl
];

export const matches = [
	'https://*.humblebundle.com/membership/*',
	'https://*.humblebundle.com/games/*',
	'https://*.humblebundle.com/software/*',
	'https://*.humblebundle.com/home/keys*',
	'https://*.humblebundle.com/home/library*',
	'https://*.humblebundle.com/store*'
];
