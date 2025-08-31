// Variables & Elements
const BASE_URL = 'https://fordemo-ot4j.onrender.com';
let userId = '', userCode = '';
const splash = document.getElementById('splashScreen'), main = document.getElementById('mainContent'), getStarted = document.getElementById('getStartedBtn'), userCardTemplate = document.getElementById('userCardTemplate');
const inputs = { username: document.getElementById('username'), password: document.getElementById('password'), userId: document.getElementById('userId'), newUsername: document.getElementById('newUsername'), hiddenUserId: document.getElementById('hiddenUserId'), deleteUserId: document.getElementById('deleteUserId') };
const buttons = { create: document.getElementById('createUserBtn'), fetch: document.getElementById('fetchUserBtn'), update: document.getElementById('updateUserBtn'), fetchAll: document.getElementById('fetchAllBtn'), delete: document.getElementById('deleteUserBtn') };
const displays = { userDetails: document.getElementById('userDetails'), updatedUser: document.getElementById('updatedUser'), allUsers: document.getElementById('allUsersContainer'), usersGrid: document.getElementById('usersGrid') };

// Setup page when loaded
document.addEventListener('DOMContentLoaded', function() {
    getStarted.onclick = () => showMain();
    buttons.create.onclick = () => createUser();
    buttons.fetch.onclick = () => fetchUser();
    buttons.update.onclick = () => updateUser();
    buttons.fetchAll.onclick = () => fetchAllUsers();
    buttons.delete.onclick = () => deleteUser();
    inputs.username.oninput = inputs.password.oninput = () => checkForm('create');
    inputs.userId.oninput = () => checkForm('fetch');
    inputs.newUsername.oninput = () => checkForm('update');
    setupTabs();
    buttons.fetchAll.disabled = false;
});

// Para sa tab switching
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab') + '-tab').classList.add('active');
        };
    });
}

// Magic after ss
function showMain() {
    splash.style.opacity = '0';
    setTimeout(() => {
        splash.style.display = 'none';
        main.classList.remove('hidden');
        main.style.opacity = '1';
    }, 800);
}

// Check if form inputs are valid and enable/disable buttons
function checkForm(type) {
    if (type === 'create') buttons.create.disabled = !(inputs.username.value.trim() && inputs.password.value.trim());
    else if (type === 'fetch') buttons.fetch.disabled = inputs.userId.value.trim().length !== 6;
    else if (type === 'update') buttons.update.disabled = !(inputs.newUsername.value.trim() && userId);
}

// Make API calls to server
async function api(endpoint, method = 'GET', data = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' }, mode: 'cors' };
        if (data) options.body = JSON.stringify(data);
        const response = await fetch(BASE_URL + endpoint, options);
        const text = await response.text();
        let responseData;
        try { responseData = JSON.parse(text); } catch { responseData = { message: text || 'Could not parse response' }; }
        return { response, data: responseData };
    } catch (error) {
        return { response: { ok: false }, data: { message: 'Network error: ' + error.message } };
    }
}

// CREATE
async function createUser() {
    const username = inputs.username.value.trim(), password = inputs.password.value.trim();
    if (!username || !password) return msg('Please fill in both fields', 'error');
    loading(buttons.create, 'Creating...');
    const result = await api('/users', 'POST', { username, password });
    if (result.response.ok) {
        userCode = result.data.code || ''; userId = result.data.id || ''; inputs.userId.value = userCode;
        msg('User created successfully!', 'success'); enableButtons(); switchTab('fetch');
    } else {
        msg('Create failed: ' + (result.data.message || 'Unknown error'), 'error');
    }
    loading(buttons.create, 'Create User', false);
}

// READ o Fetch 
async function fetchUser() {
    const code = inputs.userId.value.trim() || userCode;
    if (!code || code.length !== 6) return msg('Enter valid 6-character code', 'error');
    loading(buttons.fetch, 'Fetching...');
    const result = await api('/users/' + code);
    if (result.response.ok && result.data) {
        userId = result.data.id || result.data._id || '';
        inputs.hiddenUserId.value = inputs.deleteUserId.value = userId;
        document.getElementById('detailUserId').textContent = userId;
        document.getElementById('detailCode').textContent = code;
        displays.userDetails.classList.remove('hidden');
        msg('User data fetched successfully!', 'success');
        if (inputs.newUsername.value.trim()) buttons.update.disabled = false;
    } else {
        msg('Fetch failed: ' + (result.data.message || 'User not found'), 'error');
    }
    loading(buttons.fetch, 'Fetch Data', false);
}

// UPDATE
async function updateUser() {
    const newUsername = inputs.newUsername.value.trim();
    if (!newUsername || !userId) return msg('Enter username and fetch user first', 'error');
    loading(buttons.update, 'Updating...');
    let result = await api('/users/' + userId, 'PUT', { username: newUsername });
    if (!result.response.ok) result = await api('/users/' + userId, 'PATCH', { username: newUsername });
    if (result.response.ok) {
        document.getElementById('updatedUsername').textContent = newUsername;
        document.getElementById('updatedUserId').textContent = userId;
        displays.updatedUser.classList.remove('hidden');
        msg('Update success: ' + (result.data.message || 'User updated'), 'success');
    } else {
        msg('Update failed: ' + (result.data.message || 'Unknown error'), 'error');
    }
    loading(buttons.update, 'Update Profile', false);
}

// FETCHHHHHHH ALLLLLLLLLLLL
async function fetchAllUsers() {
    loading(buttons.fetchAll, 'Fetching...');
    const result = await api('/users');
    if (result.response.ok) {
        showAllUsers(result.data);
        msg('Fetch all success: ' + (result.data.message || 'Users loaded'), 'success');
    } else {
        msg('Fetch all failed: ' + (result.data.message || 'Could not load users'), 'error');
    }
    loading(buttons.fetchAll, 'View All Users', false);
}

// Display all users in card format
function showAllUsers(users) {
    displays.usersGrid.innerHTML = '';
    let userArray = Array.isArray(users) ? users : users.users || users.data || [users];
    if (userArray.length > 0) {
        userArray.forEach((user, i) => {
            const card = userCardTemplate.content.cloneNode(true);
            card.querySelector('.user-name').textContent = user.username || user.name || 'User ' + (i + 1);
            card.querySelector('.user-id').textContent = user.id || user._id || 'N/A';
            card.querySelector('.user-code').textContent = user.code || 'N/A';
            displays.usersGrid.appendChild(card);
        });
    } else {
        displays.usersGrid.innerHTML = '<p style="text-align: center; opacity: 0.6;">No users found</p>';
    }
    displays.allUsers.classList.remove('hidden');
}

// DELETE
async function deleteUser() {
    if (!userId) return msg('Fetch user data first', 'error');
    if (!confirm('Delete this user? Cannot be undone!')) return;
    loading(buttons.delete, 'Deleting...');
    const result = await api('/users/' + userId, 'DELETE');
    if (result.response.ok) {
        const successMsg = result.data.message || result.data.success || 'User deleted successfully!';
        msg('Delete success: ' + successMsg, 'success');
        if (result.data.deletedUser) msg('Deleted: ' + (result.data.deletedUser.username || result.data.deletedUser.id), 'success');
        if (result.data.count) msg('Records affected: ' + result.data.count, 'success');
        clearForms();
    } else {
        const errorMsg = result.data.message || result.data.error || result.data.details || 'Delete failed';
        msg('Delete failed: ' + errorMsg, 'error');
        if (result.data.code) msg('Error code: ' + result.data.code, 'error');
        if (result.data.statusCode) msg('Status: ' + result.data.statusCode, 'error');
    }
    loading(buttons.delete, 'Delete Account', false);
}

// Remove user card from display
function removeCard(btn) {
    const card = btn.closest('.user-card');
    card.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        card.remove();
        if (!displays.usersGrid.querySelectorAll('.user-card').length) {
            displays.usersGrid.innerHTML = '<p style="text-align: center; opacity: 0.6;">No users to display</p>';
        }
    }, 300);
}

// Enable buttons after user creation
function enableButtons() {
    buttons.fetch.disabled = buttons.fetchAll.disabled = buttons.delete.disabled = false;
    if (inputs.newUsername.value.trim()) buttons.update.disabled = false;
}

// Show loading state on buttons
function loading(btn, text, isLoading = true) {
    btn.disabled = isLoading;
    const span = btn.querySelector('span');
    if (span) span.textContent = text;
    btn.classList.toggle('loading', isLoading);
}

// Mag-lipat ng tab
function switchTab(name) {
    const btn = document.querySelector(`[data-tab="${name}"]`);
    if (btn) btn.click();
}

// Clear all form inputs and reset state
function clearForms() {
    Object.values(inputs).forEach(input => input.value = '');
    userId = userCode = '';
    Object.values(displays).forEach(display => display.classList.add('hidden'));
    buttons.create.disabled = buttons.fetch.disabled = buttons.update.disabled = buttons.delete.disabled = true;
    buttons.fetchAll.disabled = false;
}

// Show success/error messages to user
function msg(text, type) {
    document.querySelectorAll('.message').forEach(m => m.remove());
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    const activeTab = document.querySelector('.tab-content.active .form-container');
    if (activeTab) {
        activeTab.appendChild(message);
        setTimeout(() => {
            if (message.parentNode) {
                message.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => message.remove(), 300);
            }
        }, 4000);
    }
}