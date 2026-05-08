const API_BASE = '/api/v1';

// DOM Elements
const authContainer = document.getElementById('auth-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleBtn = document.getElementById('toggle-auth-btn');
const authToggleText = document.getElementById('auth-toggle-text');
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const logoutBtn = document.getElementById('logout-btn');
const usernameDisplay = document.getElementById('username-display');
const roleBadge = document.getElementById('user-role-badge');
const statusFilter = document.getElementById('status-filter');

let isLogin = true;
let currentToken = localStorage.getItem('access_token');
let currentUser = null;

// Initialization
async function init() {
    if (currentToken) {
        await fetchUser();
    } else {
        showAuth();
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Toggle Auth mode
toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Welcome Back' : 'Create Account';
    authBtn.textContent = isLogin ? 'Log In' : 'Register';
    authToggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleBtn.textContent = isLogin ? 'Register' : 'Log In';
});

// Auth Submit Handling
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        if (isLogin) {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Invalid credentials');
            
            const data = await response.json();
            currentToken = data.access_token;
            localStorage.setItem('access_token', currentToken);
            showToast('Logged in successfully');
            await fetchUser();
        } else {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Registration failed');
            }
            
            showToast('Registration successful! Please log in.');
            toggleBtn.click(); // Switch to login
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Fetch User Profile
async function fetchUser() {
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (!response.ok) throw new Error('Session expired');
        
        currentUser = await response.json();
        
        // Setup UI
        usernameDisplay.textContent = currentUser.username;
        roleBadge.textContent = currentUser.role;
        if (currentUser.role === 'admin') {
            roleBadge.style.background = 'rgba(239, 68, 68, 0.2)';
            roleBadge.style.color = '#ef4444';
            roleBadge.style.border = '1px solid #ef4444';
        }
        
        showDashboard();
        fetchTasks();
    } catch (error) {
        logout();
    }
}

// Fetch Tasks
async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Render Tasks
function renderTasks(tasks) {
    tasksList.innerHTML = '';
    const filter = statusFilter.value;
    
    tasks.forEach(task => {
        if (filter !== 'all' && task.status !== filter) return;

        const card = document.createElement('div');
        card.className = `task-card ${task.status}`;
        
        let actionsHtml = '';
        if (currentUser.role === 'admin' || task.owner_id === currentUser.id) {
            if (task.status === 'pending') {
                actionsHtml += `<button class="btn-small btn-secondary" onclick="updateTaskStatus(${task.id}, 'completed')">Complete ✓</button>`;
            } else {
                actionsHtml += `<button class="btn-small btn-secondary" onclick="updateTaskStatus(${task.id}, 'pending')">Undo ↺</button>`;
            }
            actionsHtml += `<button class="btn-small btn-danger" onclick="deleteTask(${task.id})">Delete ✕</button>`;
        }
        
        card.innerHTML = `
            <h4>${task.title}</h4>
            <p>${task.description || 'No description provided.'}</p>
            ${currentUser.role === 'admin' ? `<small style="color:var(--text-muted);margin-bottom:0.5rem">User ID: ${task.owner_id}</small>` : ''}
            <div class="task-actions">
                ${actionsHtml}
            </div>
        `;
        tasksList.appendChild(card);
    });
}

// Create Task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ title, description, status: 'pending' })
        });
        if (!response.ok) throw new Error('Failed to create task');
        
        taskForm.reset();
        showToast('Task added successfully');
        fetchTasks();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Update Task Status
window.updateTaskStatus = async (id, status) => {
    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to update task');
        fetchTasks();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Delete Task
window.deleteTask = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!response.ok) throw new Error('Failed to delete task');
        showToast('Task deleted');
        fetchTasks();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Logout
function logout() {
    localStorage.removeItem('access_token');
    currentToken = null;
    currentUser = null;
    authForm.reset();
    showAuth();
}

logoutBtn.addEventListener('click', logout);
statusFilter.addEventListener('change', fetchTasks);

function showAuth() {
    authContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
}

function showDashboard() {
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
}

init();
