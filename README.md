## Description:
wabe_pg_launcher is a wabe utility that provides seamless PostgreSQL client management for both development and production environments. In development, it utilizes an in-memory PostgreSQL instance for fast, lightweight testing and schema initialization using pg-mem. For production or staging environments, it connects to a real PostgreSQL database, leveraging environment variables for configuration. The project supports dynamic database setup, ensuring smooth transitions between local and cloud-based databases without the need for additional setup during development or continuous integration workflows.

### Features:
* In-memory PostgreSQL with pg-mem for fast, isolated testing.
* Dynamic environment handling for production and staging setups.
* Configurable via environment variables or fallback options.
* Automatic schema initialization for test environments.
* Handles real PostgreSQL connections for production use cases.
