// This is a config file for the process manages `pm2`. See this link for more info:
// https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
	apps: [{
		name: 'ssl-proxy',
		script: 'out/index.js',
		watch: false,
		cwd: require.main.id,
		env: {
			"SSLPROXY_HTTPS_LISTEN_PORT": 443,
			"SSLPROXY_HTTP_LISTEN_PORT": 80,
			"SSLPROXY_TARGET_PORT": 3000,
		},
	}],
};
