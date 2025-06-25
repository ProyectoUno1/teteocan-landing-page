const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv'); // Importa dotenv
const path = require('path');

// Carga las variables de entorno desde el archivo .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


// Importa el controlador de email
const emailController = require('./pdf/controllers/emailController');

// --- Rutas de Prueba ---
// Ruta para simular la generación de una orden de pago (envío a la empresa)
app.post('/api/orden', async (req, res) => {
    try {
        const { nombrePaquete, resumenServicios, monto, fecha } = req.body;
        await emailController.sendOrderConfirmationToCompany(req, res); // Llama a la función del controlador
    } catch (error) {
        console.error('Error al generar orden de pago:', error);
        res.status(500).json({ message: 'Error al generar orden de pago', error: error.message });
    }
});

// Ruta para simular la confirmación de pago (envío al cliente)
app.post('/api/confirmar', async (req, res) => {
    try {
        const { nombrePaquete, resumenServicios, monto, fecha, clienteEmail } = req.body;
        req.body.mensajeContinuar = "La empresa se pondrá en contacto con usted para continuar con los siguientes pasos."; // Mensaje fijo para el cliente
        await emailController.sendPaymentConfirmationToClient(req, res); // Llama a la función del controlador
    } catch (error) {
        console.error('Error al confirmar pago:', error);
        res.status(500).json({ message: 'Error al confirmar pago', error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('API de Teteocan Landing Page');
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
