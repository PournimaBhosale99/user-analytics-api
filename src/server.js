const env = require("./config/env");
const logger = require("./utils/logger");
const app = require("./app");

// Decide which port to use
const port = env.port || 3000;

// Start HTTP server
app.listen(port, () => {
  logger.info({ port }, `Server listening on port ${port}`);
});
