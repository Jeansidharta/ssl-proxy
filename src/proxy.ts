import httpProxy from 'http-proxy';
import { sendErrorPage } from './lib/send-error-page';

/** The proxy object. It will always redirect to a localhost server at the `TARGET_PORT` port */
const proxy = httpProxy.createProxyServer();

/**
* Error handling: what to serve the user if the proxy fails to retrieve it's content
*/
proxy.on('error', (error, _, res) => {
	// `console.error` for logging purposes

	const code = ((error as unknown as { code: string }).code);
	if (code === 'ECONNREFUSED') {
		console.error('404 request');
		// Send a 404 page if the server was not found
		sendErrorPage(res, 'It seems the requested domain name was registered, but the server is not currently running', 500);
	} else {
		console.error('ERROR', error);
		// Send a 500 page otherwise
		sendErrorPage(res, error.toString(), 500);
	}
});

export default proxy;