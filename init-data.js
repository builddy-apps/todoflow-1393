import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, 'data');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'app.db'));
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
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

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
if (count.count > 0) {
    console.log('Data already seeded, skipping...');
    db.close();
    process.exit(0);
}

// Sample tasks with realistic data
const tasks = [
    {
        text: "Review Q4 marketing budget and prepare summary for stakeholders",
        completed: 0,
        order_index: 0,
        daysAgo: 0,
        updatedDaysAgo: 0
    },
    {
        text: "Redesign the landing page hero section with new brand colors",
        completed: 0,
        order_index: 1,
        daysAgo: 1,
        updatedDaysAgo: 0
    },
    {
        text: "Schedule dentist appointment for next week",
        completed: 1,
        order_index: 2,
        daysAgo: 5,
        updatedDaysAgo: 2
    },
    {
        text: "Complete the React performance optimization course on Udemy",
        completed: 0,
        order_index: 3,
        daysAgo: 2,
        updatedDaysAgo: 1
    },
    {
        text: "Buy groceries: avocados, spinach, almond milk, quinoa",
        completed: 1,
        order_index: 4,
        daysAgo: 3,
        updatedDaysAgo: 2
    },
    {
        text: "Write unit tests for the authentication module",
        completed: 0,
        order_index: 5,
        daysAgo: 1,
        updatedDaysAgo: 0
    },
    {
        text: "Prepare presentation slides for the Friday team meeting",
        completed: 0,
        order_index: 6,
        daysAgo: 2,
        updatedDaysAgo: 1
    },
    {
        text: "Update dependencies and fix security vulnerabilities in package.json",
        completed: 1,
        order_index: 7,
        daysAgo: 7,
        updatedDaysAgo: 4
    },
    {
        text: "Call mom to discuss Thanksgiving travel plans",
        completed: 1,
        order_index: 8,
        daysAgo: 4,
        updatedDaysAgo: 3
    },
    {
        text: "Research and compare cloud hosting providers for the new project",
        completed: 0,
        order_index: 9,
        daysAgo: 3,
        updatedDaysAgo: 1
    },
    {
        text: "Organize digital photos from the summer trip to Portugal",
        completed: 0,
        order_index: 10,
        daysAgo: 6,
        updatedDaysAgo: 5
    },
    {
        text: "Fix the CSS layout issues on the mobile checkout page",
        completed: 1,
        order_index: 11,
        daysAgo: 8,
        updatedDaysAgo: 6
    },
    {
        text: "Read chapters 5-7 of 'Designing Data-Intensive Applications'",
        completed: 0,
        order_index: 12,
        daysAgo: 4,
        updatedDaysAgo: 2
    },
    {
        text: "Set up automated database backups for production environment",
        completed: 1,
        order_index: 13,
        daysAgo: 10,
        updatedDaysAgo: 7
    },
    {
        text: "Plan weekend hiking trip to Mount Tamalpais - check trail conditions",
        completed: 0,
        order_index: 14,
        daysAgo: 1,
        updatedDaysAgo: 0
    },
    {
        text: "Review and merge the pull request for the user profile feature",
        completed: 0,
        order_index: 15,
        daysAgo: 0,
        updatedDaysAgo: 0
    },
    {
        text: "Renew gym membership before it expires on Friday",
        completed: 1,
        order_index: 16,
        daysAgo: 6,
        updatedDaysAgo: 5
    },
    {
        text: "Create wireframes for the mobile app onboarding flow",
        completed: 0,
        order_index: 17,
        daysAgo: 3,
        updatedDaysAgo: 1
    },
    {
        text: "Backup important documents to the external hard drive",
        completed: 1,
        order_index: 18,
        daysAgo: 12,
        updatedDaysAgo: 10
    },
    {
        text: "Draft email newsletter for the product launch announcement",
        completed: 0,
        order_index: 19,
        daysAgo: 2,
        updatedDaysAgo: 1
    }
];

const insertAll = db.transaction(() => {
    const insertStmt = db.prepare(`
        INSERT INTO tasks (text, completed, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (const task of tasks) {
        const createdAt = new Date(Date.now() - task.daysAgo * 86400000).toISOString();
        const updatedAt = new Date(Date.now() - task.updatedDaysAgo * 86400000).toISOString();
        
        insertStmt.run(
            task.text,
            task.completed,
            task.order_index,
            createdAt,
            updatedAt
        );
    }
});

insertAll();

const finalCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
const completedCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 1').get();
const activeCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 0').get();

console.log(`Seeded: ${finalCount.count} tasks (${activeCount.count} active, ${completedCount.count} completed)`);
console.log('AuraList is ready to use! Your task manager has sample data to explore.');

db.close();