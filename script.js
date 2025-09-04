const open = document.getElementById('open');
const close = document.getElementById('close');
const navContainer = document.getElementById('nav-container');

open.addEventListener('click', () => navContainer.classList.add('show-nav'));
close.addEventListener('click', () =>
  navContainer.classList.remove('show-nav')
);
