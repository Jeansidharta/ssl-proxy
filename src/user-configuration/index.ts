import { ServerConfig } from "./config-validation";
import { upateConfiguration } from "./config-parsing";

export let serverConfigs: ServerConfig[] = [];

export function findConfigForHostname (hostname: string) {
	return serverConfigs.find(config => config.serverDomain === hostname);
}

(async () => {
	serverConfigs = await upateConfiguration();
})();