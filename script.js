const form = document.querySelector('#planner-form');
const input = document.querySelector('#task');
const message = document.querySelector('#message');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const task = input.value.trim();
  if (!task) return;

  const tasks = JSON.parse(localStorage.getItem('breeze-tasks') || '[]');
  tasks.unshift({ task, createdAt: Date.now() });
  localStorage.setItem('breeze-tasks', JSON.stringify(tasks.slice(0, 20)));
  message.textContent = `Added “${task}” to your day.`;
  input.value = '';
  input.focus();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.feature-grid article, .planner-card').forEach((element) => {
  element.style.opacity = '0';
  element.style.transform = 'translateY(18px)';
  element.style.transition = 'opacity .6s ease, transform .6s ease';
  observer.observe(element);
});
