import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let sequelize;

if (isProduction && process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false, // Required for Render/Supabase
            },
        },
    });
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false,
        retry: {
            match: [/SQLITE_BUSY/],
            max: 10,
        },
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
            acquire: 30000,
        },
        dialectOptions: {
            // Enable Foreign Keys in SQLite
            // mode: 6 = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE
            mode: 6,
        },
    });

    // Enforce FKs after connection
    sequelize.beforeConnect(async (config) => {
        config.foreign_keys = true;
    });
}

export default sequelize;
