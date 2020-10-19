/** This information is embeded on all generated certificates. */
export type IssuerInformation = {
	/** Must have only two letters. @example 'BR' */
	country?: string,
	state?: string,
	city?: string,
	/** e.g. Your company name */
	organization?: string,
	organizationUnit?: string,
	emailAddress?: string,
	/** e.g. The name of your app */
	commonName?: string,
}

export type CertificateGenerationArguments = {
	/**
	 * The path to where the certificate's folder will be generated.
	 * @example '/home/user/certs/'
	 */
	certificateGenerationLocation: string,

	/**
	 * The number of days the certificate will be valid Note that most browsers
	 * will refuse certificates that last longer than a year.
	 * Default value is 180 (6 months).
	 */
	days?: number,

	/** Information about the Certificate Authority to be used. */
	certificateAuthority: {
		/**
		 * The path to where the CA's certificate is located.
		 * @example '/home/user/certs/ca/certificate.crt'
		 */
		certificateLocation: string,
		/**
		 * The path to where the CA's private key is located.
		 * @example '/home/user/certs/ca/private.key'
		 */
		keyLocation: string,
		/**
		 * The path to where the CA's serial file is located. This file is used to
		 * give an ID to each of it's generated certificates.
		 * @example '/home/user/certs/ca/serial.srl'
		 */
		serialLocation: string,
		/**
		 * This is an array of paths to all certificates in the CA chain. It is needed
		 * to generate a Certificate Authority Bundle (CA Bundle).
		 * @example ['/home/user/certs/ca/root/certificate.crt', '/home/user/certs/ca/intermediate/certificate.crt']
		 */
		pathToCertificateChain?: string[],
	},

	/** This information will be embeded on the generated certificate */
	issuerInformation?: IssuerInformation;
}

export type HostConfig = {
	/** The port your application is listening on */
	inboundPort: number,
	/** The server domain on which your application is being hosted */
	hostDomain: string,
	/** If `false`, will refuse any HTTP connection. Defaults to `true` */
	allowHTTP?: boolean,
	/** If `false`, will refuse any HTTPS connection. Defaults to `false` */
	allowHTTPS?: boolean,
	/**
	 * If true, HTTP GET requests will receive a 301 redirect to the HTTPS version
	 * of this service. This option can only be true if `allowHTTP` is false and
	 * `allowHTTPS` is true.
	 */
	redirectToHTTPS?: boolean,
	/**
	 * If true, the `serverDomain` will be automaticaly created on Netlify, and
	 * periodicaly updated to point to this machine.
	 * Default value: false
	 */
	synchronizeNetlifyDNS?: boolean,
	/**
	 * If no certificate is provided, a new one will be automaticaly generated,
	 * using information provided on `certificateGenerationArguments`.
	 * This is ignored if `allowHTTPS` is set to false.
	 * Default value: false
	 */
	autoGenerateCertificate?: boolean,
	/**
	 * Contains the information necessary for generating the SSL certificate.
	 * If `autoGenerateCertificate` is true, then this option is required.
	 * This is ignored if `allowHTTPS` is set to false.
	 */
	certificateGenerationArguments?: CertificateGenerationArguments,

	/**
	 * Information about a custom certificate, if you don't want a new one to be generated.
	 * This is ignored if `allowHTTPS` is set to false.
	 */
	customCertificate?: {
		/** The path to the certificate. @example '/home/user/certs/certifciate.crt' */
		certificateLocation: string,
		/** The path to the certificate's private key. @example '/home/user/certs/private.key' */
		privateKeyLocation: string,
		/** The path to the certificate's CA bundle key. @example '/home/user/certs/private.key' */
		CABundle?: string,
	}
};

export type ConfigFile = {
	homePath: string,
	config: HostConfig,
	configDirectoryPath: string,
	configPath: string,
	configFileName: string,
}