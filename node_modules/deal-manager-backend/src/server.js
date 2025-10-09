// src/server.js
import { app } from "./app.js";

const port = Number(process.env.PORT) || 4001;
app.listen(port, () => console.log(`API server started (port ${port})`));
