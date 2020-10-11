import fs from 'fs';
import { ServerResponse } from 'http';

export function sendErrorPage (res: ServerResponse, errorText: string, statusCode: number) {
	const page = fs.readFileSync(require.resolve('../.html'), 'utf8');
	res.statusCode = statusCode;
	res.setHeader('Content-Type', 'text/html');
	res.end(page
		.replace('{StatusCode}', statusCode.toString())
		.replace('{ErrorText}', errorText)
	);
}