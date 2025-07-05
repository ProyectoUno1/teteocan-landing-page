// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const menuIcon = document.getElementById('menuIcon');

    mobileMenuBtn.addEventListener('click', function () {
        mobileNav.classList.toggle('active');
        if (mobileNav.classList.contains('active')) {
            menuIcon.className = 'fas fa-times';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('mobile-menu-open');
        } else {
            menuIcon.className = 'fas fa-bars';
            document.body.style.overflow = '';
            document.body.classList.remove('mobile-menu-open');
        }
    });
    const mobileLinks = mobileNav.querySelectorAll('.nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function () {
            mobileNav.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
            document.body.style.overflow = '';
            document.body.classList.remove('mobile-menu-open');
        });
    });
    document.addEventListener('click', function (event) {
        if (!mobileMenuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
            mobileNav.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
            document.body.style.overflow = '';
            document.body.classList.remove('mobile-menu-open');
        }
    });
    const logoMobileNav = document.getElementById('logo-mobile-nav');
    logoMobileNav.addEventListener('click', function () {
        mobileNav.classList.remove('active');
        menuIcon.className = 'fas fa-bars';
        document.body.style.overflow = '';
        document.body.classList.remove('mobile-menu-open');
    });
});

async function verificarEstadoExplorador() {
    const exploradorCard = document.querySelector('.pricing-card[data-package-id="explorador"]');
    if (!exploradorCard) return;

    try {
        const res = await fetch('https://tlatec-backend.onrender.com/api/public/estado-explorador');
        const data = await res.json();

        const button = exploradorCard.querySelector('.btnConfirmSubscription');
        const tooltip = document.getElementById('soldOutTooltip');

        if (data.soldOut) {
            exploradorCard.classList.add('sold-out');
            if (button) {
                button.disabled = true;
                button.textContent = 'AGOTADO';
            }

            if (tooltip) {
                const ahora = new Date();
                const proximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
                const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                const fechaFormateada = `01/${meses[proximoMes.getMonth()]}/${proximoMes.getFullYear()}`;
                tooltip.innerHTML = `Agotado.<br>Disponible el ${fechaFormateada} a las 00:00:01`;
            }
        } else {
            // No está agotado
            exploradorCard.classList.remove('sold-out');
            if (button) {
                button.disabled = false;
                button.textContent = 'SELECT EXPLORADOR';
            }

            if (tooltip && data.restantes !== undefined) {
                tooltip.innerHTML = `¡Quedan ${data.restantes} lugares este mes!`;
            }
        }

    } catch (err) {
        console.error('Error al verificar estado del paquete explorador:', err);
    }
}
verificarEstadoExplorador()


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// WhatsApp button functionality
document.addEventListener('DOMContentLoaded', function () {
    const whatsappBtn = document.getElementById('whatsappBtn');

    if (whatsappBtn) {
        // Función para manejar el clic/touch
        function handleClick(e) {
            e.preventDefault();

            // Restaurar opacidad inmediatamente (para móvil)
            this.style.opacity = '1';

            const phoneNumber = '5511987439';
            const message = encodeURIComponent('¡Hola! Estoy interesado en sus servicios. ¿Podrían brindarme más información?');
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const whatsappUrl = isMobile
                ? `https://wa.me/${phoneNumber}?text=${message}`
                : `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

            // Abrir enlace
            window.open(whatsappUrl, '_blank');
        }

        // Eventos para desktop y móvil
        whatsappBtn.addEventListener('click', handleClick);

        // Solución específica para el problema de transparencia en móvil
        whatsappBtn.addEventListener('touchstart', function () {
            this.style.opacity = '0.9';
        });

        whatsappBtn.addEventListener('touchend', function () {
            this.style.opacity = '1';
        });
    }
});

let lastScroll = 0;
let ticking = false;

const updateHeader = () => {
    const header = document.querySelector('.header');
    const currentScroll = window.scrollY;

    if (currentScroll > 80) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
    ticking = false;
};

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
    }
});

// Suavizar el efecto al cargar la página
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.header').style.transition = `
      background var(--transition-time) var(--transition-easing),
      box-shadow var(--transition-time) var(--transition-easing),
      padding var(--transition-time) var(--transition-easing)
    `;
    }, 100);
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.feature-card, .service-card, .pricing-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
});

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
    });
});

document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        if (!this.classList.contains('pricing-card-popular') && !this.classList.contains('selected')) {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        }
    });

    card.addEventListener('mouseleave', function () {
        if (!this.classList.contains('pricing-card-popular') && !this.classList.contains('selected')) {
            this.style.transform = 'translateY(0) scale(1)';
        }
    });
});

// Form validation (if forms are added later)
function validateEmail(email) {
    // Expresión regular para validación de email
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Log page load for analytics (demo)
console.log('Teteocan Landing Page loaded successfully');
console.log('Page load time:', performance.now(), 'ms');

// Performance monitoring
window.addEventListener('load', function () {
    console.log('All resources loaded');

    // Track loading performance
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
        console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
        console.log('Full Load Time:', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
    }
});

// Error handling
window.addEventListener('error', function (e) {
    console.error('Error occurred:', e.error);
});

// Keyboard navigation improvements
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const mobileNav = document.getElementById('mobileNav');
        const menuIcon = document.getElementById('menuIcon'); if (mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
            document.body.classList.remove('mobile-menu-open'); // Remove class for button animation
        }
        const openModals = document.querySelectorAll('.modal.fade-in');
        openModals.forEach(modal => {
            if (modal.id === 'serviceModal') {
                serviceModal.classList.remove('fade-in');
                serviceModal.classList.add('fade-out');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            } else if (modal.id === 'confirmModal') {
                confirmModal.classList.remove('fade-in');
                confirmModal.classList.add('fade-out');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    }
});

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function (e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const mobileNav = document.getElementById('mobileNav');
    const menuIcon = document.getElementById('menuIcon');

    if (touchEndX < touchStartX - 50 && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
        menuIcon.className = 'fas fa-bars';
        document.body.classList.remove('mobile-menu-open');
    }
}

// Lazy loading for images (if images are added later)
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// Dark mode toggle (feature for future enhancement)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Check for saved dark mode preference
document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});


// Modal for service details
const serviceModal = document.getElementById('serviceModal');
const closeModalBtn = document.getElementById('closeModal');

document.querySelectorAll('.feature-item').forEach(item => {
    item.addEventListener('click', () => {
        const title = item.getAttribute('data-title');
        const description = item.getAttribute('data-description');
        const iconClass = item.querySelector('i')?.className || '';

        const iconDiv = document.getElementById('modalIcon');
        iconDiv.innerHTML = `<i class="${iconClass} modal-icon"></i>`;

        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalDescription').innerText = description;

        serviceModal.style.display = 'flex';
        serviceModal.classList.remove('fade-out');
        serviceModal.classList.add('fade-in');
    });
});

closeModalBtn?.addEventListener('click', () => {
    serviceModal.classList.remove('fade-in');
    serviceModal.classList.add('fade-out');
    setTimeout(() => {
        serviceModal.style.display = 'none';
    }, 300);
});

serviceModal?.addEventListener('click', (e) => {
    if (e.target === serviceModal) {
        serviceModal.classList.remove('fade-in');
        serviceModal.classList.add('fade-out');
        setTimeout(() => {
            serviceModal.style.display = 'none';
        }, 300);
    }
});


// variables globales
let selectedPackage = null;
let tipoSuscripcion = 'mensual'; // Por defecto mensual
let basePrice = 0;
let finalPrice = 0;

const confirmModal = document.getElementById('confirmModal');
const confirmPackageName = document.getElementById('confirmPackageName');
const confirmPackagePrice = document.getElementById('confirmPackagePrice');
const closeConfirmModalBtn = document.getElementById('closeConfirmModal');
const btnConfirmPurchase = document.getElementById('btnConfirmPurchase');
const btnCancelPurchase = document.getElementById('btnCancelPurchase');
const toggleExtrasBtn = document.getElementById('toggleExtrasBtn');
const extraServicesForm = document.getElementById('extraServicesForm');
const servicesList = document.getElementById('servicesList');
const toggleSubscriptionType = document.getElementById('toggleSubscriptionType');

// cargar precios desde precios.json del backend
let preciosOficiales = {};

fetch('https://tlatec-backend.onrender.com/api/precios')
    .then(res => {
        if (!res.ok) throw new Error('Error al obtener precios');
        return res.json();
    })
    .then(data => {
        preciosOficiales = data;
        console.log(' preciosOficiales:', preciosOficiales);
        actualizarPrecios(tipoSuscripcion);
    })
    .catch(err => {
        console.error('Error al cargar precios:', err);
    });


function actualizarPrecios(tipo) {
    if (Object.keys(preciosOficiales).length === 0) {
        console.warn('Precios oficiales no cargados aún');
        return;
    }
    document.querySelectorAll('.pricing-card').forEach(card => {
        const packageId = card.dataset.packageId?.toLowerCase();
        let price = preciosOficiales[tipo]?.[packageId] ?? parseFloat(card.dataset.packagePrice.replace(/[^\d.]/g, ''));

        if (isNaN(price)) {
            console.error(`Precio inválido para paquete "${packageId}" (${tipo}):`, price);
            price = 0;
        }

        const priceAmount = card.querySelector('.price-amount');
        const pricePeriod = card.querySelector('.price-period');

        //  Mostrar precio formateado visualmente
        if (priceAmount) priceAmount.textContent = `$${price.toLocaleString('es-MX')}`;
        if (pricePeriod) pricePeriod.textContent = tipo === 'anual' ? '/año' : '/mes';

        // Guardar en dataset limpio (sin formateo visual)
        card.dataset.packagePrice = price.toString();
    });

    if (selectedPackage) {
        const spId = selectedPackage.id?.toLowerCase();
        let nuevoPrecio = preciosOficiales[tipo]?.[spId] ?? selectedPackage.price;

        if (isNaN(nuevoPrecio)) {
            console.warn(`Precio base inválido para paquete seleccionado (${spId}): ${nuevoPrecio}`);
            nuevoPrecio = 0;
        }

        setPackageBasePrice(nuevoPrecio);
        updatePriceWithExtras();
        console.log('Precio final calculado (desde updatePriceWithExtras):', finalPrice)
    }
}

// cambiar tipo de suscripción (mensual/anual)
toggleSubscriptionType?.addEventListener('change', (e) => {
  tipoSuscripcion = e.target.checked ? 'anual' : 'mensual';
  actualizarPrecios(tipoSuscripcion);

  const exploradorCard = document.querySelector('.pricing-card[data-package-id="explorador"]');
  if (exploradorCard) {
    if (tipoSuscripcion === 'anual') {
      exploradorCard.classList.add('oculto');
    } else {
      exploradorCard.classList.remove('oculto');
    }
  }

  
document.querySelectorAll('.price-before-group').forEach(span => {
  const nuevoTexto = tipoSuscripcion === 'anual'
    ? span.dataset.beforeAnual
    : span.dataset.beforeMensual;

  span.textContent = nuevoTexto;
} )

});



// función para abrir modal de confirmación
function openConfirmModal() {
    if (!selectedPackage) {
        alert('Por favor, selecciona un paquete primero para proceder con la compra.');
        return;
    }

    confirmPackageName.innerText = selectedPackage.name;

    const tipo = tipoSuscripcion || 'mensual';
    const spId = selectedPackage.id?.toLowerCase();

    // validar precio oficial desde JSON
    const precioJSON = preciosOficiales?.[tipo]?.[spId];

    if (typeof precioJSON !== 'number' || isNaN(precioJSON)) {
        console.error(`Precio inválido para el paquete "${spId}" y tipo "${tipo}"`);
        Swal.fire('Error', 'No se encontró el precio oficial del paquete seleccionado.', 'error');
        return;
    }

    // actualizar el precio base del paquete
    selectedPackage.price = precioJSON;
    setPackageBasePrice(precioJSON);
    updateExtraPricesInForm();

    // reiniciar extras
    extraServicesForm.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    extraServicesForm.style.display = 'none';
    toggleExtrasBtn.textContent = '➕ AÑADIR SERVICIOS EXTRA';

    // clonar lista de servicios
    const selectedCard = document.querySelector(`.pricing-card[data-package-name="${selectedPackage.name}"]`);
    const existingList = selectedCard?.querySelector('.features-list');

    if (existingList && servicesList) {
        servicesList.innerHTML = '';
        existingList.querySelectorAll('li').forEach(item => {
            const clonedItem = item.cloneNode(true);
            clonedItem.removeAttribute('id');
            servicesList.appendChild(clonedItem);
        });
    } else {
        console.warn('No se encontró la lista de servicios o el contenedor.');
    }

    // mostrar el modal
    confirmModal.style.display = 'flex';
    confirmModal.classList.remove('fade-out');
    confirmModal.classList.add('fade-in');
    document.body.classList.add('modal-open');
    document.body.classList.add('body-no-scroll');
}


function closeConfirmModal() {
    confirmModal.classList.remove('fade-in');
    confirmModal.classList.add('fade-out');
    setTimeout(() => {
        confirmModal.style.display = 'none';
    }, 300);
    document.body.classList.remove('body-no-scroll');
}

closeConfirmModalBtn?.addEventListener('click', closeConfirmModal);
btnCancelPurchase?.addEventListener('click', closeConfirmModal);

confirmModal?.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        closeConfirmModal();
    }
});

toggleExtrasBtn.addEventListener('click', function () {
    const isVisible = extraServicesForm.style.display === 'block';
    if (isVisible) {
        extraServicesForm.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        updatePriceWithExtras();
    }
    extraServicesForm.style.display = isVisible ? 'none' : 'block';
    toggleExtrasBtn.textContent = isVisible ? '➕ Añadir servicios extra' : '➖ Ocultar servicios extra';
});

// diferentes precios en formulario de extras
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

    document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked').forEach(cb => {
        const extraKey = cb.value;
        const precioExtra = extras[extraKey];

        const esGratis = isTitan && isAnual && ['negocios', 'tpv', 'logotipo'].includes(extraKey);
        if (!esGratis && precioExtra) {
            total += precioExtra;
        }
    });

    finalPrice = total;
    confirmPackagePrice.textContent = `$${finalPrice.toLocaleString('es-MX')} MXN`;
}


// Actualiza precio base y precio final
function setPackageBasePrice(price) {
    basePrice = parseFloat(price) || 0;
    finalPrice = basePrice;
    confirmPackagePrice.textContent = `$${basePrice.toLocaleString('es-MX')} MXN`;
}

extraServicesForm.addEventListener('change', updatePriceWithExtras);

// listener para cambiar tipo de suscripción con el switch
toggleSubscriptionType.addEventListener('change', (e) => {
    tipoSuscripcion = e.target.checked ? 'anual' : 'mensual';
    actualizarPrecios(tipoSuscripcion);
});

// confirmar compra
btnConfirmPurchase?.addEventListener('click', async () => {
    const paquetesConSuscripcion = ['impulso', 'dominio', 'titan'];

    if (!selectedPackage) return;

    // 1. Pedir correo
    const { value: clienteEmail } = await Swal.fire({
        title: 'INGRESA TU CORREO ELECTRÓNICO',
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
            if (!value) {
                return 'DEBES INGRESAR UN CORREO VÁLIDO';
            }
            if (!validateEmail(value)) {
                return 'POR FAVOR INGRESA UN CORREO ELECTRÓNICO VÁLIDO';
            }
        }
    });

    if (!clienteEmail) return;

    updatePriceWithExtras();

    // 2. Obtener servicios seleccionados
    const servicios = [];
    document.querySelectorAll('#servicesList li').forEach(li => {
        servicios.push(li.innerText.trim());
    });

    let extrasSeleccionados = [];
    let extrasKeys = [];

    document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked').forEach(cb => {
        const extraKey = cb.value;
        const label = cb.parentElement.textContent.trim();

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

    console.log('orderData antes de enviar:', orderData);

    // 3. Mostrar loader
    Swal.fire({
        title: 'PROCESANDO...',
        html: 'ESPERA UN MOMENTO MIENTRAS SE PROCESA LA SUSCRIPCION.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const isTitan = selectedPackage?.name.toLowerCase().includes('titan');

    const freeExtrasInTitan = ['negocios', 'tpv', 'logotipo'];
    const checkedExtras = document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked');

    let tieneExtrasConCosto = false;

    checkedExtras.forEach(cb => {
        const extraKey = cb.value;
        const precio = Number(cb.dataset.price || 0);
        const esGratisEnTitan = isTitan && freeExtrasInTitan.includes(extraKey);

        if (!esGratisEnTitan && precio > 0) {
            tieneExtrasConCosto = true;
        }
    });



    try {
        const esConSuscripcion = paquetesConSuscripcion.includes(selectedPackage.id.toLowerCase());

        if (esConSuscripcion || tieneExtrasConCosto) {

            orderData.monto = finalPrice;
            // Paquete con suscripción O gratuito con extras (requiere pago)
            const res = await fetch('https://tlatec-backend.onrender.com/api/pagos/suscripcion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPackage.id,
                    clienteEmail,
                    orderData,
                    tipoSuscripcion // <-- Aquí se envía el tipo mensual/anual al backend
                })
            });

            const result = await res.json();

            if (!res.ok || !result.init_point) {
                throw new Error(result.message || 'ERROR AL CREAR SUSCRIPCIÓN');
            }

            Swal.close();
            window.location.href = result.init_point;

        } else {
            // Paquete gratuito sin extras

            // Generar preapproval_id falso (ej. free-1721779912345)
            const preapprovalIdFalso = 'free-' + Date.now();
            orderData.preapproval_id = preapprovalIdFalso;

            const res = await fetch('https://tlatec-backend.onrender.com/api/pagos/orden-gratis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderData })
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.message || 'Error al registrar orden gratuita');
            }

            // Mostrar mensaje de éxito
            Swal.close();
            Swal.fire({
                title: '¡REGISTRO COMPLETO!',
                text: `TE HAS REGISTRADO AL ${selectedPackage.name}. REVISA TU CORREO.`,
                icon: 'success',
                confirmButtonText: 'ACEPTAR',
                customClass: { confirmButton: 'custom-alert-button' },
                buttonsStyling: false
            }).then(() => {
                closeConfirmModal();
                selectedPackage = null;
                document.querySelectorAll('.pricing-card').forEach(card => card.classList.remove('selected'));
                verificarEstadoExplorador();
            });
        }

    } catch (error) {
        const resBody = await error.response?.json().catch(() => null);
        console.error('Error detallado:', resBody);
        Swal.fire('Error', (resBody?.message || error.message) + '', 'error');
    }
});

// Selección de paquete y apertura modal
document.querySelectorAll('.pricing-footer button').forEach(button => {
    button.addEventListener('click', (event) => {
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.classList.remove('selected');
        });
        const pricingCard = event.target.closest('.pricing-card');

        if (pricingCard) {
            pricingCard.classList.add('selected');
            selectedPackage = {
                id: pricingCard.getAttribute('data-package-id')?.toLowerCase(),
                name: pricingCard.getAttribute('data-package-name'),
            };


            const precioReal = preciosOficiales[tipoSuscripcion]?.[selectedPackage.id];
            console.log('Precio real desde JSON:', precioReal);

            setPackageBasePrice(precioReal);
            updatePriceWithExtras();

            openConfirmModal();
        }
    });
});




//Mobile menu
document.addEventListener("DOMContentLoaded", function () {
    function handleLogoClick(e) {
        e.preventDefault();
        if (window.scrollY === 0) {
            location.reload();
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    } const logoDesktop = document.getElementById("logo-desktop");
    const logoMobile = document.getElementById("logo-mobile");
    const logoMobileNav = document.getElementById("logo-mobile-nav");

    if (logoDesktop) {
        logoDesktop.addEventListener("click", handleLogoClick);
        logoDesktop.addEventListener("touchstart", handleLogoClick);
    }

    if (logoMobile) {
        logoMobile.addEventListener("click", handleLogoClick);
        logoMobile.addEventListener("touchstart", handleLogoClick);
    }

    if (logoMobileNav) {
        logoMobileNav.addEventListener("click", handleLogoClick);
        logoMobileNav.addEventListener("touchstart", handleLogoClick);
    }
});

