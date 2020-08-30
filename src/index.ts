// Node.js resources
import https from 'https';
import http from 'http';
import fs from 'fs';
import tls from 'tls';

// External Libraries
import httpProxy from 'http-proxy';

type Options = {
	/** SSL port. Where to listen to HTTPS requests (not HTTP). */
	HTTPS_PORT: string,

	/** Web port. Where to listen for HTTP requests (not HTTPS). */
	HTTP_PORT: string,

	/** Redirect port. This is where your development port should live on. */
	TARGET_PORT: string,

	/** Dictates wether the proxy will accept HTTP requests. */
	ALLOW_INCOMING_HTTP: boolean,
}

const options: Options = {
	HTTPS_PORT: process.env.SSLPROXY_HTTPS_LISTEN_PORT || '443',
	HTTP_PORT: process.env.SSLPROXY_HTTP_LISTEN_PORT || '80',
	TARGET_PORT: process.env.SSLPROXY_TARGET_PORT || '3000',
	ALLOW_INCOMING_HTTP: process.env.ALLOW_INCOMING_HTTP === 'false' ? false : true,
};

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
	minVersion: 'TLSv1.3',
},
	/**
	* Function called whenever a request is made. Will simply proxy the request
	* to the development server
	*/
	(req, res) => {
		proxy.web(req, res);
	}
);

if (options.ALLOW_INCOMING_HTTP) {
	/**
	* If the client tries to access the server through HTTP (not HTTPS),
	* just redirect them to the development server, without interfering.
	*/
	const httpServer = http.createServer((req, res) => {
		proxy.web(req, res);
	});

	httpServer.listen(options.HTTP_PORT, () => {
		console.log(`HTTP Listening on port ${options.HTTP_PORT}, and redirecting to port ${options.TARGET_PORT}`);
	});
}

console.log('Starting proxy...');
httpsServer.listen(options.HTTPS_PORT, () => {
	console.log(`HTTPS Listening on port ${options.HTTPS_PORT}, and redirecting to port ${options.TARGET_PORT}`);
});