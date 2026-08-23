/* NIRMAYA PROPERTY INSPECTION - Main JavaScript Interactions */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAccordions();
  initCounterAnimations();
  initScrollAnimations();
  initActiveLinks();
});

/* Navigation Interactions (Sticky & Hamburger) */
function initNavigation() {
  const header = document.querySelector('.header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      
      // Prevent body scrolling when mobile menu is open
      if (navMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  // Close Mobile Menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu && navMenu.classList.contains('active')) {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

/* FAQ Accordion Toggle */
function initAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const content = item.querySelector('.accordion-content');
      const isActive = item.classList.contains('active');

      // Close all other accordions first
      document.querySelectorAll('.accordion-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherContent = otherItem.querySelector('.accordion-content');
          if (otherContent) otherContent.style.maxHeight = null;
        }
      });

      // Toggle current accordion
      if (isActive) {
        item.classList.remove('active');
        content.style.maxHeight = null;
      } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

/* Stat Counter Animation */
function initCounterAnimations() {
  const statNumbers = document.querySelectorAll('.stat-number');
  
  if (statNumbers.length === 0) return;

  const countOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const endValue = parseInt(target.getAttribute('data-target'), 10);
        const duration = 2000; // 2 seconds animation
        let startTimestamp = null;

        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          const currentCount = Math.floor(progress * endValue);
          
          target.innerText = currentCount + (target.getAttribute('data-suffix') || '');
          
          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            target.innerText = endValue + (target.getAttribute('data-suffix') || '');
          }
        };

        window.requestAnimationFrame(step);
        observer.unobserve(target);
      }
    });
  }, countOptions);

  statNumbers.forEach(stat => {
    countObserver.observe(stat);
  });
}

/* Intersection Observer for Fade In Animations */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.fade-in');
  
  if (animatedElements.length === 0) return;

  const animationOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const animObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, animationOptions);

  animatedElements.forEach(element => {
    animObserver.observe(element);
  });
}

/* Highlight Active Page Links in Navbar */
function initActiveLinks() {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname;
  
  // Extract file name (handles both Windows backslashes and web forward slashes)
  const page = currentPath.split(/[/\\]/).pop() || 'index.html';

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === 'index.html' && href === './') || (page === 'index.html' && href === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
