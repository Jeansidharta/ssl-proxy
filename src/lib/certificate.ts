import { openssl } from './openssl';
import { promises as fs } from 'fs';
import { IssuerInformation, ConfigFile } from '../models/user-configuration';
import { getPathToCertificate, resolveRelativePath } from './path-resolver';
import path from 'path';

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

async function generateKey(keyPath: string, uid: number, gid: number) {
	await openssl([
		'genrsa',
		'-out', keyPath,
		'2048'
	], uid, gid);
}

async function generateCertificateSignRequest (keyPath: string, configPath: string, certSignRequestPath: string, uid: number, gid: number) {
	await openssl([
		'req',
		'-new',
		'-key', keyPath,
		'-config', configPath,
		'-out', certSignRequestPath
	], uid, gid);
}

async function generateCertificate (
	certSignRequestPath: string,
	certificatePath: string,
	pathToCA: string,
	pathToCAKey: string,
	pathToCASerial: string,
	configPath: string,
	uid: number,
	gid: number
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
	], uid, gid);
}

async function generateCABundle (pathToBundle: string, pathToAllCAs: string[], uid: number, gid: number) {
	const bundleContent = await Promise.all(
		pathToAllCAs.map(path => fs.readFile(path, 'utf8'))
	);
	await fs.writeFile(pathToBundle, bundleContent.join(''));
	await fs.chown(pathToBundle, uid, gid);
}

export async function generateCertificateFromConfig (configFile: ConfigFile) {
	const { config, configOwner: uid, configGroup: gid } = configFile;

	if (!config.certificateGenerationArguments) throw new Error('Cannot generate certificate without arguments');

	const keyDirectory = path.parse(getPathToCertificate(configFile).key).dir;
	if (!keyDirectory) throw new Error('Could not get key directory');
	console.log('debug', keyDirectory);
	const keyPath = `${keyDirectory}/private.key`;
	const certificatePath = `${keyDirectory}/certificate.crt`;
	const configPath = `${keyDirectory}/config.cnf`;
	const certSignRequestPath = `${keyDirectory}/certSignRequest.csr`;
	const CABundlePath = `${keyDirectory}/CABundle.crt`;

	console.log(`Generating certificate for ${config.hostDomain} at ${keyDirectory}...`);
	await fs.mkdir(keyDirectory, { recursive: true });
	await fs.chown(keyDirectory, configFile.configOwner, configFile.configGroup);
	await writeConfigFile(configPath, config.hostDomain, config.certificateGenerationArguments?.issuerInformation);
	await generateKey(keyPath, uid, gid);
	await generateCertificateSignRequest(keyPath, configPath, certSignRequestPath, uid, gid);
	await generateCertificate(
		certSignRequestPath,
		certificatePath,
		resolveRelativePath(config.certificateGenerationArguments.certificateAuthority.certificateLocation, configFile.configPath, configFile.homePath),
		resolveRelativePath(config.certificateGenerationArguments.certificateAuthority.keyLocation, configFile.configPath, configFile.homePath),
		resolveRelativePath(config.certificateGenerationArguments.certificateAuthority.serialLocation, configFile.configPath, configFile.homePath),
		configPath,
		uid,
		gid
	);
	{
		const { pathToCertificateChain } = config.certificateGenerationArguments.certificateAuthority;
		if (pathToCertificateChain) {
			await generateCABundle(
				CABundlePath,
				[...pathToCertificateChain, config.certificateGenerationArguments.certificateAuthority.certificateLocation],
				uid,
				gid,
			);
		}
	}
	await Promise.all([
		fs.unlink(configPath),
		fs.unlink(certSignRequestPath),
	]);
	console.log('Certificate done!');
}