const saleForm = document.getElementById('saleForm');
const packageSelect = document.getElementById('packageSelect');
const servicesSummary = document.getElementById('servicesSummary');
const totalSale = document.getElementById('totalSale');
const salesTable = document.getElementById('salesTable');
const saleDate = document.getElementById('saleDate');
const saleSubscription = document.getElementById('saleSubscription');
const filterPackageSelect = document.getElementById('filterPackage');
const filterMonthSelect = document.getElementById('filterMonth');


// Definición de paquetes y servicios
const paquetes = {
  explorador: {
    nombre: "Paquete Explorador",
    servicios: [
      "1 dashboard automático",
      "1 imagen genérica editable",
      "demo de pagina web tipo landing",
      "app para registro simple",
      "canal de whatsapp",
    ],
    precio: 0
  },
  impulso: {
    nombre: "Paquete Impulso",
    servicios: [
      "paquete explorador +",
      "2 dashboards",
      "sitio web profesional express",
      "guía de uso",
    ],
    precio: 299,
  },
  dominio: {
    nombre: "Paquete Dominio",
    servicios: [
      "paquete impulso +",
      "1 dashboard",
      "4 imágenes mensuales para redes sociales",
      "Panel drive",
      "Análisis mensual ejecutivo",
      "calendario de redes sociales",
      "bienvenida para tus clientes",
    ],
    precio: 359,
  },
  titan: {
    nombre: "Paquete Titan",
    servicios: [
      "paquete dominio +",
      "2 dashboards avanzados",
      "Certificado digital validado",
      "Catálogo editable para WhatsApp y redes",
      "Asesoría directa por WhatsApp",
      "Configuración y ajuste de Google Business",
      "Asistente de objetivos quincenales basado en datos reales",
      "Scraping de 100 registros de potenciales clientes",
      "Encuesta de satisfacción para tus clientes",
      "Prompt profesional para GPT asistente de negocios",
      "Reporte mensual de ventas (basado en los datos analizados)",
      "QR vinculado a menú o tiendas",
    ],
    precio: 499,
  },
};

// Establece la fecha por defecto
saleDate.valueAsDate = new Date();

// Generar opciones del filtro por paquete dinámicamente
function cargarOpcionesFiltroPaquetes() {
  Object.entries(paquetes).forEach(([key, paquete]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = paquete.nombre;
    filterPackageSelect.appendChild(option);
  });
}

// Obtener la key del paquete según su nombre
function getKeyByPackageName(nombrePaquete) {
  for (const key in paquetes) {
    if (paquetes[key].nombre.toLowerCase() === nombrePaquete.toLowerCase()) {
      return key;
    }
  }
  return null;
}

// Actualiza el resumen visual y el total
function updateSummaryAndTotal() {
  const selectedOption = packageSelect.options[packageSelect.selectedIndex];
  const packageId = selectedOption.value;
  const paquete = paquetes[packageId];

  if (!paquete) {
    servicesSummary.innerHTML = '';
    totalSale.textContent = '$0';
    return { packageName: '', total: 0 };
  }

  servicesSummary.innerHTML = paquete.servicios.map(s => `<li>${s}</li>`).join('');
  totalSale.textContent = `$${paquete.precio.toLocaleString()}`;

  return { packageName: paquete.nombre, total: paquete.precio, servicios: paquete.servicios };
}

// Renderizar tabla de ventas con filtros
function renderSales(data) {
  const filterPackage = filterPackageSelect.value;
  const filterMonth = filterMonthSelect.value;

  const filtered = data.filter(sale => {
    const paqueteKey = getKeyByPackageName(sale.nombre_paquete);
    const matchesPackage = !filterPackage || paqueteKey === filterPackage;

    const saleDate = new Date(sale.fecha);
    const saleMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
    const matchesMonth = !filterMonth || filterMonth === saleMonth;

    return matchesPackage && matchesMonth;
  });

  salesTable.innerHTML = filtered.length > 0
    ? filtered.map(sale => `
      <tr class="border-top text-sm">
        <td class="p-2">${sale.id}</td>
        <td class="p-2">${sale.cliente_email}</td>
        <td class="p-2">${sale.nombre_paquete}</td>
        <td class="p-2">${sale.resumen_servicios}</td>
        <td class="p-2">${new Date(sale.fecha).toLocaleDateString()}</td>
        <td class="p-2">${sale.tipo_suscripcion || '-'}</td>
        <td class="p-2 text-green-600 font-semibold">$${parseFloat(sale.monto).toLocaleString()}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" class="p-2 text-center text-gray-500">No hay resultados para los filtros seleccionados.</td></tr>`;
}

// Obtener todas las ventas
async function fetchSales() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No se encontró token de autenticación');

    const res = await fetch('https://tlatec-backend.onrender.com/api/adminPanel/ventas', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Error al cargar ventas');

    const data = await res.json();
    renderSales(data);
  } catch (error) {
    console.error('Error al cargar ventas:', error);
  }
}


// Registrar una nueva venta
saleForm.addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('customerEmail').value.trim();
  const selectedOption = packageSelect.options[packageSelect.selectedIndex];
  const packageId = selectedOption.value;
  const paquete = paquetes[packageId];
  const date = saleDate.value;
  const tipoSuscripcion = document.getElementById('saleSubscription').value;

   if (!email || !paquete || packageId === '' || !date || !tipoSuscripcion) {
    Swal.fire({
      icon: 'warning',
      title: 'CAMPOS INCOMPLETOS',
      text: 'Por favor, completa todos los campos.',
    });
    return;
  }

  const ventaData = {
    cliente_email: email,
    nombre_paquete: paquete.nombre,
    resumen_servicios: paquete.servicios.join(', '),
    monto: paquete.precio,
    fecha: date,
    mensaje_continuar: 'La empresa se pondrá en contacto contigo.',
    tipo_suscripcion: tipoSuscripcion,
  };

  try {
    Swal.fire({
      title: 'REGISTRANDO VENTA...',
      text: 'Por favor espera mientras se envían los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const token = localStorage.getItem('adminToken');
    const res = await fetch('https://tlatec-backend.onrender.com/api/adminPanel/venta-manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(ventaData),
    });

    if (!res.ok) throw new Error('Error al registrar la venta');

    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'VENTA REGISTRADA',
      text: 'Se registró correctamente y se enviaron los correos.',
    });

    saleForm.reset();
    servicesSummary.innerHTML = '';
    totalSale.textContent = '$0';
    saleDate.valueAsDate = new Date();

    fetchSales();
  } catch (err) {
    console.error(err);
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'ERROR',
      text: 'Hubo un error al registrar la venta.',
    });
  }
});


// Eventos iniciales
packageSelect.addEventListener('change', updateSummaryAndTotal);
filterPackageSelect.addEventListener('change', fetchSales);
filterMonthSelect.addEventListener('change', fetchSales);

updateSummaryAndTotal();
cargarOpcionesFiltroPaquetes();
fetchSales();


document.getElementById('exportToSheetsButton').addEventListener('click', async () => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      Swal.fire('No estás autenticado', '', 'warning');
      return;
    }

    Swal.fire({
      title: 'Exportando a Google Sheets...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await fetch('https://tlatec-backend.onrender.com/api/exportar-ventas', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    Swal.close();

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Error al exportar a Google Sheets');
    }

    Swal.fire('¡Exportación completada!', 'Los datos fueron enviados a Google Sheets.', 'success');
  } catch (error) {
    console.error('Error al exportar a Google Sheets:', error);
    Swal.fire('Error', 'No se pudo exportar a Google Sheets.', 'error');
  }
});

const clearDBButton = document.getElementById('clearDBButton');

clearDBButton.addEventListener('click', async () => {
  const confirmed = await Swal.fire({
    title: '¿ESTÁS SEGURO?',
    text: "¡Esto eliminará todas las ventas y no se podrá deshacer!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'SÍ, VACIAR',
    cancelButtonText: 'CANCELAR'
  });

  if (confirmed.isConfirmed) {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('https://tlatec-backend.onrender.com/api/adminPanel/ventas', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Error al vaciar la base de datos');

      Swal.fire(
        '¡Eliminado!',
        'Todas las ventas han sido eliminadas.',
        'success'
      );

      fetchSales(); // Refrescar tabla
    } catch (error) {
      console.error(error);
      Swal.fire(
        'Error',
        'No se pudo vaciar la base de datos. Intenta más tarde.',
        'error'
      );
    }
  }
});
// Registrar nuevo administrador
// Este botón redirige a la página de registro de administrador
document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('registerAdminButton');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        window.location.href = '../login-admin/register.html';
      });
    }
  });
