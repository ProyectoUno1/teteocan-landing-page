const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const preciosFile = path.join(__dirname, '../precios.json');

const crearSuscripcionDinamica = async (req, res) => {
    try {
        const { clienteEmail, orderData, tipoSuscripcion, planId } = req.body;
        if (!clienteEmail || !orderData || !orderData.monto || !planId) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // Leer precios oficiales
        const preciosRaw = fs.readFileSync(preciosFile, 'utf-8');
        const precios = JSON.parse(preciosRaw);
        const tipo = ['mensual', 'anual'].includes(tipoSuscripcion) ? tipoSuscripcion : 'mensual';

        const precioOficial = precios[tipo]?.[planId.toLowerCase()];
        if (precioOficial === undefined) {
            return res.status(400).json({ message: `No existe el plan "${planId}"` });
        }

        // Calcular extras
        const isTitan = planId.toLowerCase() === 'titan';
        const isAnual = tipo === 'anual';
        const extrasGratis = ['logotipo', 'tpv', 'negocios'];
        const preciosExtras = precios[tipo]?.extras || {};
        let extrasTotales = 0;

        for (const extra of orderData.extrasSeleccionados || []) {
            const precioExtra = preciosExtras[extra];
            if (precioExtra === undefined) {
                return res.status(400).json({ message: `Extra "${extra}" no existe.` });
            }
            const esGratis = isTitan && isAnual && extrasGratis.includes(extra);
            if (!esGratis) extrasTotales += precioExtra;
        }

        const montoCalculado = precioOficial + extrasTotales;
        if (Number(orderData.monto) !== montoCalculado) {
            return res.status(400).json({
                message: `Monto incorrecto. Esperado: ${montoCalculado}, recibido: ${orderData.monto}`
            });
        }

        // Crear preapproval
        const payerEmail = process.env.NODE_ENV !== 'production'
            ? process.env.MP_PAYER_EMAIL
            : clienteEmail;

        const preapproval_data = {
            reason: `Suscripción ${orderData.nombrePaquete}`,
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: montoCalculado,
                currency_id: "MXN",
                start_date: new Date().toISOString(),
                end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            },
            back_url: "https://tlatec.teteocan.com",
            payer_email: payerEmail
        };

        const response = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preapproval_data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error Mercado Pago:', errorText);
            return res.status(500).json({ message: 'Error en Mercado Pago', error: errorText });
        }

        const data = await response.json();
        const preapprovalId = data.id;

        // Guardar en ventas como pendiente
        await pool.query(`
            INSERT INTO ventas (
                preapproval_id,
                cliente_email,
                nombre_paquete,
                resumen_servicios,
                monto,
                fecha,
                mensaje_continuar,
                tipo_suscripcion,
                estado
            ) VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,'pendiente')
            ON CONFLICT (preapproval_id) DO NOTHING;
        `, [
            preapprovalId,
            clienteEmail,
            orderData.nombrePaquete,
            orderData.resumenServicios,
            montoCalculado,
            orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo.',
            tipo
        ]);

        res.json({ init_point: data.init_point });

     } catch (error) {
    console.error('Error en crearSuscripcionDinamica:', error);
    res.status(500).json({
        message: 'Error al crear suscripción',
        error: error.message || 'Error desconocido'
    });
}
};

module.exports = { crearSuscripcionDinamica };