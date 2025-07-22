const fs = require('fs');
const path = require('path');
const pool = require('../../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailController = require('../../pdf/controllers/emailController');
const stripePrices = require('../../stripePrices');

const preciosFile = path.join(__dirname, '../../precios.json');

const crearSuscripcionStripe = async (req, res) => {
  try {
    const { clienteEmail, orderData, tipoSuscripcion, planId, clienteTelefono } = req.body;

    if (!clienteEmail || !orderData || !planId || !clienteTelefono) {
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
        nombre: extra.trim(),
        precio: esGratis ? 0 : precioExtra,
        cantidad: 1,
        esGratis
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

    const line_items = [];

    // Precio del paquete principal (suscripción)
    const priceIdPaquete = stripePrices[tipo]?.[planId.toLowerCase()];
    if (!priceIdPaquete) {
      return res.status(400).json({ message: `No se encontró el priceId para el paquete "${planId}" tipo "${tipo}"` });
    }
    line_items.push({ price: priceIdPaquete, quantity: 1 });

    // Extras que NO son gratis, agregados como pago único con su priceId
    for (const extra of extrasSeparados) {
      if (!extra.esGratis && extra.precio > 0) {
        const priceIdExtra = stripePrices.extras[extra.nombre];
        if (!priceIdExtra) {
          return res.status(400).json({ message: `No se encontró el priceId para el extra "${extra.nombre}"` });
        }
        line_items.push({ price: priceIdExtra, quantity: extra.cantidad || 1 });
      }
    }

    // Crear sesión stripe con todos los items juntos (modo suscripción)
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items,
      mode: 'subscription',  // TODO: confirmar si Stripe acepta line_items con productos únicos aquí
      success_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/cancel.html`,
      metadata: {
        planId,
        tipoSuscripcion: tipo,
        clienteEmail,
        clienteTelefono,
        nombrePaquete: orderData.nombrePaquete,
        tipo: 'suscripcion',
        extrasSeparados: JSON.stringify(extrasSeparados)
      }
    });

    // Guardar venta en la tabla ventas
    const result = await pool.query(`
      INSERT INTO ventas (
        stripe_session_id,
        cliente_email,
        clienteTelefono,
        nombre_paquete,
        resumen_servicios,
        monto,
        fecha,
        mensaje_continuar,
        tipo_suscripcion,
        estado
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pendiente') RETURNING id;
    `, [
      session.id,
      clienteEmail,
      clienteTelefono,
      orderData.nombrePaquete,
      orderData.resumenServicios,
      orderData.monto,
      new Date(),
      orderData.mensajeContinuar || 'La empresa se pondrá en contacto contigo.',
      orderData.tipoSuscripcion
    ]);
    const ventaId = result.rows[0].id;

    // Guardar pagos únicos en la tabla pagos_unicos, pero solo extras pagados > 0
    const extrasPagados = extrasSeparados.filter(e => !e.esGratis && e.precio > 0);
    if (extrasPagados.length > 0) {
      await pool.query(`
        INSERT INTO pagos_unicos (
          stripe_session_id,
          cliente_email,
          servicios,
          monto,
          fecha,
          estado
        ) VALUES ($1,$2,$3,$4,$5,'pendiente')
        ON CONFLICT (stripe_session_id) DO NOTHING;
      `, [
        session.id,
        clienteEmail,
        JSON.stringify(extrasPagados),
        extrasPagados.reduce((acc, e) => acc + e.precio * (e.cantidad || 1), 0),
        new Date()
      ]);
    }

    res.json({
      sessionId: session.id,
      url: session.url,
      extrasSeparados,
      montoSuscripcion,
      ventaId
    });

  } catch (error) {
    console.error('Error en crearSuscripcionStripe:', error);
    res.status(500).json({ message: 'Error al crear suscripción', error: error.message });
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
      case 'checkout.session.completed': {
        const session = event.data.object;

        if (session.mode === 'subscription') {
          // Actualizar estado de venta en 'ventas'
          await pool.query(
            `UPDATE ventas 
             SET estado = 'completado', 
                 stripe_customer_id = $1,
                 fecha_pago = NOW()
             WHERE stripe_session_id = $2`,
            [session.customer, session.id]
          );

          console.log('Suscripción completada:', session.id);

          const ventaRes = await pool.query('SELECT * FROM ventas WHERE stripe_session_id = $1', [session.id]);

          if (ventaRes.rows.length > 0) {
            const venta = ventaRes.rows[0];
            let extras = [];
            try {
              const rawExtras = session.metadata.extrasSeparados;

              if (typeof rawExtras === 'string') {
                extras = JSON.parse(rawExtras);
              } else if (Array.isArray(rawExtras)) {
                extras = rawExtras;
              } else {
                console.warn('Formato inesperado en extrasSeparados:', rawExtras);
              }
            } catch (e) {
              console.error('Error parseando extrasSeparados en webhook:', e);
              extras = [];
            }


            const montoBase = parseFloat(venta.monto);

            // Buscar pagos únicos relacionados a la misma sesión
            const pagoExtraRes = await pool.query(`
              SELECT * FROM pagos_unicos
              WHERE cliente_email = $1
                AND stripe_session_id = $2
                AND estado IN ('pendiente', 'completado')
                AND fecha >= NOW() - INTERVAL '10 minutes'
            `, [venta.cliente_email, session.id]);

            let serviciosExtra = [];
            let montoExtras = 0;

            if (pagoExtraRes.rows.length > 0) {
              const pagoExtra = pagoExtraRes.rows[0];

              try {
                const rawServicios = pagoExtra.servicios;

                if (typeof rawServicios === 'string') {
                  serviciosExtra = JSON.parse(rawServicios);
                } else if (Array.isArray(rawServicios)) {
                  serviciosExtra = rawServicios;
                } else {
                  console.warn('Formato inesperado en pagoExtra.servicios:', rawServicios);
                }
              } catch (e) {
                console.error('Error parseando serviciosExtra en webhook:', e);
                serviciosExtra = [];
              }

              montoExtras = parseFloat(pagoExtra.monto);

              // Marcar pago único como usado para evitar doble uso
              await pool.query(
                `UPDATE pagos_unicos SET estado = 'usado_en_suscripcion' WHERE id = $1`,
                [pagoExtra.id]
              );
            }

            const resumenServicios = venta.resumen_servicios;
            extras = serviciosExtra; 


            const montoTotal = montoBase + montoExtras;

            // Preparar objeto simulado para enviar correos
            const reqMock = {
              body: {
                ...venta,
                nombrePaquete: venta.nombre_paquete,
                resumenServicios,
                clienteEmail: venta.cliente_email,
                clienteTelefono: venta.cliente_telefono,
                mensajeContinuar: venta.mensaje_continuar,
                tipoSuscripcion: venta.tipo_suscripcion,
                monto: montoTotal,
                montoBase,
                montoExtras,
                extras: [...extras, ...serviciosExtra]
              }
            };
            const resMock = { status: () => ({ json: () => { } }) };

            // Enviar correos
            await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
            await emailController.sendPaymentConfirmationToClient(reqMock, resMock);
          }
        } else if (session.mode === 'payment') {
          // Caso para pagos únicos directos (sin suscripción)
          await pool.query(
            `UPDATE pagos_unicos 
             SET estado = 'completado',
                 stripe_customer_id = $1,
                 fecha_pago = NOW()
             WHERE stripe_session_id = $2`,
            [session.customer, session.id]
          );

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
            const resMock = { status: () => ({ json: () => { } }) };

            await emailController.sendOrderConfirmationToCompany(reqMock, resMock);
            await emailController.sendPaymentConfirmationToClient(reqMock, resMock);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          console.log('Pago de suscripción exitoso:', invoice.subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await pool.query(
          `UPDATE ventas 
           SET estado = 'cancelado'
           WHERE stripe_customer_id = $1 AND estado = 'completado'`,
          [subscription.customer]
        );
        console.log('Suscripción cancelada:', subscription.id);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};


const obtenerSuscripcionesCliente = async (req, res) => {
  try {
    const { clienteEmail } = req.params;

    if (!clienteEmail) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    const result = await pool.query(
      `SELECT * FROM ventas 
       WHERE cliente_email = $1 AND estado = 'completado'
       ORDER BY fecha DESC`,
      [clienteEmail]
    );

    const suscripciones = [];

    for (const venta of result.rows) {
      if (venta.stripe_customer_id) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: venta.stripe_customer_id,
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
        } catch (err) {
          console.error('Error obteniendo suscripciones en Stripe:', err);
        }
      }
    }

    res.json({ suscripciones });
  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    res.status(500).json({ message: 'Error al obtener suscripciones', error: error.message });
  }
};

const cancelarSuscripcion = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { clienteEmail } = req.body;

    if (!subscriptionId || !clienteEmail) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const result = await pool.query(
      `SELECT stripe_customer_id FROM ventas 
       WHERE cliente_email = $1 AND estado = 'completado'`,
      [clienteEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Suscripción no encontrada' });
    }

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
    res.status(500).json({ message: 'Error cancelando suscripción', error: error.message });
  }
};

const crearPagoUnicoStripe = async (req, res) => {
  try {
    const { clienteEmail, serviciosSeleccionados = [], resumenServicios, monto } = req.body;

    if (!clienteEmail || !serviciosSeleccionados.length || !monto) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para el pago único' });
    }

    const line_items = serviciosSeleccionados.map(servicio => {
      const priceId = stripePrices.extras[servicio.nombre];
      if (!priceId) throw new Error(`No se encontró priceId para el servicio ${servicio.nombre}`);

      return {
        price: priceId,
        quantity: servicio.cantidad || 1
      };
    });

    const customer = await stripe.customers.create({
      email: clienteEmail
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://tlatec.teteocan.com'}/stripe/cancel.html`,
      metadata: {
        tipo: 'pago_unico',
        clienteEmail
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
      ) VALUES ($1, $2, $3, $4, $5, 'pendiente')
    `, [
      session.id,
      clienteEmail,
      JSON.stringify(serviciosSeleccionados),
      monto,
      new Date()
    ]);

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error en crearPagoUnicoStripe:', error);
    res.status(500).json({ message: 'Error al crear pago único', error: error.message });
  }
};


module.exports = {
  crearSuscripcionStripe,
  webhookStripe,
  obtenerSuscripcionesCliente,
  cancelarSuscripcion, crearPagoUnicoStripe
};
