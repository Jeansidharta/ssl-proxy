import { Dirent, promises as fs } from 'fs';
import path from 'path';
import { HostConfig, ConfigFile } from '../models/user-configuration';

const CONFIG_FOLDER_NAME = '.web-servers';

async function getAllHomeFolderPaths (): Promise<string[]> {
	const entries = await fs.readdir('/home', { withFileTypes: true }).catch(() => {
		throw new Error(`Could not read directory '/home'`);
	});

	// Only directories can be considered `home` folders
	const directories = entries.filter(entry => entry.isDirectory());

	return directories.map(dir => path.join('/home', dir.name));
}

async function readConfigFile (configFilePath: string): Promise<Error | HostConfig> {
	let fileString: string;
	try {
		fileString = await fs.readFile(configFilePath , { encoding: 'utf8' });
	} catch(error) {
		if (error.code === 'ENOENT') {
			return new Error(`'${configFilePath}' file was previously mapped, but doesn't seem to be there anymore`);
		} else {
			return new Error(`Failed to open previously mapped file '${configFilePath}'`);
		}
	}

	try {
		return JSON.parse(fileString) as HostConfig;
	} catch (e) {
		return new Error(`'${configFilePath}' could not be parsed as JSON. Are you sure it's a proper json?`);
	}
}

async function getConfigPathFromHome (homePath: string): Promise<Error | string[]> {
	const configFolderPath = path.join(homePath, CONFIG_FOLDER_NAME);
	let configFolderEntries: Dirent[];
	try {
		configFolderEntries = await fs.readdir(configFolderPath, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return new Error(`'${homePath}' SKIPPED: no configuration folder found`);
		} else {
			return new Error(`Could not read configuration folder at '${homePath}'`);
		}
	}

	const jsonFileEntries = configFolderEntries.filter(entry => (
		entry.isFile() && entry.name.endsWith('.json')
	));

	return jsonFileEntries.map(({ name }) => path.join(configFolderPath, name));
}

export async function loadConfiguration () {
	const homePaths = await getAllHomeFolderPaths();
	const configs = await Promise.all(homePaths.map(async homePath => {
		const configPaths = await getConfigPathFromHome(homePath);

		if (configPaths instanceof Error) {
			console.log(configPaths.message);
			return;
		}

		// Reads configurations
		const configFiles = await Promise.all(configPaths.map(async configPath => {
			const configContents = await readConfigFile(configPath);

			if (configContents instanceof Error) {
				console.log(configContents.message);
				return;
			}

			const configFile: ConfigFile = {
				config: configContents,
				homePath,
				configPath,
				configDirectoryPath: path.parse(configPath).dir,
				configFileName: path.basename(configPath),
			};

			return configFile;
		}));
		// Removes errored configs
		const validConfigsFiles = configFiles.filter(c => c) as ConfigFile[];
		if (validConfigsFiles.length === 0) return;
		return validConfigsFiles;
	}));

	const validConfigs = configs.filter(c => c) as ConfigFile[][];

	return validConfigs.flat(1);
}