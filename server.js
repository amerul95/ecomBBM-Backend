const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes'); // Import authentication routes
const dbConfigEcom = require('./config/dbConfigecom.js'); // Correct path to ecom config
const dbConfigAuth = require('./config/dbConfigauth.js'); // Correct path to auth config

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Serve static files from the "public" directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Create connection pools for each database
const ecomDBPool = new sql.ConnectionPool(dbConfigEcom);
const authDBPool = new sql.ConnectionPool(dbConfigAuth);

// Connect to the ecomBBM database
ecomDBPool.connect(err => {
    if (err) {
        console.error('Failed to connect to ecomBBM database:', err);
    } else {
        console.log('Connected to ecomBBM database');
    }
});

// Connect to the AuthDB database
authDBPool.connect(err => {
    if (err) {
        console.error('Failed to connect to AuthDB database:', err);
    } else {
        console.log('Connected to AuthDB database');
    }
});

// Use authentication routes
app.use('/auth', authRoutes);

// Existing product endpoint
app.get('/products/:category?', async (req, res) => {
    try {
        const { category } = req.params;

        let query = `
        SELECT 
            p.id,
            p.name,
            p.new_price,
            p.old_price,
            p.description,
            p.weight,
            p.printing_method,
            p.printing_size,
            STUFF((
                SELECT ', ' + pc.color
                FROM ProductColors pc
                WHERE pc.product_id = p.id
                FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS colors,
            STUFF((
                SELECT ', ' + pm.material
                FROM ProductMaterials pm
                WHERE pm.product_id = p.id
                FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS materials,
            STUFF((
                SELECT ', ' + ps.size
                FROM ProductSizes ps
                WHERE ps.product_id = p.id
                FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS sizes,
            STUFF((
                SELECT ', ' + i.image_path
                FROM Images i
                WHERE i.product_id = p.id
                FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS image_paths,
            p.category
        FROM 
            Products p
        ${category ? 'WHERE p.category = @category' : ''}
        GROUP BY 
            p.id, 
            p.name, 
            p.new_price, 
            p.old_price, 
            p.description, 
            p.weight, 
            p.printing_method, 
            p.printing_size,
            p.category;
        `;

        const request = new sql.Request(ecomDBPool); // Use ecomDBPool for product queries
        if (category) {
            request.input('category', sql.NVarChar, category);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error querying the database: ', err);
        res.status(500).send('Server error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
