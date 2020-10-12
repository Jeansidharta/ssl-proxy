export type ServerConfig = {
	/** The port your application is listening on */
	inboundPort: number,
	/** The server domain on which your application is being hosted */
	serverDomain: string,
	/** If `false`, will refuse any HTTP connection. Defaults to `true` */
	allowHTTP?: boolean,
	/** If `false`, will refuse any HTTPS connection. Defaults to `false` */
	allowHTTPS?: boolean,
	/**
	 * If `allowHTTP` is false, `allowHTTPS` is true and the user tries to access the http
	 * version of your server, if `redirectToHTTPS` is true, the user will be redirected
	 * to the `https` version of the server. If `redirectToHTTPS` is false, an error will
	 * be displayed to the user. Default is false.
	 */
	redirectToHTTPS?: boolean,
	/** Ignored if `allowHTTPS` is `false`. No default */
	sslCertificateLocation?: string,
	/** Ignored if `allowHTTPS` is `false`. No default */
	sslCertificatePrivateKeyLocation?: string,
	/** Ignored if `allowHTTPS` is `false`. No default */
	sslCertificateAuthorityBundle?: string,
};

const defaultConfigs: Partial<ServerConfig> = {
	allowHTTP: true,
	allowHTTPS: false,
}

export function applyDefaultConfiguration (configObject: ServerConfig): ServerConfig {
	const mergedConfig = { ...defaultConfigs, ...configObject };

	const error = (message: string) => { throw new Error(message); }

	const required = (optionName: string, optionValue: any) => {
		if (optionValue === undefined) error(`Option '${optionName}' is required`);
	};

	const isType = (type: string, optionName: string, optionValue: any) => {
		if (typeof optionValue !== type) error(`Option '${optionName}' must be a ${type}`);
	};

	const isBetween = (min: number, max: number, optionName: string, optionValue: any) => {
		if (optionValue < min && optionValue > max) error(`Option '${optionName}' must be between ${min} and ${max}`);
	};

	// validating inboundPort
	required('inboundPort', mergedConfig.inboundPort);
	isType('number', 'inboundPort', mergedConfig.inboundPort);
	isBetween(1000, 65_535, 'inboundPort', mergedConfig.inboundPort);

	// validating hostname
	required('serverDomain', mergedConfig.serverDomain);
	isType('string', 'serverDomain', mergedConfig.serverDomain);

	if (!mergedConfig.allowHTTP && !mergedConfig.allowHTTPS) {
		// If neither HTTP and HTTPS are allowed, this entry doesn't make sense
		error(`Both options 'allowHTTP' and 'allowHTTPS' are set to false`);
	}

	if (mergedConfig.allowHTTP && mergedConfig.redirectToHTTPS) {
		// This is a logical error. If HTTP is allowed, it should not redirect to HTTPS
		error(`'allowHTTP' and 'redirectoToHttps' cannot be both set to true at the same time`);
	}

	if (!mergedConfig.allowHTTPS && mergedConfig.redirectToHTTPS) {
		// This is a logical error. Cannot redirect to HTTPS if it's disabled
		error(`'allowHTTPS' cannot be set to false when 'redirectoToHttps' is set to true`);
	}

	// Validating ssl certificate key placement
	if (mergedConfig.allowHTTPS) {
		required('sslCertificateAuthorityBundle', mergedConfig.sslCertificateAuthorityBundle);
		isType('string', 'sslCertificateAuthorityBundle', mergedConfig.sslCertificateAuthorityBundle);

		required('sslCertificateLocation', mergedConfig.sslCertificateLocation);
		isType('string', 'sslCertificateLocation', mergedConfig.sslCertificateLocation);

		required('sslCertificatePrivateKeyLocation', mergedConfig.sslCertificatePrivateKeyLocation);
		isType('string', 'sslCertificatePrivateKeyLocation', mergedConfig.sslCertificatePrivateKeyLocation);
	}

	return mergedConfig;
}