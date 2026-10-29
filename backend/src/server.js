const app = require('./app');
const { connectDB } = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start listening
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` ShareSphere API Server running in ${NODE_ENV} mode`);
      console.log(` Server Port: http://localhost:${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api/v1`);
      console.log(` Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`=======================================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
