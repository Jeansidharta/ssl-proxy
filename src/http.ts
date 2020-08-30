import http from 'http';

import proxy from './proxy';

let httpServer: http.Server;

/**
* If the client tries to access the server through HTTP (not HTTPS),
* just redirect them to the development server, without interfering.
*/
httpServer = http.createServer((req, res) => {
	proxy.web(req, res);
});

export default httpServer;