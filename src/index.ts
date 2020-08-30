import options from './options';
import httpServer from './http';
import httpsServer from './https';

console.log('Starting proxy...');

if (options.ALLOW_INCOMING_HTTP) {
	httpServer.listen(options.HTTP_PORT, () => {
		console.log(`HTTP Listening on port ${options.HTTP_PORT}, and redirecting to port ${options.TARGET_PORT}`);
	});
}

httpsServer.listen(options.HTTPS_PORT, () => {
	console.log(`HTTPS Listening on port ${options.HTTPS_PORT}, and redirecting to port ${options.TARGET_PORT}`);
});