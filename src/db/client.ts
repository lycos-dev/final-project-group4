import * as SQLite from 'expo-sqlite';

// Opens (or creates) the NEXA local database
const db = SQLite.openDatabaseSync('nexa.db');

export default db;