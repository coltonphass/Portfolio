const open = document.getElementById('open');
const close = document.getElementById('close');
const navContainer = document.getElementById('nav-container');

open.addEventListener('click', () => navContainer.classList.add('show-nav'));
close.addEventListener('click', () =>
  navContainer.classList.remove('show-nav')
);

const jobs = document.querySelectorAll('.job');

window.addEventListener('scroll', checkJobs);

checkJobs();

function checkJobs() {
  const triggerBottom = window.innerHeight * 0.8;

  jobs.forEach((job) => {
    const jobTop = job.getBoundingClientRect().top;
    console.log(job.getBoundingClientRect().top);

    if (jobTop < triggerBottom) {
      job.classList.add('show');
    } else {
      job.classList.remove('show');
    }
  });
}
