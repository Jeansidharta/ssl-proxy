import { netlifyFetch } from "../lib/netlify-fetch";

/** If response is undefined, then no errors occurred. Otherwise, there were errors. */
type Response = undefined | {
	/** The HTTP status code */
   code: number,

	/** The HTTP status code message */
   message: string,
}

export async function deleteDNS (dnsId: string) {
	const data = await netlifyFetch<Response>(`dns_zones/sidharta_xyz/dns_records/${dnsId}`, {
		method: 'DELETE',
	});
	return data;
}