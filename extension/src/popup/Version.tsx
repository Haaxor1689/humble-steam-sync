import pkg from '../../package.json';

const Version = () => (
	<p className="absolute right-1 bottom-1 text-sm text-white/70 select-none">
		v{pkg.version}
	</p>
);

export default Version;
