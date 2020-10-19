import http from 'http';

import proxy from './proxy';
import process from 'process';

import { findConfigFileForHostDomain } from './user-configuration';
import { sendErrorPage } from './lib/send-error-page';

let httpServer: http.Server;

/**
* If the client tries to access the server through HTTP (not HTTPS),
* just redirect them to the development server, without interfering.
*/
httpServer = http.createServer((req, res) => {
	// Extracts the hostname from the `host` and `origin` (from CORS requests) headers.
	const hostname = req.headers.host || req.headers.origin;

	if (!hostname) return sendErrorPage(res, `Your request must have a 'host' header'`, 400);

	const configFile = findConfigFileForHostDomain(hostname);

	if (!configFile) return sendErrorPage(res, `No page found with hostname '${hostname}'`, 404);

	if (!configFile.config.allowHTTP && configFile.config.allowHTTPS) {
		// Redirects to HTTPS
		res.statusCode = 301;
		res.setHeader('Location', `https://${configFile.config.hostDomain}`);
		res.end();
		return;
	} else if (!configFile.config.allowHTTP) {
		return sendErrorPage(res, `HTTP is disabled in this hostname, and no HTTPS redirect was found`, 400);
	}

	const target = `http://localhost:${configFile.config.inboundPort.toString()}`;
	console.log(target);
	proxy.web(req, res, {
		target,
	});
});

httpServer.on('error', (error: any) => {
	if (error.code === 'EACCES') {
		console.error('Not enough permission to listen on port 80. Try running with sudo');
		process.exit(-1);
	} else if (error.code === 'EADDRINUSE') {
		console.error('Some other process is already using port 80');
		process.exit(-1);
	} else throw error;
});

export default httpServer;