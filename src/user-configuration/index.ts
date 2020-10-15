import path from 'path';
import { loadConfiguration } from "./config-parsing";
import { updateNetlifyDNS } from "../lib/update-netlify-dns";
import { generateCertificateFromConfig } from "../lib/certificate";
import { ServerConfig } from "../models/user-configuration";
import { validateConfiguration } from "./config-validation";
import { applyDefaultConfiguration } from "./config-default";

async function unkillableUpdateNetlifyDNS () {
	try {
		await updateNetlifyDNS();
	} catch(e) {
		console.error(e);
	}
}

export let serverConfigs: ServerConfig[] = [];

export function findConfigForHostname (hostname: string) {
	return serverConfigs.find(config => config.serverDomain === hostname);
}

export function getPathToCertificate (config: ServerConfig) {
	if (config.autoGenerateCertificate && config.certificateGenerationArguments) {
		const dir = path.join(
			config.certificateGenerationArguments.certificateGenerationLocation,
			config.serverDomain,
		);

		return {
			certificate: path.join(dir, '/certificate.crt'),
			key: path.join(dir, '/private.key'),
			bundle: path.join(dir, '/CABundle.crt'),
		};
	} else if (config.customCertificate) {
		return {
			certificate: config.customCertificate.certificateLocation,
			key: config.customCertificate.privateKeyLocation,
			bundle: config.customCertificate.CABundle,
		};
	} else throw new Error('Error in configuration');
}

(async () => {
	serverConfigs = await loadConfiguration();
	serverConfigs.forEach(applyDefaultConfiguration);
	await Promise.all(serverConfigs.map(validateConfiguration));
	unkillableUpdateNetlifyDNS();
	setInterval(() => {
		unkillableUpdateNetlifyDNS();
	}, 1000 * 60 * 60);
	const configsToGenerateCertificate = serverConfigs.filter(config => config.autoGenerateCertificate);
	configsToGenerateCertificate.forEach(generateCertificateFromConfig);
})();