import fetch, { RequestInit } from 'node-fetch';
import { key } from '../../netlify_key.json';

type RequestInitObjectBody = Omit<RequestInit, 'body'> & { body?: object };

export async function netlifyFetch<T>(url: string, options?: RequestInitObjectBody): Promise<T | null> {
	const body = JSON.stringify(options?.body);

	const newOptions: RequestInit = {
		...options,
		body,
		headers: {
			...options?.headers,
			'Content-Type': 'application/json',
			authorization: 'Bearer ' + key,
		}
	}

	const response = await fetch(`https://api.netlify.com/api/v1/${url}`, newOptions).catch(() => {
		throw new Error('Internet error at netlify call');
	});

	if (!response.ok) {
		throw new Error(`Netlify CALL STATUS CODE ${response.status}: ${response.statusText}`);
	}

	if (response.headers.get('content-type')?.startsWith('application/json')) {
		return await response.json().catch(() => {
			throw new Error('Failed to parse Netlify response');
		}) as T;
	} else {
		return null;
	}
}