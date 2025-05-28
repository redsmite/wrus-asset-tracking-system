document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Replace with actual authentication logic
  if (username === 'admin' && password === 'admin123') {
    window.location.href = 'dashboard.html'; // Change as needed
  } else {
    document.getElementById('errorMsg').style.display = 'block';
  }
});
