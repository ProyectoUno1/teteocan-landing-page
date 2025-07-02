// public/js/adminPanel.js

const saleForm = document.getElementById('saleForm');
const packageSelect = document.getElementById('packageSelect');
const servicesSummary = document.getElementById('servicesSummary');
const totalSale = document.getElementById('totalSale');
const salesTable = document.getElementById('salesTable');
const saleDate = document.getElementById('saleDate');

saleDate.valueAsDate = new Date();

function updateSummaryAndTotal() {
  const selectedOption = packageSelect.options[packageSelect.selectedIndex];
  const packageName = selectedOption.text;
  const packagePrice = Number(selectedOption.dataset.price) || 0;

  servicesSummary.innerHTML = `<li>${packageName}</li>`;
  totalSale.textContent = `$${packagePrice.toLocaleString()}`;

  return { packageName, total: packagePrice };
}

packageSelect.addEventListener('change', updateSummaryAndTotal);

function renderSales(data) {
  salesTable.innerHTML = data
    .map((sale) => `
      <tr class="border-top text-sm">
          <td class="p-2">${sale.id}</td>
          <td class="p-2">${sale.cliente_email}</td>
          <td class="p-2">${sale.nombre_paquete}</td>
          <td class="p-2">${sale.resumen_servicios}</td>
          <td class="p-2">${new Date(sale.fecha).toLocaleDateString()}</td>
          <td class="p-2 text-green-600 font-semibold">$${parseFloat(sale.monto).toLocaleString()}</td>
      </tr>
    `).join('');
}

async function fetchSales() {
  try {
    const res = await fetch('https://tlatec-backend.onrender.com/api/adminPanel/ventas');
    const data = await res.json();
    renderSales(data);
  } catch (error) {
    console.error('Error al cargar ventas:', error);
  }
}

saleForm.addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('customerEmail').value.trim();
  const selectedOption = packageSelect.options[packageSelect.selectedIndex];
  const packageName = selectedOption.text;
  const packagePrice = Number(selectedOption.dataset.price || 0);
  const date = saleDate.value;

  if (!email || !packageName || packageSelect.value === '' || !date) {
    alert('Completa todos los campos.');
    return;
  }

  const resumenServicios = packageName;

  const ventaData = {
    cliente_email: email,
    nombre_paquete: packageName,
    resumen_servicios: resumenServicios,
    monto: packagePrice,
    fecha: date,
    mensaje_continuar: 'La empresa se pondrá en contacto contigo.'
  };

  try {
    const res = await fetch('https://tlatec-backend.onrender.com/api/adminPanel/venta-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventaData),
    });

    if (!res.ok) throw new Error('Error al registrar la venta');

    alert('Venta registrada correctamente y correos enviados.');
    saleForm.reset();
    servicesSummary.innerHTML = '';
    totalSale.textContent = '$0';
    saleDate.valueAsDate = new Date();

    fetchSales();
  } catch (err) {
    console.error(err);
    alert('Hubo un error al registrar la venta.');
  }
});

updateSummaryAndTotal();
fetchSales();
