import httpProxy from 'http-proxy';
import https from 'https';
import http from 'http';
import fs from 'fs';
import tls from 'tls';

// SSL port
const HTTPS_PORT = 443;

// Web port
const HTTP_PORT = 80;

// Redirect port
const TARGET_PORT = 3000;

/** Given a `domain`, verifies if there is a certificate somewhere, and serve it */
function createSecureContext (domain: string) {
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

const proxy = httpProxy.createProxyServer({ target: `http://localhost:${TARGET_PORT}` });

const httpsServer = https.createServer({
	/**
	* Function called whenever a SSL certificate is about to be used. It will
	* Verify what domain is trying to be accessed, and will try to serve the correct
	* certificate. If no certificates for that domain are found, does nothing.
	*/
	SNICallback: (domain, cb) => {
		const ctx = createSecureContext(domain);
		if (ctx) {
			cb(null, ctx);
		}
	}
},
	/**
	* Function called whenever a request is made. Will simply proxy the request
	* to the development server
	*/
	(req, res) => {
		proxy.web(req, res);
	}
);

/**
* If the client tries to access the server through HTTP, just redirect them to
* the development server, without questioning.
*/
const httpServer = http.createServer((req, res) => {
	proxy.web(req, res);
});

console.log('Starting proxy...');
httpsServer.listen(HTTPS_PORT, () => {
	console.log(`HTTPS Listening on port ${HTTPS_PORT}, and redirecting to port ${TARGET_PORT}`);
});

httpServer.listen(HTTP_PORT, () => {
	console.log(`HTTP Listening on port ${HTTP_PORT}, and redirecting to port ${TARGET_PORT}`);
});