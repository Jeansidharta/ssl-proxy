import process from 'process';

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

export default options;