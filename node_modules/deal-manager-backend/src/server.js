// src/server.js
import { app } from "./app.js";
import { env } from "./config/env.js";

const port = env.PORT || 4001;

// Démarrer le serveur et gérer proprement les erreurs (ex: EADDRINUSE)
const server = app.listen(port, () => {
	console.info(`API server started (port ${port})`);
});

server.on('error', (err) => {
	if (err && err.code === 'EADDRINUSE') {
		console.error(`Port ${port} déjà utilisé. Fermez l'autre processus ou changez le PORT.`);
		process.exit(1);
	}
	console.error('Erreur serveur non gérée:', err);
	process.exit(1);
});
