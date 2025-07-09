// VARIABLES GLOBALES DEL CARRITO 
let selectedPackage = null;
let tipoSuscripcion = 'mensual';
let basePrice = 0;
let finalPrice = 0;


let confirmModal;
let confirmPackageName;
let confirmPackagePrice;
let closeConfirmModalBtn;
let btnConfirmPurchase;
let btnCancelPurchase;
let toggleExtrasBtn;
let extraServicesForm;
let servicesList;
let toggleSubscriptionType;


document.addEventListener('DOMContentLoaded', () => {
    // Recuperar paquete y tipo de suscripción guardados en localStorage
    const paqueteGuardado = localStorage.getItem('selectedPackage');
    const tipoSuscripcionGuardado = localStorage.getItem('tipoSuscripcion') || 'mensual';

    if (!paqueteGuardado) {
        alert('No hay paquete seleccionado. Por favor, selecciona un paquete primero.');
        window.location.href = 'index.html';
        return;
    }

    selectedPackage = JSON.parse(paqueteGuardado);
    tipoSuscripcion = tipoSuscripcionGuardado;

    // Asignar referencias a elementos DOM que usarás
    confirmPackageName = document.getElementById('confirmPackageName');
    confirmPackagePrice = document.getElementById('confirmPackagePrice');
    btnConfirmPurchase = document.getElementById('btnConfirmPurchase');
    btnCancelPurchase = document.getElementById('btnCancelPurchase');
    toggleExtrasBtn = document.getElementById('toggleExtrasBtn');
    extraServicesForm = document.getElementById('extraServicesForm');
    servicesList = document.getElementById('servicesList');
    toggleSubscriptionType = document.getElementById('toggleSubscriptionType');

    // Cargar precios oficiales desde backend
    fetch('https://tlatec-backend.onrender.com/api/precios')
        .then(res => {
            if (!res.ok) throw new Error('Error al obtener precios');
            return res.json();
        })
        .then(data => {
            preciosOficiales = data;
            cargarDatosPaqueteEnCarrito(selectedPackage, tipoSuscripcion);
        })
        .catch(err => {
            console.error('Error al cargar precios:', err);
            Swal.fire('Error', 'No se pudieron cargar los precios oficiales.', 'error');
        });

    // Event listener para cambios en extras
    if (extraServicesForm) {
        extraServicesForm.addEventListener('change', updatePriceWithExtras);
    }

    // Listener para cambio de tipo de suscripción (switch)
    if (toggleSubscriptionType) {
        // Poner el estado inicial del toggle
        toggleSubscriptionType.checked = tipoSuscripcion === 'anual';

        toggleSubscriptionType.addEventListener('change', (e) => {
            tipoSuscripcion = e.target.checked ? 'anual' : 'mensual';
            // Actualiza precios y recarga datos
            actualizarPrecios(tipoSuscripcion); // si tienes esta función
            cargarDatosPaqueteEnCarrito(selectedPackage, tipoSuscripcion);
        });
    }
    btnConfirmPurchase?.addEventListener('click', confirmarCompraHandler);


    // Botón cancelar compra
    btnCancelPurchase?.addEventListener('click', () => {
        localStorage.removeItem('selectedPackage');
        localStorage.removeItem('tipoSuscripcion');
        window.location.href = 'index.html';
    });
});




// Form validation (if forms are added later)
function validateEmail(email) {
    // Expresión regular para validación de email
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}




function cargarDatosPaqueteEnCarrito(selectedPackage, tipoSuscripcion) {
    const tipo = tipoSuscripcion || 'mensual';
    const spId = selectedPackage.id?.toLowerCase();

    // Validar precio oficial
    const precioJSON = preciosOficiales?.[tipo]?.[spId];
    if (typeof precioJSON !== 'number' || isNaN(precioJSON)) {
        console.error(`Precio inválido para el paquete "${spId}" y tipo "${tipo}"`);
        Swal.fire('Error', 'No se encontró el precio oficial del paquete seleccionado.', 'error');
        return;
    }

    // Actualizar precio en el objeto
    selectedPackage.price = precioJSON;

    // Mostrar datos en el DOM
    document.getElementById('confirmPackageName').textContent = selectedPackage.name || '';
    const subscriptionTypeDisplay = document.getElementById('subscriptionTypeDisplay');
    if (subscriptionTypeDisplay) {
        subscriptionTypeDisplay.textContent = tipo === 'anual' ? 'Suscripción Anual' : 'Suscripción Mensual';
    }

    setPackageBasePrice(precioJSON);

    // Mostrar servicios incluidos en la lista
    if (servicesList) {
        servicesList.innerHTML = '';
        if (selectedPackage.servicios && selectedPackage.servicios.length) {
            selectedPackage.servicios.forEach(servicio => {
                const li = document.createElement('li');
                li.textContent = servicio;
                servicesList.appendChild(li);
            });
        }
    }

    // Actualizar precios y lista de extras en formulario
    updateExtraPricesInForm();
    updatePriceWithExtras();
}

// Toggle para mostrar u ocultar extras y limpiar selección si se ocultan
document.addEventListener('DOMContentLoaded', function () {
    const toggleExtrasBtn = document.getElementById('toggleExtrasBtn');
    const extrasContainer = document.getElementById('extrasContainer'); // asegúrate que exista en HTML

    if (toggleExtrasBtn && extrasContainer) {
        toggleExtrasBtn.addEventListener('click', function () {
            const isExpanded = extrasContainer.classList.contains('expanded');

            if (isExpanded) {
                // Colapsar extras
                extrasContainer.classList.remove('expanded');
                extrasContainer.classList.add('collapsed');
                toggleExtrasBtn.classList.remove('active');
                toggleExtrasBtn.querySelector('.toggle-text').textContent = 'Añadir servicios';

                // Limpiar selecciones
                extrasContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

                updatePriceWithExtras();
                updateSelectedExtrasList();
            } else {
                // Expandir extras
                extrasContainer.classList.remove('collapsed');
                extrasContainer.classList.add('expanded');
                toggleExtrasBtn.classList.add('active');
                toggleExtrasBtn.querySelector('.toggle-text').textContent = 'Ocultar servicios';
            }
        });
    }

    // Event listeners para checkboxes de extras
    const extraCheckboxes = document.querySelectorAll('#extraServicesForm input[type="checkbox"]');
    extraCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updatePriceWithExtras();
            updateSelectedExtrasList();
        });
    });
});

// Actualizar la lista de extras seleccionados en el carrito
function updateSelectedExtrasList() {
    const selectedList = document.getElementById('selectedExtrasList');
    const extrasTotal = document.getElementById('extrasTotal');
    const extrasTotalAmount = document.getElementById('extrasTotalAmount');

    if (!selectedList || !extrasTotal || !extrasTotalAmount) {
        console.warn('Faltan elementos del DOM para actualizar extras seleccionados.');
        return;
    }

    selectedList.innerHTML = '';
    let totalExtras = 0;
    let hasExtras = false;

    document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked').forEach(cb => {
        hasExtras = true;
        const extraKey = cb.value;
        const extraItem = cb.closest('.extra-item');
        const extraName = extraItem.querySelector('.extra-name').textContent;
        const extraPrice = parseFloat(cb.dataset.price || 0);

        const isTitan = selectedPackage?.id === 'titan';
        const isAnual = tipoSuscripcion === 'anual';
        const freeExtrasInTitan = ['negocios', 'tpv', 'logotipo'];
        const esGratis = isTitan && isAnual && freeExtrasInTitan.includes(extraKey);

        const finalPrice = esGratis ? 0 : extraPrice;
        totalExtras += finalPrice;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${extraName}</span>
            <span>${esGratis ? 'Gratis' : '$' + finalPrice.toLocaleString('es-MX')}</span>
        `;
        selectedList.appendChild(li);
    });

    if (hasExtras) {
        extrasTotal.style.display = 'flex';
        extrasTotalAmount.textContent = '$' + totalExtras.toLocaleString('es-MX');
    } else {
        extrasTotal.style.display = 'none';
    }
}

// Actualizar precios mostrados en el formulario de extras
function updateExtraPricesInForm() {
    if (!selectedPackage || !preciosOficiales?.[tipoSuscripcion]?.extras) return;

    const isTitan = selectedPackage.id === 'titan';
    const isAnual = tipoSuscripcion === 'anual';
    const extras = preciosOficiales[tipoSuscripcion].extras;

    extraServicesForm.querySelectorAll('label').forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        const priceSpan = label.querySelector('.extra-price');
        const extraKey = checkbox.value;

        const precioExtra = extras?.[extraKey];

        if (precioExtra == null) {
            priceSpan.textContent = 'Precio no disponible';
            priceSpan.style.color = 'red';
            return;
        }

        const esGratis = isTitan && isAnual && ['negocios', 'tpv', 'logotipo'].includes(extraKey);

        if (esGratis) {
            priceSpan.textContent = 'Gratis';
            priceSpan.style.color = '#3773B8';
            priceSpan.style.fontWeight = '600';
        } else {
            const precioFormateado = precioExtra.toLocaleString('es-MX', {
                style: 'currency',
                currency: 'MXN'
            });

            switch (extraKey) {
                case 'scraping':
                case 'basededatos':
                    priceSpan.textContent = `${precioFormateado} / 500 registros`;
                    break;
                default:
                    priceSpan.textContent = precioFormateado;
            }

            priceSpan.style.color = '';
            priceSpan.style.fontWeight = '';
        }
    });
}



function updatePriceWithExtras() {
    if (!selectedPackage || !preciosOficiales?.[tipoSuscripcion]?.extras) return;

    const isTitan = selectedPackage.id === 'titan';
    const isAnual = tipoSuscripcion === 'anual';
    const extras = preciosOficiales[tipoSuscripcion].extras;

    let total = basePrice;
    let extrasTotal = 0;

    // Lista de extras seleccionados
    updateSelectedExtrasList();

    document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked').forEach(cb => {
        const extraKey = cb.value;
        const precioExtra = extras?.[extraKey] || 0;
        const esGratis = isTitan && isAnual && ['negocios', 'tpv', 'logotipo'].includes(extraKey);

        if (!esGratis && precioExtra) {
            extrasTotal += precioExtra;
        }
    });

    total = basePrice + extrasTotal;
    finalPrice = total;

    // Actualizar DOM
    const packageSubtotal = document.getElementById('packageSubtotal');
    const extrasTotalAmount = document.getElementById('extrasTotalAmount');
    const totalFinalPrice = document.getElementById('totalFinalPrice');

    if (packageSubtotal) packageSubtotal.textContent = `$${basePrice.toLocaleString('es-MX')}`;
    if (extrasTotalAmount) extrasTotalAmount.textContent = `$${extrasTotal.toLocaleString('es-MX')}`;
    if (totalFinalPrice) totalFinalPrice.textContent = `$${finalPrice.toLocaleString('es-MX')}`;

    if (confirmPackagePrice) {
        const tipo = tipoSuscripcion || 'mensual';
        confirmPackagePrice.textContent = `$${basePrice.toLocaleString('es-MX')}${tipo === 'anual' ? '/año' : '/mes'}`;
    }
}

function setPackageBasePrice(price) {
    basePrice = parseFloat(price) || 0;
    finalPrice = basePrice;

    if (confirmPackagePrice) {
        const tipo = tipoSuscripcion || 'mensual';
        confirmPackagePrice.textContent = `$${basePrice.toLocaleString('es-MX')}${tipo === 'anual' ? '/año' : '/mes'}`;
    }
}

// Escuchar cambios de tipo de suscripción
if (toggleSubscriptionType) {
    toggleSubscriptionType.addEventListener('change', (e) => {
        tipoSuscripcion = e.target.checked ? 'anual' : 'mensual';
        actualizarPrecios(tipoSuscripcion);
        updateExtraPricesInForm();
        updatePriceWithExtras();
    });
}

async function confirmarCompraHandler() {
    const paquetesConSuscripcion = ['impulso', 'dominio', 'titan'];

    if (!selectedPackage) return;

    const { value: clienteEmail } = await Swal.fire({
        title: 'INGRESA TU CORREO ELECTRÓNICO PARA ENVIAR TU COMPROBANTE',
        input: 'text',
        inputLabel: 'CORREO',
        inputPlaceholder: 'tucorreo@ejemplo.com',
        showCancelButton: true,
        confirmButtonText: 'ENVIAR',
        cancelButtonText: 'CANCELAR',
        customClass: {
            confirmButton: 'custom-alert-button',
            cancelButton: 'btn-secondary'
        },
        inputValidator: (value) => {
            if (!value) return 'DEBES INGRESAR UN CORREO VÁLIDO';
            if (!validateEmail(value)) return 'POR FAVOR INGRESA UN CORREO ELECTRÓNICO VÁLIDO';
        }
    });

    if (!clienteEmail) return;

    updatePriceWithExtras();

    const servicios = [];
    document.querySelectorAll('#servicesList li').forEach(li => {
        servicios.push(li.innerText.trim());
    });

    let extrasSeleccionados = [];
    let extrasKeys = [];

    document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked').forEach(cb => {
        const extraKey = cb.value;
        const label = cb.closest('.extra-item').querySelector('.extra-name').textContent.trim();

        extrasKeys.push(extraKey);
        extrasSeleccionados.push(label);
    });

    const resumenServicios = [...servicios, ...extrasSeleccionados].join(', ');

    const orderData = {
        nombrePaquete: selectedPackage.name,
        resumenServicios,
        extrasSeleccionados: extrasKeys,
        monto: finalPrice,
        fecha: new Date().toLocaleDateString('es-MX'),
        clienteEmail,
        mensajeContinuar: "La empresa se pondrá en contacto contigo para continuar con los siguientes pasos.",
        planId: selectedPackage.id,
        tipoSuscripcion
    };

    Swal.fire({
        title: 'PROCESANDO...',
        html: 'ESPERA UN MOMENTO MIENTRAS SE PROCESA LA SUSCRIPCIÓN.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const isTitan = selectedPackage?.name.toLowerCase().includes('titan');
    const isAnual = tipoSuscripcion === 'anual';
    const freeExtrasInTitan = ['negocios', 'tpv', 'logotipo'];

    let tieneExtrasConCosto = false;

    document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked').forEach(cb => {
        const extraKey = cb.value;
        const precio = Number(cb.dataset.price || 0);
        const esGratisEnTitan = isTitan && isAnual && freeExtrasInTitan.includes(extraKey);
        if (!esGratisEnTitan && precio > 0) {
            tieneExtrasConCosto = true;
        }
    });

    try {
        const esConSuscripcion = paquetesConSuscripcion.includes(selectedPackage.id.toLowerCase());

        if (esConSuscripcion || tieneExtrasConCosto) {
            const res = await fetch('https://tlatec-backend.onrender.com/api/stripe/crear-suscripcion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPackage.id,
                    clienteEmail,
                    orderData,
                    tipoSuscripcion
                })
            });

            const result = await res.json();

            if (!res.ok || !result.url) {
                throw new Error(result.message || 'ERROR AL CREAR SUSCRIPCIÓN');
            }

            Swal.close();
            window.location.href = result.url;

        } else {
            // Gratis sin extras
            orderData.preapproval_id = 'free-' + Date.now();

            const res = await fetch('https://tlatec-backend.onrender.com/api/pagos/orden-gratis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderData })
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.message || 'Error al registrar orden gratuita');
            }

            Swal.close();
            Swal.fire({
                title: '¡REGISTRO COMPLETO!',
                text: `TE HAS REGISTRADO AL ${selectedPackage.name}. REVISA TU CORREO.`,
                icon: 'success',
                confirmButtonText: 'ACEPTAR',
                customClass: { confirmButton: 'custom-alert-button' }
            }).then(() => {
                localStorage.removeItem('selectedPackage');
                localStorage.removeItem('tipoSuscripcion');
                window.location.href = 'index.html';
            });
        }

    } catch (error) {
        console.error('Error en el proceso de pago:', error);
        Swal.fire('Error', error.message || 'Hubo un error al procesar la compra.', 'error');
    }
}
