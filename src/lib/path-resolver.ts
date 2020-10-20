import path from 'path';
import { ConfigFile } from '../models/user-configuration';

export function resolveRelativePath (relativePath: string, baseDirectory: string, homeDirectory: string) {
	if (relativePath.startsWith('~/')) {
		relativePath = homeDirectory + relativePath.substr(1);
	}
	return path.resolve(baseDirectory, relativePath);
}

export function getPathToCertificate (file: ConfigFile) {
	const { config } = file;
	if (config.autoGenerateCertificate && config.certificateGenerationArguments) {
		const dir = path.join(
			config.certificateGenerationArguments.certificateGenerationLocation,
			config.hostDomain
		);

		return {
			certificate: path.join(dir, '/certificate.crt'),
			key: path.join(dir, '/private.key'),
			bundle: path.join(dir, '/CABundle.crt'),
		};
	} else if (config.customCertificate) {
		const { certificateLocation, privateKeyLocation, CABundle } = config.customCertificate;
		return {
			certificate: certificateLocation,
			key: privateKeyLocation,
			bundle: CABundle,
		};
	} else throw new Error('Error in configuration');
}