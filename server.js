
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Comprobar la conexión
app.get('/api/estado', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            conectado: true,
            mensaje: 'Servidor conectado con MySQL'
        });
    } catch (error) {
        console.error('Error de MySQL:', error.message);
        res.status(500).json({
            conectado: false,
            mensaje: 'No se pudo conectar con MySQL'
        });
    }
});

// Recibir los formularios de CampoDirecto y AgroPerfil
app.post('/api/registro', async (req, res) => {
    try {
        const {
            nombre,
            correo,
            ubicacion,
            tipo_usuario,
            proyecto,
            intereses,
            experiencia
        } = req.body;

        if (
            !nombre?.trim() ||
            !correo?.trim() ||
            !tipo_usuario ||
            !['CampoDirecto', 'AgroPerfil'].includes(proyecto)
        ) {
            return res.status(400).json({
                mensaje: 'Completa los campos obligatorios.'
            });
        }

        const sql = `
            INSERT INTO usuarios
            (nombre, correo, ubicacion, tipo_usuario,
             proyecto, intereses, experiencia)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.execute(sql, [
            nombre.trim(),
            correo.trim(),
            ubicacion?.trim() || null,
            tipo_usuario,
            proyecto,
            intereses?.trim() || null,
            experiencia?.trim() || null
        ]);

        res.status(201).json({
            mensaje: '¡Tus datos se guardaron correctamente!'
        });
    } catch (error) {
        console.error('Error al guardar:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'Ese correo ya está registrado.'
            });
        }

        res.status(500).json({
            mensaje: 'No se pudieron guardar los datos.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor disponible en http://localhost:${PORT}`);
});
