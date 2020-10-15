import { getMyIP } from './ip';
import { serverConfigs } from '../user-configuration';
import { listDNS } from '../netlify/list-dns';
import { createDNS } from '../netlify/create-dns';
import { deleteDNS } from '../netlify/delete-dns';

export async function updateNetlifyDNS () {
	const dnsToSynchronize: { [p: string]: boolean } = {};
	serverConfigs.forEach(config => {
		if (!config.synchronizeNetlifyDNS) return;
		dnsToSynchronize[config.serverDomain] = true;
	});

	if (Object.entries(dnsToSynchronize).length === 0) {
		console.log('No records to update...');
		return;
	}

	const myIP = await getMyIP('IPV6');
	console.log(`My IPV6 is ${myIP}`);
	const netlifyDNSList = await listDNS();

	/** determines which DNS records should be updated */
	const recordsToUpdate = netlifyDNSList.filter(record => {
		if (!dnsToSynchronize[record.hostname]) return;
		else delete dnsToSynchronize[record.hostname];

		if (record.value === myIP) {
			console.log(record.hostname + '\'s IP is up to date.');
			return false;
		}
		return true;
	});

	recordsToUpdate.forEach(async ({ hostname, id: recordId }) => {
		await deleteDNS(recordId);
		await createDNS(myIP, hostname);
		console.log(hostname + '\'s IP was incorrect. Now updated.');
	});

	Object.keys(dnsToSynchronize).forEach(async hostname => {
		await createDNS(myIP, hostname, 'AAAA');
		console.log(hostname + ' was missing. Creation successful');
	});
}