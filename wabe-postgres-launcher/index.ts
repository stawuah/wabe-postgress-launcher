import { PGlite, type PGliteOptions, type Results } from '@electric-sql/pglite';
import { MemoryFS } from '@electric-sql/pglite'
import tcpPortUsed from 'tcp-port-used';
import { Client as PgClient } from 'pg'; // For real PostgreSQL in production
import type { PostgresClient } from './wabe-postgres';

export const setupInMemoryPostgres = async (): Promise<PGlite | undefined> => {
    const port = 5432;
    const universalPort = '127.0.0.1';
    const isPortInUse = await tcpPortUsed.check(port, universalPort);

    if (isPortInUse) {
        console.info(`PostgreSQL is already running on port ${port}`);
        return; // Skip in-memory setup if real PostgreSQL is running
    }

    const options: PGliteOptions = {
        database: 'postgres',
        username: 'user',
        fs: new MemoryFS(),
        debug: 1, // Optional debug level for output
        relaxedDurability: true,
        initialMemory: 256 * 1024 * 1024,
    };

    try {
        const db = new PGlite(options); // Make sure to initialize the database with the options
        

        await db.waitReady; // Ensure database is fully initialized
        console.info('In-memory PostgreSQL instance started and schema initialized');

        // Run an initial query to verify setup
        const testQuery: Results = await db.query('SELECT NOW();');
        console.info('Database time:', testQuery.rows[0]);

        return db;
    } catch (error : any) {
        console.error('Error setting up in-memory PostgreSQL:', {
            message: error.message,
            stack: error.stack,
            options, // log the options that were passed
        });
        
    }
};


// Utility to get the correct PostgreSQL client based on the environment
export const getPostgresClient = async (
    db_user?: string,
    host?: string,
    database?: string,
    password?: string,
    port?: number
): Promise<PostgresClient> => { // Use the union type here
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
        return await setupInMemoryPostgres(); // This can return a PGlite instance
    }
};

// Run the client setup function
getPostgresClient().then(db => {
    if (db) {
        console.log('PostgreSQL client is ready.');
    } else {
        console.log('No PostgreSQL client initialized.');
    }
}).catch(error => {
    console.error('Error during PostgreSQL setup:', error);
});
