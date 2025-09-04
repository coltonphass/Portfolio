// Contact Form Submission Handler
document.addEventListener('DOMContentLoaded', function () {
  // Form submission handler
  document
    .getElementById('cs-form-1105')
    .addEventListener('submit', function (e) {
      e.preventDefault();
      var form = this;
      var formData = new FormData(form);

      // Show loading state
      const submitBtn = document.getElementById('submitBtn');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { Accept: 'application/json' },
      })
        .then((response) =>
          response.ok ? response.json() : Promise.reject(response)
        )
        .then(() => {
          document.getElementById('success-message').style.display = 'block';
          form.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        })
        .catch(() => {
          alert('❌ Error sending message. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    });

  // Enhanced form validation feedback
  const inputs = document.querySelectorAll('.form-input, .form-textarea');
  inputs.forEach((input) => {
    input.addEventListener('blur', function () {
      if (this.hasAttribute('required') && !this.value.trim()) {
        this.style.borderColor = 'rgba(231, 76, 60, 0.5)';
      } else if (
        this.type === 'email' &&
        this.value &&
        !isValidEmail(this.value)
      ) {
        this.style.borderColor = 'rgba(231, 76, 60, 0.5)';
      } else {
        this.style.borderColor = 'rgba(78, 205, 196, 0.2)';
      }
    });

    input.addEventListener('focus', function () {
      this.style.borderColor = '#4ecdc4';
    });
  });

  // Email validation helper function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});
