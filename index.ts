import "dotenv/config";
import createApp from "./app";
const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("PORT must be a valid port number");
createApp().listen(port, "0.0.0.0", () => console.log(`Kambaz server listening on port ${port}`));
