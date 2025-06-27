const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv'); // Importa dotenv
const path = require('path');
const pagosRoutes = require('./routes/pagos');
const webhookRoutes = require('./routes/webhook');



// Carga las variables de entorno desde el archivo .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3000;
<<<<<<< HEAD

app.use(cors({
  origin: 'https://tlatec.teteocan.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json()); // Para parsear JSON en las peticiones
=======
//cors
app.use(cors());
app.use(express.json());

app.use('/api/pagos', pagosRoutes);         
app.use('/api/webhook', webhookRoutes);     

>>>>>>> f83f2ecc7cdd184cc28223dc8ecd18bb9cd71d60

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
