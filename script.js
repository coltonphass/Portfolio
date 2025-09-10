document.addEventListener('DOMContentLoaded', () => {
  const open = document.getElementById('open');
  const close = document.getElementById('close');
  const navContainer = document.getElementById('nav-container');
  const jobs = document.querySelectorAll('.job');

  open.addEventListener('click', () => navContainer.classList.add('show-nav'));
  close.addEventListener('click', () =>
    navContainer.classList.remove('show-nav')
  );

  const isMobile = {
    Android: function () {
      return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
      return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
      return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
      return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
      return (
        navigator.userAgent.match(/IEMobile/i) ||
        navigator.userAgent.match(/WPDesktop/i)
      );
    },
    any: function () {
      return (
        isMobile.Android() ||
        isMobile.BlackBerry() ||
        isMobile.iOS() ||
        isMobile.Opera() ||
        isMobile.Windows()
      );
    },
  };
  window.addEventListener('scroll', checkJobs);
  checkJobs();

  function checkJobs() {
    const triggerBottom = window.innerHeight * 0.8;
    jobs.forEach((job) => {
      if (isMobile.any()) {
        // Remove transforms for mobile
        job.style.transform = 'none';
        job.style.opacity = '1';
      } else {
        const jobTop = job.getBoundingClientRect().top;

        if (jobTop < triggerBottom) {
          job.classList.add('show');
        } else {
          job.classList.remove('show');
        }
      }
    });
  }
});
