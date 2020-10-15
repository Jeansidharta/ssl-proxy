import { ServerConfig } from "../models/user-configuration";

export function applyDefaultConfiguration (config: ServerConfig) {
	if (config.certificateGenerationArguments) {
		config.certificateGenerationArguments.days = 180;
	}
	return config;
}