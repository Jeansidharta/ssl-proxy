import { promises as fs } from 'fs';
import path from 'path';
import { ServerConfig } from '../models/user-configuration';

const CONFIG_FOLDER_NAME = '.web-servers';

async function getAllHomeFolderPaths (): Promise<string[]> {
	const entries = await fs.readdir('/home', { withFileTypes: true }).catch(() => {
		throw new Error(`Could not read directory '/home'`);
	});

	// Only directories can be considered `home` folders
	const directories = entries.filter(entry => entry.isDirectory());

	return directories.map(dir => path.join('/home', dir.name));
}

async function getAllConfigFilePaths(homePaths: string[]): Promise<string[]> {
	const configFilePaths: string[] = [];
	await Promise.all(
		homePaths.map(async homePath => {
			const configFolderPath = path.join(homePath, CONFIG_FOLDER_NAME);
			const fileEntries = await fs.readdir(configFolderPath).catch(error => {
				if (error.code === 'ENOENT') {
					console.log(`'${homePath}' SKIPPED: no configuration folder found`);
				} else {
					throw new Error(`Could not read configuration folder at '${homePath}'`);
				}
			});
			if (!fileEntries) return;

			const jsonFileEntries = fileEntries.filter(entry => entry.endsWith('.json'));
			if (jsonFileEntries.length === 0) {
				console.log(`'${homePath}' has no json files`);
				return;
			}
			console.log(`'${homePath}' is being read...`);

			const paths = jsonFileEntries.map(entry => path.join(configFolderPath, entry));
			paths.forEach(path => console.log(`'${path}' found`));

			configFilePaths.push(...paths);
		})
	);
	return configFilePaths;
}

async function readConfigFiles (filePaths: string[]): Promise<ServerConfig[]> {
	const files: ServerConfig[] = [];
	await Promise.all(
		filePaths.map(async filePath => {
			const fileString = await fs.readFile(filePath, { encoding: 'utf8' }).catch(error => {
				if (error.code === 'ENOENT') {
					throw new Error(`'${filePath}' file was previously mapped, but doesn't seem to be there anymore`);
				} else {
					throw new Error(`Failed to open previously mapped file '${filePath}'`);
				}
			});

			let fileObj: ServerConfig;
			try {
				fileObj = JSON.parse(fileString) as ServerConfig;
			} catch (e) {
				console.log(`'${filePath}' could not be parsed as JSON. Are you sure it's a proper json?`);
				return;
			}

			files.push(fileObj);
			return;
		})
	);
	return files;
}

export async function loadConfiguration () {
	const homePaths = await getAllHomeFolderPaths();
	const configFilePaths = await getAllConfigFilePaths(homePaths);
	const configs = await readConfigFiles(configFilePaths);
	return configs;
}