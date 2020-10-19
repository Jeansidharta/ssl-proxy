import { HostConfig } from "../models/user-configuration";

export function applyDefaultConfiguration (config: HostConfig) {
	if (config.certificateGenerationArguments) {
		config.certificateGenerationArguments.days = 180;
	}
	return config;
}