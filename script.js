// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const menuIcon = document.getElementById('menuIcon');
    
    mobileMenuBtn.addEventListener('click', function() {
        mobileNav.classList.toggle('active');
        
        // Change icon
        if (mobileNav.classList.contains('active')) {
            menuIcon.className = 'fas fa-times';
        } else {
            menuIcon.className = 'fas fa-bars';
        }
    });
    
    // Close mobile menu when clicking on links
    const mobileLinks = mobileNav.querySelectorAll('.nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!mobileMenuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
            mobileNav.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
        }
    });
});

// Smooth scrolling for navigation links
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
        whatsappBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir cualquier comportamiento por defecto
            
            // WhatsApp contact number
            const phoneNumber = '527651033282'; // Número de ejemplo, reemplazar con el número real
            const message = encodeURIComponent('¡Hola Teteocan! Estoy interesado en sus servicios. ¿Podrían brindarme más información?');
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
            
            try {
                // Intentar abrir WhatsApp
                window.open(whatsappUrl, '_blank');
                
                // Si no se abre, mostrar mensaje de error
                setTimeout(function() {
                    // This check is unreliable for security reasons; it's better to just log or inform user
                    // if (!window.open(whatsappUrl, '_blank')) {
                    //     alert('No se pudo abrir WhatsApp. Por favor, verifique que tiene la aplicación instalada.');
                    // }
                }, 1000);
            } catch (error) {
                console.error('Error al intentar abrir WhatsApp:', error);
                alert('Error al abrir WhatsApp. Por favor, verifique que tiene la aplicación instalada.');
            }
        });
    }
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }
});

// Add animation on scroll for cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards for animation
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.feature-card, .service-card, .pricing-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
});

// Button hover effects
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Pricing card hover effects
document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        // Only apply hover effect if not 'pricing-card-popular' and not 'selected'
        if (!this.classList.contains('pricing-card-popular') && !this.classList.contains('selected')) {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        }
    });
    
    card.addEventListener('mouseleave', function() {
        // Only remove hover effect if not 'pricing-card-popular' and not 'selected'
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
window.addEventListener('load', function() {
    console.log('All resources loaded');
    
    // Track loading performance
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
        console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
        console.log('Full Load Time:', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Error occurred:', e.error);
});

// Keyboard navigation improvements
document.addEventListener('keydown', function(e) {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const mobileNav = document.getElementById('mobileNav');
        const menuIcon = document.getElementById('menuIcon');
        if (mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
        }
        // Also close modals if open
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

// Touch gestures for mobile (basic swipe to close menu)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const mobileNav = document.getElementById('mobileNav');
    const menuIcon = document.getElementById('menuIcon');
    
    if (touchEndX < touchStartX - 50 && mobileNav.classList.contains('active')) {
        // Swipe left to close menu
        mobileNav.classList.remove('active');
        menuIcon.className = 'fas fa-bars';
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
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});


// --- Modal for service details (your original modal) ---
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

// Evento para que el logo redirija a la sección de inicio
document.addEventListener("DOMContentLoaded", function () {
  function handleLogoClick(e) {
    e.preventDefault();
    if (window.scrollY === 0) {
      location.reload();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const logoDesktop = document.getElementById("logo-desktop");
  const logoMobile = document.getElementById("logo-mobile");

  if (logoDesktop) {
    logoDesktop.addEventListener("click", handleLogoClick);
    logoDesktop.addEventListener("touchstart", handleLogoClick);
  }

  if (logoMobile) {
    logoMobile.addEventListener("click", handleLogoClick);
    logoMobile.addEventListener("touchstart", handleLogoClick);
  }
});





// --- Variable global para almacenar el paquete seleccionado ---
let selectedPackage = null;

// --- Lógica del Modal de Confirmación ---
const confirmModal = document.getElementById('confirmModal');
const confirmPackageName = document.getElementById('confirmPackageName');
const confirmPackagePrice = document.getElementById('confirmPackagePrice');
const closeConfirmModalBtn = document.getElementById('closeConfirmModal'); // Este es para confirmModal
const btnConfirmPurchase = document.getElementById('btnConfirmPurchase');
const btnCancelPurchase = document.getElementById('btnCancelPurchase');

// Función para abrir el modal de confirmación
function openConfirmModal() {
    if (!selectedPackage) {
        alert('Por favor, selecciona un paquete primero para proceder con la compra.');
        return;
    }

    if (confirmPackageName && confirmPackagePrice) { // Asegurarse de que los elementos existan
        confirmPackageName.innerText = selectedPackage.name;
        // Comprobar si el precio es '0.00' y mostrar 'Gratis'
        if (parseFloat(selectedPackage.price) === 0.00) {
            confirmPackagePrice.innerText = 'Gratis';
        } else {
            confirmPackagePrice.innerText = `$${parseFloat(selectedPackage.price).toFixed(2)}/mes`;
        }
    }

    confirmModal.style.display = 'flex'; // Hacer el modal visible
    confirmModal.classList.remove('fade-out');
    confirmModal.classList.add('fade-in');
}

// Función para cerrar el modal de confirmación con animación
function closeConfirmModal() {
    confirmModal.classList.remove('fade-in');
    confirmModal.classList.add('fade-out');
    // Esperar a que termine la animación antes de ocultarlo por completo
    setTimeout(() => {
        confirmModal.style.display = 'none';
    }, 300); // Coincide con la duración de la transición CSS
}

// Event Listeners para cerrar el modal de confirmación
closeConfirmModalBtn?.addEventListener('click', closeConfirmModal);
btnCancelPurchase?.addEventListener('click', closeConfirmModal);

// Cerrar el modal de confirmación si se hace clic fuera del contenido (en el fondo oscuro)
confirmModal?.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        closeConfirmModal();
    }
});

// Event Listener para el botón "Confirmar Compra" dentro del modal
btnConfirmPurchase?.addEventListener('click', () => {
    if (selectedPackage) {
        // --- SIMULACIÓN DE COMPRA ---
        // Aquí es donde iría la lógica real para procesar la compra (ej. enviar datos a un servidor)
        // Por ahora, solo mostramos un mensaje de alerta.
        alert(`¡Felicidades! Has "comprado" el ${selectedPackage.name} por $${parseFloat(selectedPackage.price).toFixed(2)}. ¡Disfruta!`);

        // Después de la "compra" simulada:
        closeConfirmModal(); // Cierra el modal
        selectedPackage = null; // Reinicia la variable de selección

        // Remover la clase 'selected' de todas las tarjetas para desmarcar visualmente
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
});

// --- Lógica para la Selección de Paquetes (usando tus clases de botones existentes) ---
document.querySelectorAll('.pricing-footer button').forEach(button => {
    button.addEventListener('click', (event) => {
        // 1. Desmarcar cualquier paquete previamente seleccionado
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.classList.remove('selected');
        });

        // 2. Obtener la tarjeta de paquete (pricing-card) padre del botón clicado
        const pricingCard = event.target.closest('.pricing-card');

        if (pricingCard) {
            // 3. Marcar la tarjeta actual como seleccionada
            pricingCard.classList.add('selected');

            // 4. Almacenar los datos del paquete seleccionado
            selectedPackage = {
                id: pricingCard.getAttribute('data-package-id'),
                name: pricingCard.getAttribute('data-package-name'),
                price: parseFloat(pricingCard.getAttribute('data-package-price'))
            };
            console.log('Paquete seleccionado:', selectedPackage); // Para depuración

            // 5. Abrir el modal de confirmación después de la selección
            openConfirmModal();
        }
    });
});