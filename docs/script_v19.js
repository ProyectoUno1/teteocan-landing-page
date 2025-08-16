// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const menuIcon = document.getElementById('menuIcon');

    if (mobileMenuBtn && mobileNav && menuIcon) {
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
        if (logoMobileNav) {
            logoMobileNav.addEventListener('click', function () {
                mobileNav.classList.remove('active');
                menuIcon.className = 'fas fa-bars';
                document.body.style.overflow = '';
                document.body.classList.remove('mobile-menu-open');
                
            });
        }
    }
});

/*async function verificarEstadoExplorador() {
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
verificarEstadoExplorador()*/


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



// Performance monitoring
window.addEventListener('load', function () {
   

    // Track loading performance
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
        
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


const serviceModal = document.getElementById('serviceModal');
const closeModalBtn = document.getElementById('closeModal');


document.addEventListener('click', (e) => {
    const item = e.target.closest('.feature-item');
    if (!item) return;

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

// Cerrar modal con botón
closeModalBtn?.addEventListener('click', () => {
    serviceModal.classList.remove('fade-in');
    serviceModal.classList.add('fade-out');
    setTimeout(() => {
        serviceModal.style.display = 'none';
    }, 300);
});

// Cerrar modal haciendo clic fuera
serviceModal?.addEventListener('click', (e) => {
    if (e.target === serviceModal) {
        serviceModal.classList.remove('fade-in');
        serviceModal.classList.add('fade-out');
        setTimeout(() => {
            serviceModal.style.display = 'none';
        }, 300);
    }
});


// Variables esenciales
let tipoSuscripcion = 'mensual';


const confirmModal = document.getElementById('confirmModal');
const confirmPackageName = document.getElementById('confirmPackageName');
const confirmPackagePrice = document.getElementById('confirmPackagePrice');
const closeConfirmModalBtn = document.getElementById('closeConfirmModal');
const btnConfirmPurchase = document.getElementById('btnConfirmPurchase');
const btnCancelPurchase = document.getElementById('btnCancelPurchase');
const toggleExtrasBtn = document.getElementById('toggleExtrasBtn');
const extraServicesForm = document.getElementById('extraServicesForm');
const servicesList = document.getElementById('servicesList');


toggleSubscriptionType?.addEventListener('change', (e) => {
    tipoSuscripcion = e.target.checked ? 'anual' : 'mensual';
    actualizarPrecios(tipoSuscripcion);
    actualizarPreciosAnteriores(tipoSuscripcion);

    // Ocultar Explorador si es anual
    const exploradorCard = document.querySelector('.pricing-card[data-package-id="explorador"]');
    if (exploradorCard) {
        exploradorCard.classList.toggle('oculto', tipoSuscripcion === 'anual');
    }

    document.querySelectorAll('.pricing-card').forEach(card => {
        const packageId = card.dataset.packageId;
        const ul = card.querySelector('.features-list');
        const yaExiste = card.querySelector('.feature-item.mes-gratis');

        const paquetesConMesGratis = ['impulso'];

        if (tipoSuscripcion === 'anual' && paquetesConMesGratis.includes(packageId)) {
            if (!yaExiste && ul) {
                const li = document.createElement('li');
                li.classList.add('feature-item', 'mes-gratis');
                li.setAttribute('data-title', '1 mes gratis');
                li.setAttribute('data-description', 'Obtienes 1 mes completamente gratis al contratar el plan anual.');

                const icon = document.createElement('i');
                icon.className = 'fa-solid fa-gift color-regalo';
                
                const span = document.createElement('span');
                span.textContent = '1 mes gratis';

                li.appendChild(icon);
                li.appendChild(span);
                ul.appendChild(li);
            }
        } else if (yaExiste) {
            yaExiste.remove();
        }
    }); 
}); 



// Cargar precios desde backend
let preciosOficiales = {};

fetch('https://tlatec-backend.onrender.com/api/precios')
    .then(res => {
        if (!res.ok) throw new Error('Error al obtener precios');
        return res.json();
    })
    .then(data => {
        preciosOficiales = data;
        actualizarPrecios(tipoSuscripcion);
    })
    .catch(err => {
        console.error('Error al cargar precios:', err);
    });

// Función para actualizar precios
function actualizarPrecios(tipo) {
    document.querySelectorAll('.pricing-card').forEach(card => {
        const id = card.dataset.packageId?.toLowerCase();
        const precio = preciosOficiales[tipo]?.[id];
        if (precio !== undefined) {
            const priceAmount = card.querySelector('.price-amount');
            const pricePeriod = card.querySelector('.price-period');
            if (priceAmount) priceAmount.textContent = `$${precio.toLocaleString('es-MX')}`;
            if (pricePeriod) pricePeriod.textContent = tipo === 'anual' ? '/año' : '/mes';
        }
    });
}

// Función para actualizar precios tachados
function actualizarPreciosAnteriores(tipo) {
    document.querySelectorAll('.price-before-group').forEach(span => {
        span.textContent = tipo === 'anual'
            ? span.dataset.beforeAnual
            : span.dataset.beforeMensual;
    });
}



// Inicialización al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    actualizarPreciosAnteriores(tipoSuscripcion);
    if (toggleSubscriptionType) toggleSubscriptionType.checked = false;
});







document.querySelectorAll('.pricing-footer button').forEach(button => {
    button.addEventListener('click', (event) => {
        const pricingCard = event.target.closest('.pricing-card');
        if (!pricingCard) return;

        // Obtener servicios del paquete seleccionado
        const servicios = [];
        pricingCard.querySelectorAll('.features-list li span').forEach(span => {
            servicios.push(span.textContent.trim());
        });

        selectedPackage = {
            id: pricingCard.dataset.packageId?.toLowerCase(),
            name: pricingCard.dataset.packageName,
            price: parseFloat(pricingCard.dataset.packagePrice) || 0,
            servicios // agregamos servicios aquí
        };

        // Guardar paquete y tipo suscripción
        localStorage.setItem('selectedPackage', JSON.stringify(selectedPackage));
        localStorage.setItem('tipoSuscripcion', tipoSuscripcion);

        // Redirigir al carrito
        window.location.href = 'carrito.html';

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

fetch('https://tlatec-backend.onrender.com/ping')
    .catch(err => console.warn('Error al hacer ping al backend:', err));



document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleSubscriptionType');
    const titanCard = document.querySelector('.pricing-card[data-package-id="dominio"]');
    
    // Función para actualizar la visibilidad
    function updatePricingCards() {
        if (toggle.checked) {
            // Si el interruptor está en 'Anual'
            titanCard.classList.add('is-annual');
        } else {
            // Si el interruptor está en 'Mensual'
            titanCard.classList.remove('is-annual');
        }
    }
    
    // Escucha los cambios en el interruptor
    if (toggle) {
        toggle.addEventListener('change', updatePricingCards);
    }
    
    // Llama a la función al cargar la página para aplicar el estado inicial
    updatePricingCards();
});