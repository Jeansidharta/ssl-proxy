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
		let generationLocation = resolveRelativePath(
			config.certificateGenerationArguments.certificateGenerationLocation,
			file.configDirectoryPath,
			file.homePath,
		);

		const dir = path.join(generationLocation, config.hostDomain);
		return {
			certificate: path.join(dir, '/certificate.crt'),
			key: path.join(dir, '/private.key'),
			bundle: path.join(dir, '/CABundle.crt'),
		};
	} else if (config.customCertificate) {
		const { certificateLocation, privateKeyLocation, CABundle } = config.customCertificate;
		return {
			certificate: resolveRelativePath(certificateLocation, file.configDirectoryPath, file.homePath),
			key: resolveRelativePath(privateKeyLocation, file.configDirectoryPath, file.homePath),
			bundle: CABundle && resolveRelativePath(CABundle, file.configDirectoryPath, file.homePath),
		};
	} else throw new Error('Error in configuration');
}