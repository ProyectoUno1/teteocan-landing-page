const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv'); // Para cargar variables de entorno desde .env
const path = require('path');
const pool = require('./db');
const authRoutes = require('./auth/routes/authRoutes'); // Nueva ruta
const { verifyToken } = require('./auth/middlewares/authMiddleware'); // Middleware
require('./crondb/cleanPendiente');

// importar rutas definidas para pagos
const pagosRoutes = require('./routes/pagos');
const preciosRouter = require('./routes/precios'); //nueva ruta para obtener los precios
const adminRoutes = require('./routes/adminPanel');
const stripeRoutes = require('./routes/stripe'); // Nueva ruta para Stripe

// carga las variables de entorno del archivo .env ubicado en la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3000;

//permitir CORS (solicitudes desde otros dominios)
app.use(cors());

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));


//parsear JSON en las solicitudes entrantes
app.use(express.json());

// Rutas principales: 
// '/api/pagos' -> para crear suscripciones y pagos
app.use('/api/pagos', pagosRoutes);  

// '/api/stripe' -> para pagos con Stripe
app.use('/api/stripe', stripeRoutes);

app.use('/api/precios', preciosRouter);

app.use('/api/adminPanel', verifyToken, adminRoutes);

app.use('/api/auth', authRoutes); // Nueva ruta para autenticación

app.use('/api/public', require('./routes/public'));



// controlador de email para pruebas manuales
const emailController = require('./pdf/controllers/emailController');


// endpoint para simular generación de orden y enviar correo a empresa
app.post('/api/orden', async (req, res) => {
    try {
        await emailController.sendOrderConfirmationToCompany(req, res);
    } catch (error) {
        console.error('Error al generar orden de pago:', error);
        res.status(500).json({ message: 'Error al generar orden de pago', error: error.message });
    }
});

// endpoint para simular confirmación de pago y enviar correo a cliente
app.post('/api/confirmar', async (req, res) => {
    try {
        // se agrega mensaje para el cliente
        req.body.mensajeContinuar = "La empresa se pondrá en contacto con usted para continuar con los siguientes pasos.";
        await emailController.sendPaymentConfirmationToClient(req, res);
    } catch (error) {
        console.error('Error al confirmar pago:', error);
        res.status(500).json({ message: 'Error al confirmar pago', error: error.message });
    }
});


pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error(' Error al conectar a Neon/Postgres:', err);
  } else {
    console.log('Conexión a Neon/Postgres exitosa. Hora actual:', result.rows[0].now);
  }
});

// ruta base para verificar que el backend está corriendo
app.get('/', (req, res) => {
    res.send('API de Teteocan Landing Page');
});

// iniciar servidor en el puerto configurado
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

const exportGoogleRoutes = require('./routes/exportGoogle');
app.use('/api', exportGoogleRoutes);

