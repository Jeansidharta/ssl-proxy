import tls from 'tls';
import { promises as fs } from 'fs';

import https from 'https';

import proxy from './proxy';
import process from 'process';
import { findConfigForHostname, getPathToCertificate } from './user-configuration';
import { sendErrorPage } from './lib/send-error-page';

/** Given a `domain`, verifies if there is a certificate somewhere, and serve it */
async function createSecureContextFromLocalCertificate (domain: string) {
	const config = findConfigForHostname(domain);

	if (!config) {
		console.error(`Could not find config entry for domain '${domain}'`);
		return null;
	}

	if (!config.allowHTTPS) {
		console.error(`Server does not allow https`);
		return null;
	}

	const certDir = getPathToCertificate(config);

	const [ca, cert, key] = await Promise.all([
		fs.readFile(certDir.bundle!, 'utf8').catch(() => undefined),
		fs.readFile(certDir.certificate!, 'utf8'),
		fs.readFile(certDir.key!, 'utf8'),
	]);

	try {
		return tls.createSecureContext({
			key,
			cert,
			ca,
		});
	} catch (e) {
		console.error(`Falied to create secure context for domain '${domain}'. Maybe the certs and keys are currupted?`);
		return null;
	}
}

const httpsServer = https.createServer({
	/**
	* Function called whenever a SSL certificate is requested. It will Verify what
	* domain is trying to be accessed, and will try to serve the correct certificate.
	* If no certificates for that domain is found, create one on the fly
	*/
	SNICallback: async (domain, cb) => {
		console.log(`Serving domain ${domain}`);
		const localCtx = await createSecureContextFromLocalCertificate(domain);
		if (localCtx) {
			cb(null, localCtx);
		} else {
			/** A falsy context is available for NodeJS. See the docs */
			cb(new Error('Unrecognized name'), null as any);
		}
	},

	/**
	* TLS 1.3 encripts DNS requests, which is essential for the user's privacy
	*/
	// minVersion: 'TLSv1.3',
},
	/**
	* Function called whenever a request is made. Will simply proxy the request
	* to the development server
	*/
	(req, res) => {
		const hostname = req.headers.host || req.headers.origin;

		if (!hostname) return sendErrorPage(res, `Your request must have a 'host' header'`, 400);

		const config = findConfigForHostname(hostname);

		if (!config) throw new Error(`Previously located config was not found for hostname '${hostname}'`);

		req.headers.host = "127.0.0.1";

		const target = `http://localhost:${config.inboundPort.toString()}`;
		proxy.web(req, res, {
			target,
		});
	}
);

httpsServer.on('error', (error: any) => {
	if (error.code === 'EACCES') {
		console.error('Not enough permission to listen on port 443. Try running with sudo');
		process.exit(-1);
	} else throw error;
});

export default httpsServer;