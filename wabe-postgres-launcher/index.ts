import { newDb } from 'pg-mem';
import tcpPortUsed from 'tcp-port-used';
import { Client as PgClient } from 'pg'; // For real PostgreSQL in production

// Function to set up the in-memory PostgreSQL using pg-mem
export const setupInMemoryPostgres = async (changed_loopback_aadress?: string): Promise<PgClient | undefined> => {
    const port = 5432;
    const universalPort = changed_loopback_aadress || '0.0.0.0'; // Default to '0.0.0.0' if no port/loopback address is provided
    console.log(`Checking if PostgreSQL is running on port ${port} with host ${universalPort}...`);

    const isPortInUse = await tcpPortUsed.check(port, universalPort);

    if (isPortInUse) {
        console.info(`PostgreSQL is already running on port ${port}`);
        return; // Skip in-memory setup if real PostgreSQL is running
    }

    // Create in-memory PostgreSQL using pg-mem
    const db = newDb({
        autoCreateForeignKeyIndices: true, // Ensure FK indices are automatically handled
    });

    const schemaSQL = `
    CREATE TABLE wabe (
        id SERIAL PRIMARY KEY,
        wabe_project_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE
    );
    CREATE TABLE wabe_projects (
        id SERIAL PRIMARY KEY,
        wabe_project INT REFERENCES wabe(id),
        title VARCHAR(255),
        body TEXT
    );
    `;

    const pgClient = db.adapters.createPg().Client;
    const client = new pgClient();

    try {
        await client.connect();
        await client.query(schemaSQL);
        console.info('In-memory PostgreSQL instance started and schema initialized');
        return client;
    } catch (error) {
        console.error('Error setting up in-memory PostgreSQL:', error);
        throw error;
    }
};

// Utility to get the correct PostgreSQL client based on the environment
export const getPostgresClient = async (
    db_user?: string,
    host?: string,
    database?: string,
    password?: string,
    port?: number
): Promise<PgClient | undefined> => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);

    if (isProduction) {
        // Use the actual pg.Client for production/staging
        const connectionString = process.env.DATABASE_URL;

        const client = connectionString 
            ? new PgClient({ connectionString }) // Use URI if available
            : new PgClient({
                user: process.env.DB_USER || db_user,
                host: process.env.DB_HOST || host,
                database: process.env.DB_NAME || database,
                password: process.env.DB_PASSWORD || password,
                port: Number(process.env.DB_PORT) || port || 5432,
            });

        try {
            await client.connect();
            console.info('Connected to real PostgreSQL instance');
            return client;
        } catch (error) {
            console.error('Failed to connect to PostgreSQL:', error);
            throw error;
        }
    } else {
        return await setupInMemoryPostgres();
    }
};

// Run the client setup function
getPostgresClient().then(client => {
    if (client) {
        console.log('PostgreSQL client is ready.');
    } else {
        console.log('No PostgreSQL client initialized.');
    }
}).catch(error => {
    console.error('Error during PostgreSQL setup:', error);
});
