import { isIPv4, isIPv6, isIP } from 'net';
import fetch from 'node-fetch';

const IPV4_API_URL = 'https://v4.ident.me/.json';
const IPV6_API_URL = 'https://v6.ident.me/.json';
const IP_API_URL = 'https://ident.me/';

export async function getMyIP (IPType?: 'IPV4' | 'IPV6') {
	const apiUrl = (
		IPType === 'IPV4' ? IPV4_API_URL :
		IPType === 'IPV6' ? IPV6_API_URL :
		IP_API_URL
	);

	const response = await fetch(apiUrl).catch(() => {
		throw new Error('Internet error at IP call');
	});

	if (!response.ok) {
		throw new Error(`IP call STATUS CODE ${response.status}: ${response.statusText}`);
	}

	const ip: string = await response.text().catch(() => {
		throw new Error('Failed to parse IP response');
	});

	// Checks if the IP address is valid.
	if (!ip) {
		throw new Error(`IP address is empty`);
	} else if (IPType === 'IPV4' && !isIPv4(ip)) {
		throw new Error(`IP address '${ip}' should be an IPV4`);
	} else if (IPType === 'IPV6' && !isIPv6(ip)) {
		throw new Error(`IP address '${ip}' should be an IPV6`);
	} else if (!IPType && !isIP(ip)) {
		throw new Error(`IP address '${ip}' is invalid`);
	}

	return ip;
}