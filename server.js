const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const bodyParser = require('body-parser');
const supabase = require('./supabase');

// Middleware to serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(bodyParser.json());

// ----- API ROUTES -----

// Get all menu categories with items
app.get('/api/menu', async (req, res) => {
    try {
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order');
            
        if (catError) throw catError;

        const { data: items, error: itemError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('is_available', true)
            .order('sort_order');
            
        if (itemError) throw itemError;

        // Group items by category
        const menu = categories.map(cat => ({
            ...cat,
            items: items.filter(item => item.category_id === cat.id)
        }));

        res.json(menu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Place a new order
app.post('/api/orders', async (req, res) => {
    try {
        const { customer_name, customer_phone, items, total, notes } = req.body;
        
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                customer_name,
                customer_phone,
                items,
                total,
                notes,
                status: 'pending'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----- VIEW ROUTES -----

// Route for the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route for admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
