export type DNSRecordType = 'A' | 'AAAA' | 'ALIAS' | 'CAA' | 'CNAME' | 'MX' | 'NS' | 'SPF' | 'SRV' | 'TXT' | 'NETLIFY';

/** All `unknown` values are things I don't know what should be, at the time of writing */
export type DNSRecord = {
	/** @example 'www.google.com' */
	hostname: string,

	/** The DNS record type */
	type: DNSRecordType,

	/** The "Time to live" of the DNS record on caches, in seconds */
	ttl: number,

	priority: unknown,
	weight: unknown,
	port: unknown,
	flag: unknown,
	tag: unknown,

	/** The record's ID */
	id: string,

	/**
	 * If the DNS record points to a site deployed in Netlify, this will contain that
	 * site's ID. Otherwise, will be null.
	 */
	site_id: string | null,

	dns_zone_id: string,
	errors: unknown[],

	/**
	 * If managed, then Netlify will automatically manage the record. If it's not
	 * managed, then the user is responsible for updating the record.
	 */
	managed: boolean,

	/** The value contained in the DNS record */
	value: string,
};