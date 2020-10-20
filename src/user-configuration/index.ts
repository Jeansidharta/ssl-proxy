import fs from 'fs/promises';
import { loadConfiguration } from "./config-parsing";
import { updateNetlifyDNS } from "../lib/update-netlify-dns";
import { generateCertificateFromConfig } from "../lib/certificate";
import { ConfigFile } from "../models/user-configuration";
import { validateConfiguration } from "./config-validation";
import { applyDefaultConfiguration } from "./config-default";
import { getPathToCertificate } from '../lib/path-resolver';

async function unkillableUpdateNetlifyDNS () {
	try {
		await updateNetlifyDNS();
	} catch(e) {
		console.error(e);
	}
}

export let configFiles: ConfigFile[] = [];

export function findConfigFileForHostDomain (hostname: string) {
	return configFiles.find(file => file.config.hostDomain === hostname);
}

async function doesCertificateAlreadyExists (configFile: ConfigFile) {
	const { certificate, key } = getPathToCertificate(configFile);
	try {
		await Promise.all([
			fs.stat(certificate),
			fs.stat(key),
		]);
		return true;
	} catch (e) {
		return false;
	}
}

(async () => {
	configFiles = await loadConfiguration();
	configFiles.forEach(file => applyDefaultConfiguration(file));
	await Promise.all(configFiles.map(validateConfiguration));
	unkillableUpdateNetlifyDNS();
	setInterval(() => {
		unkillableUpdateNetlifyDNS();
	}, 1000 * 60 * 60);
	const configsFilesWithCustomCert = configFiles.filter(file => file.config.autoGenerateCertificate);
	configsFilesWithCustomCert.forEach(async file => {
		if (await doesCertificateAlreadyExists(file)) {
			console.log(`Certificate for '${file.config.hostDomain}' already exists. Skiping generation.`);
		} else {
			generateCertificateFromConfig(file);
		}
	});
})();