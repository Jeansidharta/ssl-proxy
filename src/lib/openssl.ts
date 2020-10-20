import { spawn } from 'child_process';

export async function openssl(params: string[], uid: number, gid: number) {
	return new Promise<string>((resolve, reject) => {
		const stdout: string[] = [];
		const stderr: string[] = [];

		if (params[0] === 'openssl') params.shift();

		const openSSLProcess = spawn('openssl', params, { uid, gid });

		openSSLProcess.stdout.on('data', (data: Buffer) => {
			stdout.push(data.toString('utf8'));
		});

		openSSLProcess.stderr.on('data', (data: Buffer) => {
			stderr.push(data.toString('utf8'));
		});

		openSSLProcess.on('close', (code) => {
			if (code === 0) resolve(stdout.join(''));
			else reject(stderr.join(''));
		});
	});
}
