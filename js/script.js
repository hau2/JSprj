// Lấy danh sách người dùng từ localStorage (nếu không có thì trả về mảng rỗng)
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

// Lưu danh sách người dùng vào localStorage (chuyển mảng thành chuỗi JSON)
function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Tạo ID mới cho người dùng bằng cách lấy ID lớn nhất hiện tại + 1, nếu chưa có ai thì trả về 1
function generateUserId() {
  const users = getUsers();
  return users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
}

// Lấy giá trị status (true/false) từ nhóm radio button có name là "status"
function getStatusValue() {
  const radios = document.querySelectorAll('input[name="status"]');
  for (let r of radios) if (r.checked) return r.value === 'true';
  return false;
}

// Kiểm tra định dạng email có hợp lệ không bằng regex
function validateEmailFormat(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Hiển thị thông báo lỗi dưới ô nhập có ID cụ thể
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

// Xoá toàn bộ thông báo lỗi hiển thị
function clearFieldErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.remove());
}

// Kiểm tra tính hợp lệ của form thêm/sửa người dùng
function validateUserForm({ username, email, password }, mode = 'add') {
  clearFieldErrors(); // xoá lỗi cũ
  let isValid = true;

  // Kiểm tra username
  if (!username.trim()) {
    showFieldError('username', 'Username is required.');
    isValid = false;
  }

  // Kiểm tra email
  if (!email.trim()) {
    showFieldError('email', 'Email is required.');
    isValid = false;
  } else if (!validateEmailFormat(email)) {
    showFieldError('email', 'Email format is invalid.');
    isValid = false;
  }

  // Kiểm tra password
  if (!password.trim()) {
    showFieldError('password', 'Password is required.');
    isValid = false;
  } else if (password.length < 8) {
    showFieldError('password', 'Password must be at least 8 characters.');
    isValid = false;
  }

  const users = getUsers();
  // Nếu là chế độ thêm mới, kiểm tra xem email/username đã tồn tại chưa
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

// Logic thêm người dùng
if (window.location.pathname.includes('add-user')) {
  // Tạo mã user mới có dạng TR001, TR002...
  document.getElementById('userCode').value = `TR${generateUserId().toString().padStart(3, '0')}`;

  // Lắng nghe sự kiện submit form thêm người dùng
  document.getElementById('addUserForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Ngăn trình duyệt reload trang

    // Lấy dữ liệu từ form
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Kiểm tra dữ liệu hợp lệ
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

    // Thêm người dùng mới vào danh sách và lưu lại
    users.push(newUser);
    setUsers(users);
    window.location.href = '/pages/dashboard.html'; // Chuyển về trang danh sách
  });
}

// Logic chỉnh sửa người dùng
if (window.location.pathname.includes('edit-user')) {
  const userId = parseInt(localStorage.getItem('editId')); // Lấy ID người cần sửa
  const user = getUsers().find(u => u.id === userId); // Tìm người dùng theo ID

  // Nếu không tìm thấy, quay lại dashboard
  if (!user) window.location.href = '/pages/dashboard.html';

  // Hiển thị dữ liệu cũ lên form
  document.getElementById('userCode').value = `TR${user.id.toString().padStart(3, '0')}`;
  document.getElementById('username').value = user.username;
  document.getElementById('email').value = user.email;
  document.getElementById('password').value = user.password;
  document.getElementById('role').value = user.role;
  document.getElementById('birthday').value = user.birthday;
  document.getElementById('description').value = user.description;
  document.querySelector(`input[name="status"][value="${user.status}"]`).checked = true;

  // Lưu thay đổi khi người dùng submit form
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
  const pageSize = 5; // Mỗi trang hiển thị 5 người dùng

  // Hiển thị danh sách người dùng lên bảng
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

  // Tạo nút phân trang
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

  // Xoá người dùng
  function deleteUser(id) {
    const users = getUsers().filter(u => u.id !== id);
    setUsers(users);
    load(); // Tải lại danh sách
  }

  window.deleteUser = deleteUser;

  // Chuyển hướng sang trang sửa
  window.editUser = (id) => {
    localStorage.setItem('editId', id);
    window.location.href = '/pages/edit-user.html';
  };

  // Tải lại danh sách và cập nhật theo tìm kiếm
  function load() {
    const users = getUsers();
    const filtered = searchInput.value.trim()
      ? users.filter(u => u.username.toLowerCase().includes(searchInput.value.trim().toLowerCase()))
      : users;
    renderUsers(filtered);
    renderPagination(filtered.length);
  }

  // Khi người dùng nhập vào ô tìm kiếm
  searchInput.addEventListener('input', () => {
    page = 1;
    load();
  });

  // Gọi lần đầu khi vào trang
  load();
}

