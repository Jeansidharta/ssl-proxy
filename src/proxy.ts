import fs from 'fs';

import httpProxy from 'http-proxy';

import options from './options';

/** The proxy object. It will always redirect to a localhost server at the `TARGET_PORT` port */
const proxy = httpProxy.createProxyServer({ target: `http://localhost:${options.TARGET_PORT}` });

/**
* Error handling: what to serve the user if the proxy fails to retrieve it's content
*/
proxy.on('error', (error, _, res) => {
	// `console.error` for logging purposes

	const code = ((error as unknown as { code: string }).code);
	if (code === 'ECONNREFUSED') {
		console.error('404 request');
		// Send a 404 page if the server was not found
		const page = fs.readFileSync(require.resolve('../404.html'));
		res.statusCode = 404;
		res.setHeader('Content-Type', 'text/html');
		res.end(page);
	} else {
		console.error('ERROR', error);
		// Send a 500 page otherwise
		const page = fs.readFileSync(require.resolve('../500.html'), 'utf8');
		res.statusCode = 500;
		res.setHeader('Content-Type', 'text/html');
		// Sends the error message to the user
		res.end(page.replace('{ErrorText}', error.toString()));
	}
});

export default proxy;