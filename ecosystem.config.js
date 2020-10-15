// This is a config file for the process manages `pm2`. See this link for more info:
// https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
	apps: [{
		name: 'ssl-proxy',
		script: 'out/src/index.js',
		watch: false,
		cwd: require.main.id,
		time: true,
	}],
};
