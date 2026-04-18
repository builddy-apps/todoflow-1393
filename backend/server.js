import express from 'express';
import cors from 'cors';
import {
    getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    clearCompletedTasks,
    reorderTasks
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.get('/api/tasks', (req, res) => {
    try {
        const tasks = getAllTasks();
        res.json({ success: true, data: tasks });
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }
        
        const allTasks = getAllTasks();
        const maxOrderIndex = allTasks.length > 0 
            ? Math.max(...allTasks.map(t => t.order_index)) 
            : -1;
        
        const id = createTask(text.trim(), maxOrderIndex + 1);
        const newTasks = getAllTasks();
        const newTask = newTasks.find(t => t.id === id);
        
        res.status(201).json({ success: true, data: newTask });
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ success: false, error: 'Failed to create task' });
    }
});

app.put('/api/tasks/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid task ID' });
        }
        
        const { text, completed } = req.body;
        const updates = {};
        
        if (text !== undefined) {
            if (typeof text !== 'string' || text.trim().length === 0) {
                return res.status(400).json({ success: false, error: 'Text cannot be empty' });
            }
            updates.text = text.trim();
        }
        
        if (completed !== undefined) {
            updates.completed = completed ? 1 : 0;
        }
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }
        
        const changes = updateTask(id, updates);
        if (changes === 0) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        
        const tasks = getAllTasks();
        const updatedTask = tasks.find(t => t.id === id);
        
        res.json({ success: true, data: updatedTask });
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ success: false, error: 'Failed to update task' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid task ID' });
        }
        
        const changes = deleteTask(id);
        if (changes === 0) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        
        res.json({ success: true, data: { id } });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ success: false, error: 'Failed to delete task' });
    }
});

app.delete('/api/tasks/clear-completed', (req, res) => {
    try {
        const changes = clearCompletedTasks();
        res.json({ success: true, data: { deletedCount: changes } });
    } catch (err) {
        console.error('Error clearing completed tasks:', err);
        res.status(500).json({ success: false, error: 'Failed to clear completed tasks' });
    }
});

app.put('/api/tasks/reorder', (req, res) => {
    try {
        const { taskIds } = req.body;
        if (!Array.isArray(taskIds)) {
            return res.status(400).json({ success: false, error: 'taskIds must be an array' });
        }
        
        if (taskIds.length === 0) {
            return res.status(400).json({ success: false, error: 'taskIds cannot be empty' });
        }
        
        for (const id of taskIds) {
            if (typeof id !== 'number' || !Number.isInteger(id)) {
                return res.status(400).json({ success: false, error: 'All task IDs must be integers' });
            }
        }
        
        reorderTasks(taskIds);
        const tasks = getAllTasks();
        res.json({ success: true, data: tasks });
    } catch (err) {
        console.error('Error reordering tasks:', err);
        res.status(500).json({ success: false, error: 'Failed to reorder tasks' });
    }
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`AuraList server running on http://localhost:${PORT}`);
});