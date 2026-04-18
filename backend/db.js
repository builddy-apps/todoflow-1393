import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_index);
`);

export function getAllTasks() {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY order_index ASC');
    return stmt.all();
}

export function createTask(text, orderIndex) {
    const stmt = db.prepare(`
        INSERT INTO tasks (text, order_index)
        VALUES (?, ?)
    `);
    const info = stmt.run(text, orderIndex);
    return info.lastInsertRowid;
}

export function updateTask(id, updates) {
    const allowedColumns = ['text', 'completed', 'order_index'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedColumns.includes(key)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }

    if (fields.length === 0) return 0;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
    const info = stmt.run(...values);
    return info.changes;
}

export function deleteTask(id) {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const info = stmt.run(id);
    return info.changes;
}

export function clearCompletedTasks() {
    const stmt = db.prepare('DELETE FROM tasks WHERE completed = 1');
    const info = stmt.run();
    return info.changes;
}

export function reorderTasks(taskIds) {
    const reorderStmt = db.prepare(`
        UPDATE tasks 
        SET order_index = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `);

    const updateMany = db.transaction((ids) => {
        ids.forEach((id, index) => {
            reorderStmt.run(index, id);
        });
    });

    updateMany(taskIds);
    return true;
}