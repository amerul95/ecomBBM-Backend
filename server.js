const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3001;

// Database configuration
const dbConfig = {
    server: 'POLYGOT', 
    database: 'ecomBBMs',
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to false if using a trusted certificate
    },
    trustedConnection: true // Use Windows Authentication
};

// Connect to the database
sql.connect(dbConfig)
    .then(pool => {
        console.log('Connected to the database');

        // Endpoint to fetch products
        app.get('/products', async (req, res) => {
            try {
                const request = pool.request();
                const result = await request.query(`
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
                            FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS image_paths
                    FROM 
                        Products p
                    GROUP BY 
                        p.id, 
                        p.name, 
                        p.new_price, 
                        p.old_price, 
                        p.description, 
                        p.weight, 
                        p.printing_method, 
                        p.printing_size;
                `);
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

    })
    .catch(err => {
        console.error('Database connection failed: ', err);
    });
