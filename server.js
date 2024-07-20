const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());

// Serve static files from the "public" directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Database configuration
const dbConfig = {
    user: 'test',
    password: '123',
    server: 'POLYGOT', 
    database: 'ecomBBM',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Connect to the database
sql.connect(dbConfig, err => {
    if (err) {
        console.error('Database connection failed: ', err);
        return;
    }
    console.log('Connected to the database');
});

// Endpoint to fetch products with optional category filtering
app.get('/products/:category?', async (req, res) => {
    try {
        const { category } = req.params; // Get the category from URL parameters

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

        const request = new sql.Request();
        if (category) {
            request.input('category', sql.NVarChar, category); // Bind the category parameter
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
