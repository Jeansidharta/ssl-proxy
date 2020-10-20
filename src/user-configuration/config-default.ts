import { resolveRelativePath } from "../lib/path-resolver";
import { ConfigFile } from "../models/user-configuration";

export function applyDefaultConfiguration (configFile: ConfigFile) {
	const { config } = configFile;

	function resolvePath (path: string) {
		return resolveRelativePath(path, configFile.configDirectoryPath, configFile.homePath);
	}

	if (config.certificateGenerationArguments) {
		config.certificateGenerationArguments.days = 180;
	}

	if (config.certificateGenerationArguments) {
		const { certificateGenerationArguments } = config;
		certificateGenerationArguments.certificateGenerationLocation = (
			resolvePath(certificateGenerationArguments.certificateGenerationLocation)
		);
		const { certificateAuthority } = certificateGenerationArguments;

		certificateAuthority.certificateLocation = resolvePath(certificateAuthority.certificateLocation);
		certificateAuthority.keyLocation = resolvePath(certificateAuthority.keyLocation);
		certificateAuthority.serialLocation = resolvePath(certificateAuthority.serialLocation);

		if (certificateAuthority.pathToCertificateChain) {
			const { pathToCertificateChain } = certificateAuthority;
			certificateAuthority.pathToCertificateChain = pathToCertificateChain.map(chainPath => resolvePath(chainPath));
		}
	}

	if (config.customCertificate) {
		config.customCertificate.certificateLocation = resolvePath(config.customCertificate.certificateLocation);
		config.customCertificate.privateKeyLocation = resolvePath(config.customCertificate.privateKeyLocation);
		if (config.customCertificate.CABundle) {
			config.customCertificate.CABundle = resolvePath(config.customCertificate.CABundle);
		}
	}

	return configFile;
}