const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dataDir = process.env.PTE_DATA_DIR || __dirname;
const dbPath = path.join(dataDir, 'practice.db');
const schemaPath = path.join(__dirname, 'schema.sql');

if (process.env.PTE_DATA_DIR) {
    fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dbPath)) {
        const bootstrapDb = process.env.PTE_BOOTSTRAP_DB ||
            path.join(__dirname, '..', 'bootstrap', 'practice.db');
        if (!fs.existsSync(bootstrapDb)) {
            throw new Error(`No database found at ${dbPath} and no bootstrap database at ${bootstrapDb}`);
        }
        fs.copyFileSync(bootstrapDb, dbPath, fs.constants.COPYFILE_EXCL);
        console.log('Initialized persistent practice database from clean question bank.');
    }
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database connection:', err);
    } else {
        console.log('Connected to SQLite database at', dbPath);
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// ---------------------------------------------------------------------------
// Forward-only column migrations.
// SQLite has no "ADD COLUMN IF NOT EXISTS", so we inspect PRAGMA table_info
// and add only the columns that are genuinely missing. Safe to run on every
// boot against both a fresh and an existing practice.db.
// ---------------------------------------------------------------------------
const REQUIRED_COLUMNS = {
    questions: [
        ['part', 'INTEGER DEFAULT 1'],
        ['part_title', 'TEXT'],
        ['audio_play_policy', "TEXT DEFAULT 'none'"],
        ['prep_seconds', 'INTEGER DEFAULT 0'],
        ['time_limit_seconds', 'INTEGER DEFAULT 0'],
        ['model_answer', 'TEXT'],
        ['rubric', 'TEXT'],
        ['scored_enabling', 'TEXT']
    ],
    test_attempts: [
        ['enabling_spelling', 'REAL']
    ],
    user_responses: [
        ['sub_scores', 'TEXT'],
        ['metrics', 'TEXT'],
        ['time_spent_seconds', 'INTEGER DEFAULT 0']
    ]
};

function tableColumns(table) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table})`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.name));
        });
    });
}

async function runMigrations() {
    for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
        let existing;
        try {
            existing = await tableColumns(table);
        } catch (e) {
            continue; // table not created yet; schema.sql will handle it
        }
        for (const [name, definition] of cols) {
            if (!existing.includes(name)) {
                await new Promise((resolve, reject) => {
                    db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log(`  + migrated: ${table}.${name}`);
            }
        }
    }
}

async function initDB() {
    try {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await new Promise((resolve, reject) => {
            db.exec(schemaSql, (err) => (err ? reject(err) : resolve()));
        });
        console.log('Database schema verified/created successfully.');
        await runMigrations();
    } catch (err) {
        console.error('Failed to run database schema:', err);
        throw err;
    }
}

// Helper methods for Promises
function queryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

module.exports = {
    db,
    initDB,
    queryAll,
    queryOne,
    runQuery
};
