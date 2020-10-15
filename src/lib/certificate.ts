import { openssl } from './openssl';
import { promises as fs } from 'fs';
import { IssuerInformation, ServerConfig } from '../models/user-configuration';

async function writeConfigFile (
	path: string,
	domainName: string,
	issuerInformation?: IssuerInformation,
) {
	const configurationFile = `
		[req]
		prompt = no
		utf8 = yes
		req_extensions = req_extensions
		distinguished_name = req_distinguished_name

		[req_distinguished_name]
		C=${issuerInformation?.country || '00'}
		ST=${issuerInformation?.state || 'unknown'}
		L=${issuerInformation?.city || 'unknown'}
		O=${issuerInformation?.organization || 'unknown'}
		OU=${issuerInformation?.organizationUnit || 'unknown'}
		CN=${issuerInformation?.commonName || 'unknown'}
		emailAddress=${issuerInformation?.emailAddress || 'unknown'}

		[req_extensions]
		subjectAltName = @alt_names

		[alt_names]
		DNS.1 = ${domainName}
	`;
	return fs.writeFile(path, configurationFile);
}

async function generateKey(keyPath: string) {
	await openssl([
		'genrsa',
		'-out', keyPath,
		'2048'
	]);
}

async function generateCertificateSignRequest (keyPath: string, configPath: string, certSignRequestPath: string) {
	await openssl([
		'req',
		'-new',
		'-key', keyPath,
		'-config', configPath,
		'-out', certSignRequestPath
	]);
}

async function generateCertificate (
	certSignRequestPath: string,
	certificatePath: string,
	pathToCA: string,
	pathToCAKey: string,
	pathToCASerial: string,
	configPath: string,
) {
	await openssl([
		'x509',
		'-req',
		'-in', certSignRequestPath,
		'-out', certificatePath,
		'-CA', pathToCA,
		'-CAkey', pathToCAKey,
		'-CAserial', pathToCASerial,
		'-days', '180',
		'-extfile', configPath,
		'-extensions', 'req_extensions'
	]);
}

async function generateCABundle (pathToBundle: string, pathToAllCAs: string[]) {
	const bundleContent = await Promise.all(
		pathToAllCAs.map(path => fs.readFile(path, 'utf8'))
	);
	await fs.writeFile(pathToBundle, bundleContent.join(''));
}

export async function generateCertificateFromConfig (config: ServerConfig) {
	if (!config.certificateGenerationArguments) throw new Error('Cannot generate certificate without arguments');

	const keyDirectory = `${config.certificateGenerationArguments.certificateGenerationLocation}/${config.serverDomain}`;
	const keyPath = `${keyDirectory}/private.key`;
	const certificatePath = `${keyDirectory}/certificate.crt`;
	const configPath = `${keyDirectory}/config.cnf`;
	const certSignRequestPath = `${keyDirectory}/certSignRequest.csr`;
	const CABundlePath = `${keyDirectory}/CABundle.crt`;

	console.log(`Generating certificate for ${config.serverDomain} at ${keyDirectory}...`);
	await fs.mkdir(keyDirectory, { recursive: true });
	await writeConfigFile(configPath, config.serverDomain, config.certificateGenerationArguments?.issuerInformation);
	await generateKey(keyPath);
	await generateCertificateSignRequest(keyPath, configPath, certSignRequestPath);
	await generateCertificate(
		certSignRequestPath,
		certificatePath,
		config.certificateGenerationArguments.certificateAuthority.certificateLocation,
		config.certificateGenerationArguments.certificateAuthority.keyLocation,
		config.certificateGenerationArguments.certificateAuthority.serialLocation,
		configPath,
	);
	{
		const { pathToCertificateChain } = config.certificateGenerationArguments.certificateAuthority;
		if (pathToCertificateChain) {
			await generateCABundle(CABundlePath, [...pathToCertificateChain, config.certificateGenerationArguments.certificateAuthority.certificateLocation]);
		}
	}
	await Promise.all([
		fs.unlink(configPath),
		fs.unlink(certSignRequestPath),
	]);
	console.log('Certificate done!');
}