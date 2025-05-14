// Common helper
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function generateUserId() {
  const users = getUsers();
  return users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
}

function getStatusValue() {
  const radios = document.querySelectorAll('input[name="status"]');
  for (let r of radios) if (r.checked) return r.value === 'true';
  return false;
}

function validateEmailFormat(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  let errorElem = input.parentElement.querySelector('.error-msg');
  if (!errorElem) {
    errorElem = document.createElement('div');
    errorElem.className = 'error-msg';
    errorElem.style.color = 'red';
    errorElem.style.fontSize = '12px';
    input.parentElement.appendChild(errorElem);
  }
  errorElem.textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.remove());
}

function validateUserForm({ username, email, password }, mode = 'add') {
  clearFieldErrors();
  let isValid = true;

  if (!username.trim()) {
    showFieldError('username', 'Username is required.');
    isValid = false;
  }

  if (!email.trim()) {
    showFieldError('email', 'Email is required.');
    isValid = false;
  } else if (!validateEmailFormat(email)) {
    showFieldError('email', 'Email format is invalid.');
    isValid = false;
  }

  if (!password.trim()) {
    showFieldError('password', 'Password is required.');
    isValid = false;
  } else if (password.length < 8) {
    showFieldError('password', 'Password must be at least 8 characters.');
    isValid = false;
  }

  const users = getUsers();
  if (mode === 'add') {
    if (users.find(u => u.email === email)) {
      showFieldError('email', 'Email already exists.');
      isValid = false;
    }
    if (users.find(u => u.username === username)) {
      showFieldError('username', 'Username already exists.');
      isValid = false;
    }
  }

  return isValid;
}

// Add user logic
if (window.location.pathname.includes('add-user')) {
  document.getElementById('userCode').value = `TR${generateUserId().toString().padStart(3, '0')}`;

  document.getElementById('addUserForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const isValid = validateUserForm({ username, email, password }, 'add');
    if (!isValid) return;

    const users = getUsers();
    const newUser = {
      id: generateUserId(),
      username,
      email,
      password,
      role: document.getElementById('role').value,
      birthday: document.getElementById('birthday').value,
      status: getStatusValue(),
      description: document.getElementById('description').value,
    };

    users.push(newUser);
    setUsers(users);
    window.location.href = '/pages/dashboard.html';
  });
}

// Edit user logic
if (window.location.pathname.includes('edit-user')) {
  const userId = parseInt(localStorage.getItem('editId'));
  const user = getUsers().find(u => u.id === userId);
  if (!user) window.location.href = '/pages/dashboard.html';

  document.getElementById('userCode').value = `TR${user.id.toString().padStart(3, '0')}`;
  document.getElementById('username').value = user.username;
  document.getElementById('email').value = user.email;
  document.getElementById('password').value = user.password;
  document.getElementById('role').value = user.role;
  document.getElementById('birthday').value = user.birthday;
  document.getElementById('description').value = user.description;
  document.querySelector(`input[name="status"][value="${user.status}"]`).checked = true;

  document.getElementById('editUserForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const isValid = validateUserForm({ username, email, password }, 'edit');
    if (!isValid) return;

    const users = getUsers().map(u => {
      if (u.id === userId) {
        return {
          ...u,
          username,
          email,
          password,
          role: document.getElementById('role').value,
          birthday: document.getElementById('birthday').value,
          status: getStatusValue(),
          description: document.getElementById('description').value,
        };
      }
      return u;
    });
    setUsers(users);
    window.location.href = '/pages/dashboard.html';
  });
}

// Dashboard logic
if (window.location.pathname.includes('dashboard')) {
  const searchInput = document.getElementById('searchInput');
  const tbody = document.getElementById('userTableBody');
  const pagination = document.getElementById('pagination');

  let page = parseInt(localStorage.getItem('page') || '1');
  const pageSize = 5;

  function renderUsers(users) {
    tbody.innerHTML = '';
    const sliced = users.slice((page - 1) * pageSize, page * pageSize);
    sliced.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>TR${user.id.toString().padStart(3, '0')}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.birthday}</td>
        <td><span class="${user.status ? 'status-active' : 'status-deactivate'}">${user.status ? 'Active' : 'Deactivate'}</span></td>
        <td class="actions">
          <i class="edit" onclick="editUser(${user.id})">✏️</i>
          <i class="delete" onclick="deleteUser(${user.id})">🗑️</i>
        </td>`;
      tbody.appendChild(row);
    });
  }

  function renderPagination(total) {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(total / pageSize);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === page) btn.classList.add('active');
      btn.onclick = () => {
        page = i;
        localStorage.setItem('page', i);
        load();
      };
      pagination.appendChild(btn);
    }
  }

  function deleteUser(id) {
    const users = getUsers().filter(u => u.id !== id);
    setUsers(users);
    load();
  }

  window.deleteUser = deleteUser;

  window.editUser = (id) => {
    localStorage.setItem('editId', id);
    window.location.href = '/pages/edit-user.html';
  };

  function load() {
    const users = getUsers();
    const filtered = searchInput.value.trim()
      ? users.filter(u => u.username.toLowerCase().includes(searchInput.value.trim().toLowerCase()))
      : users;
    renderUsers(filtered);
    renderPagination(filtered.length);
  }

  searchInput.addEventListener('input', () => {
    page = 1;
    load();
  });

  load();
}
