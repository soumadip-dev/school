import { ENV } from './config/env.config.js';
import { connectDB } from './config/db.config.js';
import app from './app.js';
import configureSocket from './config/socket.config.js'; // Add this line
import http from 'http'; // Add this line

const PORT = ENV.PORT || 8080;

//* Function to connect the DB and start the server
const startServer = async () => {
  try {
    await connectDB(); // Ensure DB is connected before starting the server

    // Create HTTP server
    const server = http.createServer(app); // Add this line

    // Initialize Socket.io
    configureSocket(server); // Add this line

    server.listen(PORT, () => {
      console.info(`✔️ Server is up and running on port: ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
