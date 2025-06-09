// Contact page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initContactPage();
});

function initContactPage() {
    setupContactForm();
    setupFAQ();
    setupFormValidation();
}

function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
        contactForm.addEventListener('reset', handleFormReset);
    }
}

function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => toggleFAQ(item));
        }
    });
}

function setupFormValidation() {
    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const subjectSelect = document.getElementById('contactSubject');
    const messageInput = document.getElementById('contactMessage');

    if (nameInput) {
        nameInput.addEventListener('blur', validateName);
        nameInput.addEventListener('input', clearContactError);
    }

    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', clearContactError);
    }

    if (subjectSelect) {
        subjectSelect.addEventListener('change', validateSubject);
    }

    if (messageInput) {
        messageInput.addEventListener('blur', validateMessage);
        messageInput.addEventListener('input', clearContactError);
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    if (!validateContactForm()) {
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    // Simulate form submission (in real app, this would send to server)
    setTimeout(() => {
        // Show success message
        showContactSuccess();
        
        // Reset form
        e.target.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Clear any validation errors
        clearAllContactErrors();
        
        // Save feedback to localStorage (for demo purposes)
        saveFeedback(new FormData(e.target));
        
    }, 2000);
}

function validateContactForm() {
    const isValidName = validateName();
    const isValidEmail = validateEmail();
    const isValidSubject = validateSubject();
    const isValidMessage = validateMessage();
    
    return isValidName && isValidEmail && isValidSubject && isValidMessage;
}

function validateName() {
    const nameInput = document.getElementById('contactName');
    const nameError = document.getElementById('nameError');
    const name = nameInput.value.trim();

    if (!name) {
        showContactError(nameError, 'Name is required');
        return false;
    }

    if (name.length < 2) {
        showContactError(nameError, 'Name must be at least 2 characters long');
        return false;
    }

    if (name.length > 50) {
        showContactError(nameError, 'Name must be less than 50 characters');
        return false;
    }

    // Check for valid name format (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
        showContactError(nameError, 'Name can only contain letters, spaces, hyphens, and apostrophes');
        return false;
    }

    clearContactError(nameError);
    return true;
}

function validateEmail() {
    const emailInput = document.getElementById('contactEmail');
    const emailError = document.getElementById('emailError');
    const email = emailInput.value.trim();

    if (!email) {
        showContactError(emailError, 'Email address is required');
        return false;
    }

    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showContactError(emailError, 'Please enter a valid email address');
        return false;
    }

    if (email.length > 100) {
        showContactError(emailError, 'Email address must be less than 100 characters');
        return false;
    }

    clearContactError(emailError);
    return true;
}

function validateSubject() {
    const subjectSelect = document.getElementById('contactSubject');
    const subjectError = document.getElementById('subjectError');
    const subject = subjectSelect.value;

    if (!subject) {
        showContactError(subjectError, 'Please select a subject');
        return false;
    }

    clearContactError(subjectError);
    return true;
}

function validateMessage() {
    const messageInput = document.getElementById('contactMessage');
    const messageError = document.getElementById('messageError');
    const message = messageInput.value.trim();

    if (!message) {
        showContactError(messageError, 'Message is required');
        return false;
    }

    if (message.length < 10) {
        showContactError(messageError, 'Message must be at least 10 characters long');
        return false;
    }

    if (message.length > 1000) {
        showContactError(messageError, 'Message must be less than 1000 characters');
        return false;
    }

    clearContactError(messageError);
    return true;
}

function showContactError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearContactError(errorElementOrEvent) {
    let errorElement;
    
    if (errorElementOrEvent.target) {
        // Called from event listener
        const input = errorElementOrEvent.target;
        const errorId = input.id.replace('contact', '').toLowerCase() + 'Error';
        errorElement = document.getElementById(errorId);
    } else {
        // Called directly with error element
        errorElement = errorElementOrEvent;
    }

    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function clearAllContactErrors() {
    const errorElements = ['nameError', 'emailError', 'subjectError', 'messageError'];
    errorElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    });
}

function showContactSuccess() {
    const form = document.getElementById('contactForm');
    const successMessage = document.getElementById('contactSuccess');
    
    if (form && successMessage) {
        form.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth' });
        
        // Show form again after 5 seconds
        setTimeout(() => {
            form.style.display = 'block';
            successMessage.style.display = 'none';
        }, 5000);
    }
}

function handleFormReset() {
    clearAllContactErrors();
}

function saveFeedback(formData) {
    const feedback = {
        id: Date.now().toString(),
        name: formData.get('contactName'),
        email: formData.get('contactEmail'),
        subject: formData.get('contactSubject'),
        message: formData.get('contactMessage'),
        newsletter: formData.get('contactNewsletter') === 'on',
        timestamp: new Date().toISOString()
    };

    // Get existing feedback
    const existingFeedback = JSON.parse(localStorage.getItem('taskflow_feedback') || '[]');
    
    // Add new feedback
    existingFeedback.unshift(feedback);
    
    // Keep only last 50 feedback entries
    if (existingFeedback.length > 50) {
        existingFeedback.splice(50);
    }
    
    // Save back to localStorage
    localStorage.setItem('taskflow_feedback', JSON.stringify(existingFeedback));
    
    // Show notification
    taskManager.showNotification('Thank you for your feedback!');
}

function toggleFAQ(faqItem) {
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Character counter for message textarea
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('contactMessage');
    if (messageInput) {
        // Create character counter
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.textContent = '0 / 1000 characters';
        
        // Insert after textarea
        messageInput.parentNode.insertBefore(counter, messageInput.nextSibling);
        
        // Update counter on input
        messageInput.addEventListener('input', function() {
            const length = this.value.length;
            counter.textContent = `${length} / 1000 characters`;
            
            if (length > 1000) {
                counter.style.color = 'var(--error-color)';
            } else if (length > 900) {
                counter.style.color = 'var(--warning-color)';
            } else {
                counter.style.color = 'var(--gray-500)';
            }
        });
    }
});

// Add contact-specific styles
const contactStyles = `
    .contact-form-container {
        position: relative;
    }
    
    .character-counter {
        font-size: var(--font-size-xs);
        color: var(--gray-500);
        text-align: right;
        margin-top: var(--spacing-1);
    }
    
    .contact-method {
        padding: var(--spacing-4);
        border-radius: var(--radius-lg);
        transition: all var(--transition-fast);
    }
    
    .contact-method:hover {
        background-color: var(--gray-50);
        transform: translateX(5px);
    }
    
    .faq-item {
        transition: all var(--transition-fast);
    }
    
    .faq-item:hover {
        background-color: var(--gray-50);
    }
    
    .faq-question {
        user-select: none;
    }
    
    .faq-answer {
        animation: fadeIn 0.3s ease-out;
    }
    
    .success-message {
        animation: slideIn 0.5s ease-out;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .contact-info {
        background: var(--white);
        padding: var(--spacing-8);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        height: fit-content;
    }
    
    .contact-info h3 {
        color: var(--gray-900);
        margin-bottom: var(--spacing-4);
        font-weight: 600;
    }
    
    .contact-info p {
        color: var(--gray-600);
        line-height: 1.6;
        margin-bottom: var(--spacing-6);
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = contactStyles;
document.head.appendChild(styleSheet);