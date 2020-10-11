import tls from 'tls';
import fs from 'fs';

import https from 'https';

import proxy from './proxy';

/** Given a `domain`, verifies if there is a certificate somewhere, and serve it */
function createSecureContextFromLocalCertificate (domain: string) {
	let keyPath: string, certPath: string, caPath: string;
	try {
		keyPath = require.resolve(`../certificates/${domain}/private.key`);
		certPath = require.resolve(`../certificates/${domain}/certificate.crt`);
		caPath = require.resolve(`../certificates/${domain}/ca_bundle.crt`);
	} catch (e) {
		console.error(`No certificate for domain '${domain}'`);
		return null;
	}

	try {
		return tls.createSecureContext({
			key: fs.readFileSync(keyPath, 'utf8'),
			cert: fs.readFileSync(certPath, 'utf8'),
			ca: fs.readFileSync(caPath, 'utf8'),
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
		console.log(`Received request to domain ${domain}.`);
		const localCtx = createSecureContextFromLocalCertificate(domain);
		if (localCtx) {
			console.log(`Serving pre-generated certificate...`);
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
		proxy.web(req, res);
	}
);

export default httpsServer;