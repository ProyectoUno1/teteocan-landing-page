const fs = require('fs');
const path = require('path');
const pool = require('../../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailController = require('../../pdf/controllers/emailController');
const stripePrices = require('../../stripePrices');




const preciosFile = path.join(__dirname, '../../precios.json');

// crearSuscripcionStripe (modificado para retornar ventaId)
const crearSuscripcionStripe = async (req, res) => {
  try {
    const { clienteEmail, orderData, tipoSuscripcion, planId } = req.body;

    if (!clienteEmail || !orderData || !planId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const preciosRaw = fs.readFileSync(preciosFile, 'utf-8');
    const precios = JSON.parse(preciosRaw);
    const tipo = ['mensual', 'anual'].includes(tipoSuscripcion) ? tipoSuscripcion : 'mensual';

    const precioOficial = precios[tipo]?.[planId.toLowerCase()];
    if (precioOficial === undefined) {
      return res.status(400).json({ message: `No existe el plan "${planId}"` });
    }

    const isTitan = planId.toLowerCase() === 'titan';
    const isAnual = tipo === 'anual';
    const extrasGratis = ['logotipo', 'tpv', 'negocios'];
    const preciosExtras = precios[tipo]?.extras || {};
    const extrasSeparados = [];

    for (const extra of orderData.extrasSeleccionados || []) {
      const precioExtra = preciosExtras[extra];
      if (precioExtra === undefined) {
        return res.status(400).json({ message: `Extra "${extra}" no existe.` });
      }

      const esGratis = isTitan && isAnual && extrasGratis.includes(extra);

      extrasSeparados.push({
        nombre: extra,
        precio: esGratis ? 0 : precioExtra,
        cantidad: 1,
        descripcion: `Servicio extra: ${extra}`,
        esGratis: esGratis
      });
    }

    const montoSuscripcion = precioOficial;
    if (orderData.monto && Number(orderData.monto) !== montoSuscripcion) {
      return res.status(400).json({
        message: `Monto incorrecto para suscripción. Esperado: ${montoSuscripcion}, recibido: ${orderData.monto}`
      });
    }

    let customer;
    const existing = await stripe.customers.list({ email: clienteEmail, limit: 1 });
    customer = existing.data.length ? existing.data[0] : await stripe.customers.create({
      email: clienteEmail,
      name: orderData.nombreCliente || clienteEmail
    });

    // Armar los line_items con los priceId de stripePrices.js
    const line_items = [];

    // Paquete principal
    const priceIdPaquete = stripePrices[tipo]?.[planId.toLowerCase()];
    if (!priceIdPaquete) {
      return res.status(400).json({ message: `No se encontró el priceId para el paquete "${planId}" tipo "${tipo}"` });
    }
    line_items.push({
      price: priceIdPaquete,
      quantity: 1
    });


    for (const extra of orderData.extrasSeleccionados || []) {
      const esGratis = isTitan && isAnual && extrasGratis.includes(extra);
      if (!esGratis) {
        const priceIdExtra = stripePrices.extras[extra];
        if (!priceIdExtra) {
          return res.status(400).json({ message: `No se encontró el priceId para el extra "${extra}"` });
        }
        line_items.push({
          price: priceIdExtra,
          quantity: 1
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items,
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/cancel.html`,
      metadata: {
        planId,
        tipoSuscripcion: tipo,
        clienteEmail,
        nombrePaquete: orderData.nombrePaquete,
        tipo: 'suscripcion',
        extrasSeparados: JSON.stringify(extrasSeparados)
      }
    });


    const result = await pool.query(`
  INSERT INTO ventas (
    stripe_session_id,
    cliente_email,
    nombre_paquete,
    resumen_servicios,
    monto,
    fecha,
    mensaje_continuar,
    tipo_suscripcion,
    estado
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pendiente') RETURNING id;
`, [
      session.id,
      clienteEmail,
      orderData.nombrePaquete,
      orderData.resumenServicios,
      orderData.monto,
      new Date(),
      orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo.',
      orderData.tipoSuscripcion
    ]);


  } catch (error) {
    console.error('Error en crearSuscripcionStripe:', error);
    res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
  }
};

// crearPagoUnicoStripe (modificado para usar ventaId)
const crearPagoUnicoStripe = async (req, res) => {
  try {
    const { clienteEmail, servicios, ventaId } = req.body;

    if (!clienteEmail || !servicios || servicios.length === 0) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }


    const serviciosPagados = servicios.filter(servicio => servicio.precio > 0);
    if (serviciosPagados.length === 0) {
      return res.status(400).json({
        message: 'No hay servicios con costo para procesar',
        serviciosGratuitos: servicios.filter(s => s.precio === 0)
      });
    }

    const montoTotal = serviciosPagados.reduce((total, s) => total + (s.precio * (s.cantidad || 1)), 0);

    let customer;
    const existing = await stripe.customers.list({ email: clienteEmail, limit: 1 });
    customer = existing.data.length ? existing.data[0] : await stripe.customers.create({ email: clienteEmail });

    const lineItems = [];
    for (const servicio of serviciosPagados) {
      const product = await stripe.products.create({
        name: `Servicio Extra: ${servicio.nombre}`,
        description: servicio.descripcion || `Servicio adicional: ${servicio.nombre}`,
        metadata: {
          tipo: 'servicio_extra',
          nombre_servicio: servicio.nombre
        }
      });

      const price = await stripe.prices.create({
        unit_amount: servicio.precio * 100,
        currency: 'mxn',
        product: product.id
      });

      lineItems.push({ price: price.id, quantity: servicio.cantidad || 1 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/extras-success.html?session_id={CHECKOUT_SESSION_ID}&tipo=extras`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/cancel.html`,
      metadata: {
        clienteEmail,
        tipo: 'pago_unico',
        servicios: JSON.stringify(serviciosPagados),
        cantidad_servicios: serviciosPagados.length,

      }
    });

    await pool.query(`
  INSERT INTO pagos_unicos (
    stripe_session_id,
    cliente_email,
    servicios,
    monto,
    fecha,
    estado
  ) VALUES ($1, $2, $3, $4, NOW(), 'pendiente')
  ON CONFLICT (stripe_session_id) DO NOTHING;
`, [
      session.id,
      clienteEmail,
      JSON.stringify(serviciosPagados),
      montoTotal,
    ]);

    res.json({
      sessionId: session.id,
      url: session.url,
      serviciosProcesados: serviciosPagados,
      montoTotal,
      serviciosGratuitos: servicios.filter(s => s.precio === 0)
    });

  } catch (error) {
    console.error('Error en crearPagoUnicoStripe:', error);
    res.status(500).json({ message: 'Error al crear pago único', error: error.message });
  }
};


const webhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        if (session.mode === 'subscription') {
          await pool.query(`
            UPDATE ventas 
            SET estado = 'completado', 
                stripe_customer_id = $1,
                fecha_pago = NOW()
            WHERE stripe_session_id = $2
          `, [session.customer, session.id]);

          console.log('Suscripción completada:', session.id);

          const ventaRes = await pool.query('SELECT * FROM ventas WHERE stripe_session_id = $1', [session.id]);

          if (ventaRes.rows.length > 0) {
            const venta = ventaRes.rows[0];
            const extras = JSON.parse(venta.extras_separados || '[]');
            const montoBase = parseFloat(venta.monto);
            const resumenServicios = extras.map(e => e.nombre).join(', ');

            const reqMock = {
              body: {
                ...venta,
                nombrePaquete: venta.nombre_paquete,
                resumenServicios,
                clienteEmail: venta.cliente_email,
                mensajeContinuar: venta.mensaje_continuar,
                tipoSuscripcion: venta.tipo_suscripcion,
                monto: montoBase,
                montoBase,
                montoExtras: 0,
                extras
              }
            };

            const resMock = { status: () => ({ json: () => {} }) };

            await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
            await emailController.sendPaymentConfirmationToClient(reqMock, resMock);
          }

        } else if (session.mode === 'payment') {
          await pool.query(`
            UPDATE pagos_unicos 
            SET estado = 'completado',
                stripe_customer_id = $1,
                fecha_pago = NOW()
            WHERE stripe_session_id = $2
          `, [session.customer, session.id]);

          console.log('Pago único completado:', session.id);

          const pagoRes = await pool.query('SELECT * FROM pagos_unicos WHERE stripe_session_id = $1', [session.id]);

          if (pagoRes.rows.length > 0) {
            const pago = pagoRes.rows[0];
            const servicios = JSON.parse(pago.servicios);

            const reqMock = {
              body: {
                ...pago,
                nombrePaquete: 'Servicios Extra',
                resumenServicios: servicios.map(s => `${s.nombre} (${s.cantidad || 1}x)`).join(', '),
                clienteEmail: pago.cliente_email,
                mensajeContinuar: 'Servicios extra procesados correctamente.',
                tipoSuscripcion: 'pago_unico',
                monto: pago.monto
              }
            };
            const resMock = { status: () => ({ json: () => {} }) };

            await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
            await emailController.sendPaymentConfirmationToClient(reqMock, resMock);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        if (invoice.subscription) {
          console.log('Pago de suscripción exitoso:', invoice.subscription);
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await pool.query(`
          UPDATE ventas 
          SET estado = 'cancelado'
          WHERE stripe_customer_id = $1 AND estado = 'completado'
        `, [subscription.customer]);
        console.log('Suscripción cancelada:', subscription.id);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};



// Obtener suscripciones activas del cliente
const obtenerSuscripcionesCliente = async (req, res) => {
  try {
    const { clienteEmail } = req.params;

    if (!clienteEmail) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    // Buscar en base de datos
    const result = await pool.query(`
      SELECT * FROM ventas 
      WHERE cliente_email = $1 AND estado = 'completado'
      ORDER BY fecha DESC
    `, [clienteEmail]);

    const suscripciones = [];

    for (const venta of result.rows) {
      if (venta.stripe_customer_id) {
        try {
          // Obtener suscripciones de Stripe
          const customer = await stripe.customers.retrieve(venta.stripe_customer_id);
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active'
          });

          for (const sub of subscriptions.data) {
            suscripciones.push({
              id: sub.id,
              status: sub.status,
              current_period_start: new Date(sub.current_period_start * 1000),
              current_period_end: new Date(sub.current_period_end * 1000),
              plan_name: venta.nombre_paquete,
              amount: sub.items.data[0].price.unit_amount / 100,
              currency: sub.items.data[0].price.currency,
              interval: sub.items.data[0].price.recurring.interval
            });
          }
        } catch (stripeError) {
          console.error('Error obteniendo datos de Stripe:', stripeError);
        }
      }
    }

    res.json({ suscripciones });

  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    res.status(500).json({
      message: 'Error obteniendo suscripciones',
      error: error.message
    });
  }
};

// Cancelar suscripción
const cancelarSuscripcion = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { clienteEmail } = req.body;

    if (!subscriptionId || !clienteEmail) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Verificar que la suscripción pertenece al cliente
    const result = await pool.query(`
      SELECT stripe_customer_id FROM ventas 
      WHERE cliente_email = $1 AND estado = 'completado'
    `, [clienteEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Suscripción no encontrada' });
    }

    // Cancelar en Stripe
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    res.json({
      message: 'Suscripción cancelada exitosamente',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceled_at: new Date(subscription.canceled_at * 1000)
      }
    });

  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    res.status(500).json({
      message: 'Error cancelando suscripción',
      error: error.message
    });
  }
};




module.exports = {
  crearSuscripcionStripe,
  crearPagoUnicoStripe,
  webhookStripe,
  obtenerSuscripcionesCliente,
  cancelarSuscripcion
 
};
