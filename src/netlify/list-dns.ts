import { netlifyFetch } from "../lib/netlify-fetch";
import { DNSRecord } from "../models/netlify";

export async function listDNS () {
	const data = await netlifyFetch<DNSRecord[]>('dns_zones/sidharta_xyz/dns_records');
	return data!;
}