import httpServer from './http';
import httpsServer from './https';

console.log('Starting proxy...');

httpServer.listen(80, () => {
	console.log(`HTTP Listening on port ${80}`);
});

httpsServer.listen(443, () => {
	console.log(`HTTPS Listening on port ${443}`);
});