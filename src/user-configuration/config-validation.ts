import { promises as fs } from 'fs';
import { ServerConfig } from '../models/user-configuration';

const error = (message: string) => { throw new Error(message); }

/**
 * Makes sure all options have the correct type
 */
function validateTypes (configObject: ServerConfig) {
	const isType = (type: string, optionName: string, optionValue: any) => {
		if (optionValue !== undefined && typeof optionValue !== type) error(`Option '${optionName}' must be a ${type}`);
	};

	isType('string', 'serverDomain', configObject.serverDomain);
	isType('number', 'inboundPort', configObject.inboundPort);
	isType('boolean', 'allowHTTP', configObject.allowHTTP);
	isType('boolean', 'allowHTTPS', configObject.allowHTTPS);
	isType('boolean', 'redirectToHTTPS', configObject.redirectToHTTPS);
	isType('boolean', 'synchronizeNetlifyDNS', configObject.synchronizeNetlifyDNS);
	isType('boolean', 'autoGenerateCertificate', configObject.autoGenerateCertificate);
	isType('object', 'certificateGenerationArguments', configObject.certificateGenerationArguments);
	if (configObject.certificateGenerationArguments) {
		isType('string', 'certificateGenerationArguments.certificateGenerationLocation', configObject.certificateGenerationArguments.certificateGenerationLocation);
		isType('number', 'certificateGenerationArguments.days', configObject.certificateGenerationArguments.days);
		isType('object', 'certificateGenerationArguments.certificateAuthority', configObject.certificateGenerationArguments.certificateAuthority);
		if (configObject.certificateGenerationArguments.certificateAuthority) {
			isType('string', 'certificateGenerationArguments.certificateAuthority.certificateLocation', configObject.certificateGenerationArguments.certificateAuthority.certificateLocation);
			isType('string', 'certificateGenerationArguments.certificateAuthority.keyLocation', configObject.certificateGenerationArguments.certificateAuthority.keyLocation);
			isType('string', 'certificateGenerationArguments.certificateAuthority.serialLocation', configObject.certificateGenerationArguments.certificateAuthority.serialLocation);
			isType('string', 'certificateGenerationArguments.certificateAuthority.serialLocation', configObject.certificateGenerationArguments.certificateAuthority.serialLocation);
			const { pathToCertificateChain } = configObject.certificateGenerationArguments.certificateAuthority;
			if (pathToCertificateChain) {
				if (!(pathToCertificateChain instanceof Array))
					error('configObject.certificateGenerationArguments.certificateAuthority.pathToCertificateChain must be an array');
				pathToCertificateChain.forEach(path => {
					if (typeof path !== 'string') {
						error('configObject.certificateGenerationArguments.certificateAuthority.pathToCertificateChain must be an array of strings');
					}
				})
			}
		}
		isType('object', 'certificateGenerationArguments.issuerInformation', configObject.certificateGenerationArguments.issuerInformation);
		if (configObject.certificateGenerationArguments.issuerInformation) {
			isType('string', 'certificateGenerationArguments.issuerInformation.country', configObject.certificateGenerationArguments.issuerInformation.country);
			isType('string', 'certificateGenerationArguments.issuerInformation.state', configObject.certificateGenerationArguments.issuerInformation.state);
			isType('string', 'certificateGenerationArguments.issuerInformation.city', configObject.certificateGenerationArguments.issuerInformation.city);
			isType('string', 'certificateGenerationArguments.issuerInformation.organization', configObject.certificateGenerationArguments.issuerInformation.organization);
			isType('string', 'certificateGenerationArguments.issuerInformation.organizationUnit', configObject.certificateGenerationArguments.issuerInformation.organizationUnit);
			isType('string', 'certificateGenerationArguments.issuerInformation.emailAddress', configObject.certificateGenerationArguments.issuerInformation.emailAddress);
			isType('string', 'certificateGenerationArguments.issuerInformation.commonName', configObject.certificateGenerationArguments.issuerInformation.commonName);
		}
	}
	isType('object', 'customCertificate', configObject.customCertificate);
	if (configObject.customCertificate) {
		isType('string', 'sslCertificateLocation.customCertificate.certificateLocation', configObject.customCertificate.certificateLocation);
		isType('string', 'sslCertificatePrivateKeyLocation.customCertificate.privateKeyLocation', configObject.customCertificate.privateKeyLocation);
		isType('string', 'sslCertificateAuthorityBundle.customCertificate.CABundle', configObject.customCertificate.CABundle);
	}
}

/**
 * Makes sure all required options are provided
 */
function validateRequirements (configObject: ServerConfig) {
	const required = (optionName: string, optionValue: any) => {
		if (optionValue === undefined) error(`option '${optionName}' is required`);
	};

	required('inboundPort', configObject.inboundPort);
	required('serverDomain', configObject.serverDomain);
	if (configObject.allowHTTPS) {
		if (configObject.autoGenerateCertificate) {
			if (!configObject.certificateGenerationArguments)
				error(`If the options 'allowHTTPS' and 'autoGenerateCertificate' are true, the option 'certificateGenerationArguments' is required.`);
		} else {
			if (!configObject.customCertificate)
				error(`If the options 'allowHTTPS' and 'autoGenerateCertificate' are true, the option 'customCertificate' is required.`);
		}
	}

	if (configObject.certificateGenerationArguments) {
		required('certificateGenerationArguments.certificateGenerationLocation', configObject.certificateGenerationArguments.certificateGenerationLocation);
		required('certificateGenerationArguments.certificateAuthority', configObject.certificateGenerationArguments.certificateAuthority);
		required('certificateGenerationArguments.certificateAuthority.certificateLocation', configObject.certificateGenerationArguments.certificateAuthority.certificateLocation);
		required('certificateGenerationArguments.certificateAuthority.keyLocation', configObject.certificateGenerationArguments.certificateAuthority.keyLocation);
		required('certificateGenerationArguments.certificateAuthority.serialLocation', configObject.certificateGenerationArguments.certificateAuthority.serialLocation);
	}
	if (configObject.customCertificate) {
		required('certificateGenerationArguments.customCertificate.certificateLocation', configObject.customCertificate.certificateLocation);
		required('certificateGenerationArguments.customCertificate.privateKeyLocation', configObject.customCertificate.privateKeyLocation);
	}
}

/**
 * Verifies that logical conflicts between options don't occur.
 * @example
 * if (allowHTTP === false && allowHTTPS === false) 
 * 	throw new Error(`Both options 'allowHTTP' and 'allowHTTPS' cannot be false`);
 */
function validateLogic (configObject: ServerConfig) {
	if (configObject.inboundPort < 1024 || configObject.inboundPort > 65_535)
		error(`'inboundPort' can only be above 1023 and below 65536`);

	if (!configObject.allowHTTP && !configObject.allowHTTPS)
		error(`Both options 'allowHTTP' and 'allowHTTPS' cannot be false`);

	if (configObject.allowHTTP && configObject.redirectToHTTPS)
		error(`Both options 'allowHTTP' and 'redirectoToHttps' cannot be true at the same time`);

	if (!configObject.allowHTTPS && configObject.redirectToHTTPS) {
		error(`Option 'allowHTTPS' cannot be false when 'redirectoToHttps' is true`);
	}
	if ((configObject.certificateGenerationArguments?.issuerInformation?.country?.length || 0) > 2) {
		error(`The country name specified at 'certificateGenerationArguments.issuerInformation.country' must have at most two characters`);
	}
	if ((configObject.certificateGenerationArguments?.days || 180) <= 0) {
		error(`The option specified at 'certificateGenerationArguments.days' must be greater than 0`);
	}
}

/**
 * Makes sure all files specified at all options exist.
 */
async function verifyFilesExist (configObject: ServerConfig) {
	const promises: Promise<any>[] = [];

	async function fileExist (optionName: string, path: string) {
		const promise = fs.stat(path).catch(() => error(`File specified at '${optionName}' could not be accessed`));
		promises.push(promise);
	}

	if (configObject.customCertificate) {
		fileExist('customCertificate.certificateLocation', configObject.customCertificate.certificateLocation);
		fileExist('customCertificate.privateKeyLocation', configObject.customCertificate.privateKeyLocation);
		if (configObject.customCertificate.CABundle) {
			fileExist('customCertificate.CABundle', configObject.customCertificate.CABundle);
		}
	}
	if (configObject.certificateGenerationArguments) {
		fileExist('certificateGenerationArguments.certificateGenerationLocation', configObject.certificateGenerationArguments.certificateGenerationLocation);
		fileExist('certificateGenerationArguments.certificateAuthority.certificateLocation', configObject.certificateGenerationArguments.certificateAuthority.certificateLocation);
		fileExist('certificateGenerationArguments.certificateAuthority.keyLocation', configObject.certificateGenerationArguments.certificateAuthority.keyLocation);
		fileExist('certificateGenerationArguments.certificateAuthority.serialLocation', configObject.certificateGenerationArguments.certificateAuthority.serialLocation);
	}

	await Promise.all(promises);
}

export async function validateConfiguration (configObject: ServerConfig) {
	try {
		validateTypes(configObject);
		validateRequirements(configObject);
		validateLogic(configObject);
		await verifyFilesExist(configObject);
	} catch (e) {
		console.error(`Error validating certificate from ${configObject.serverDomain}: ${e.message}`);
		throw null;
	}
}