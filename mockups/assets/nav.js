// Shared navigation helper — highlights active page in sidebar
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
});
