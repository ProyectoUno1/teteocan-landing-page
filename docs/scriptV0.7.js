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
document.addEventListener('DOMContentLoaded', function() {
  const whatsappBtn = document.getElementById('whatsappBtn');
  
  if (whatsappBtn) {
    // Función para manejar el clic/touch
    function handleClick(e) {
      e.preventDefault();
      
      // Restaurar opacidad inmediatamente (para móvil)
      this.style.opacity = '1';
      
      const phoneNumber = '527651033282';
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
    whatsappBtn.addEventListener('touchstart', function() {
      this.style.opacity = '0.9';
    });
    
    whatsappBtn.addEventListener('touchend', function() {
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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
const closeModalBtn = document.getElementById('closeModal'); // Este es para serviceModal

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



// Services and purchase confirmation modal

let selectedPackage = null;
const confirmModal = document.getElementById('confirmModal');
const confirmPackageName = document.getElementById('confirmPackageName');
const confirmPackagePrice = document.getElementById('confirmPackagePrice');
const closeConfirmModalBtn = document.getElementById('closeConfirmModal');
const btnConfirmPurchase = document.getElementById('btnConfirmPurchase');
const btnCancelPurchase = document.getElementById('btnCancelPurchase');
const toggleExtrasBtn = document.getElementById('toggleExtrasBtn');
const extraServicesForm = document.getElementById('extraServicesForm');
const servicesList = document.getElementById('servicesList');


let basePrice = 0;
let finalPrice = 0; // Extra prices

// Function open modal
function openConfirmModal() {
    if (!selectedPackage) {
        alert('Por favor, selecciona un paquete primero para proceder con la compra.');
        return;
    }

    confirmPackageName.innerText = selectedPackage.name;

    setPackageBasePrice(selectedPackage.price);

    updateExtraPricesInForm();

    extraServicesForm.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    extraServicesForm.style.display = 'none';
    toggleExtrasBtn.textContent = '➕ AÑADIR SERVICIOS EXTRA';

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

//Diferents prices in package 
function updateExtraPricesInForm() {
    if (!selectedPackage) return;

    const isTitan = selectedPackage.name.toLowerCase().includes('titan');
    const labels = extraServicesForm.querySelectorAll('label');

    const freeExtrasInTitan = ['negocios', 'tpv', 'logotipo'];

    labels.forEach(label => {
        const priceSpan = label.querySelector('.extra-price');
        if (!priceSpan) return;

        const checkbox = label.querySelector('input[type="checkbox"]');
        const originalPrice = parseFloat(checkbox.dataset.price).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

        if (isTitan && freeExtrasInTitan.includes(checkbox.value)) {
            priceSpan.textContent = 'Gratis';
            priceSpan.style.color = ' #3773B8';
            priceSpan.style.fontWeight = '600';
        } else {
            switch (checkbox.value) {
                case 'scraping':
                    priceSpan.textContent = `${originalPrice} / 500 registros`;
                    break;
                case 'basededatos':
                    priceSpan.textContent = `${originalPrice} / 500 registros`;
                    break;
                case 'negocios':
                case 'tpv':
                case 'logotipo':
                    priceSpan.textContent = originalPrice;
                    break;
                default:
                    priceSpan.textContent = originalPrice;
            }
            priceSpan.style.color = '';
            priceSpan.style.fontWeight = '';
        }
    });
}

//Update Price
function updatePriceWithExtras() {
    let extrasTotal = 0;
    const checkedBoxes = extraServicesForm.querySelectorAll('input[type="checkbox"]:checked');
    const isTitan = selectedPackage?.name.toLowerCase().includes('titan');

    const freeExtrasInTitan = ['negocios', 'tpv', 'logotipo'];
    const prevExtras = servicesList.querySelectorAll('.extra-item');
    prevExtras.forEach(e => e.remove());

    checkedBoxes.forEach(cb => {
        const price = parseFloat(cb.dataset.price) || 0;
        const isFreeInTitan = isTitan && freeExtrasInTitan.includes(cb.value);

        if (!isFreeInTitan) {
            extrasTotal += price;
        }

        const li = document.createElement('li');
        li.classList.add('extra-item');
        const icon = cb.parentElement.querySelector('i')?.outerHTML || '';
        const text = cb.parentElement.innerText.trim();
        li.innerHTML = `${icon} ${text}`;
        servicesList.appendChild(li);
    });

    finalPrice = basePrice + extrasTotal;
    confirmPackagePrice.textContent = `$${finalPrice.toLocaleString('es-MX')} MXN`;
}


// Update base price 
extraServicesForm.addEventListener('change', updatePriceWithExtras);

function setPackageBasePrice(price) {
    basePrice = parseFloat(price) || 0;
    finalPrice = basePrice;
    confirmPackagePrice.textContent = `$${basePrice.toLocaleString('es-MX')} MXN`;
}

btnConfirmPurchase?.addEventListener('click', async () => {
    const paquetesConSuscripcion = ['impulso', 'dominio', 'titan'];

    if (!selectedPackage) return;

    // 1. Pedir correo
    const { value: clienteEmail } = await Swal.fire({
        title: 'INGRESA TU CORREO ELECTRONICO',
        input: 'email',
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
            if (!value) return 'DEBES INGRESAR UN CORREO VALIDO';
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
    let extrasTotal = 0;
    document.querySelectorAll('#extraServicesForm input[type="checkbox"]:checked').forEach(checkbox => {
        const label = checkbox.parentElement.textContent.trim();
        extrasSeleccionados.push(label);
        extrasTotal += Number(checkbox.dataset.price || 0);
    });

    const montoBase = Number(selectedPackage.price || 0);
    const montoFinal = montoBase + extrasTotal;
    const resumenServicios = [...servicios, ...extrasSeleccionados].join(', ');

    const orderData = {
        nombrePaquete: selectedPackage.name,
        resumenServicios,
        monto: montoFinal,
        fecha: new Date().toLocaleDateString('es-MX'),
        clienteEmail,
        mensajeContinuar: "La empresa se pondrá en contacto contigo para continuar con los siguientes pasos."
    };

    console.log('orderData antes de enviar:', orderData);

    // 3. Mostrar loader
    Swal.fire({
        title: 'PROCESANDO...',
        html: 'SPERA UN MOMENTO MIENTRAS SE PROCESA LA SUSCRIPCION.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const esConSuscripcion = paquetesConSuscripcion.includes(selectedPackage.id.toLowerCase());

        if (esConSuscripcion) {
            // Paquete con suscripción (requiere planId)
            const res = await fetch('https://tlatec-backend.onrender.com/api/pagos/suscripcion', {//si se cambio
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPackage.id, 
                    clienteEmail,
                    orderData
                })
            });

            const result = await res.json();

            if (!res.ok || !result.init_point) {
                throw new Error(result.message || 'ERROR AL CREAR SUSCRIPCIÓN');
            }

            Swal.close();
            window.location.href = result.init_point;

        } else {
            // Paquete gratuito — solo registra y confirma si sen cambio hostinguer
            await Promise.all([
                fetch('https://tlatec-backend.onrender.com/api/orden', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                }),
                fetch('https://tlatec-backend.onrender.com/api/confirmar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                })
            ]);

            Swal.close();
            Swal.fire({
                title: '¡REGISTRO COMPLETO!',
                text: `TE HAS REGISTRADO AL PAQUETE ${selectedPackage.name}. REVISA TU CORREO.`,
                icon: 'success',
                confirmButtonText: 'ACEPTAR',
                customClass: { confirmButton: 'custom-alert-button' },
                buttonsStyling: false
            });

            closeConfirmModal();
            selectedPackage = null;
            document.querySelectorAll('.pricing-card').forEach(card => card.classList.remove('selected'));
        }

    } catch (error) {
        const resBody = await error.response?.json().catch(() => null);
        console.error('Error detallado:', resBody);
        Swal.fire('Error', (resBody?.message || error.message) + '', 'error');
    }
});

// Select package and open modal
document.querySelectorAll('.pricing-footer button').forEach(button => {
    button.addEventListener('click', (event) => {
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.classList.remove('selected');
        });
        const pricingCard = event.target.closest('.pricing-card');

        if (pricingCard) {
            pricingCard.classList.add('selected');
            selectedPackage = {
                id: pricingCard.getAttribute('data-package-id'),
                name: pricingCard.getAttribute('data-package-name'),
                price: parseFloat(pricingCard.getAttribute('data-package-price')),
                planId: pricingCard.getAttribute('data-package-id')  // <-- aquí
            };

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


