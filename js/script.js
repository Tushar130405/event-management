// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Utility functions
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function getUserRole() {
    const token = getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch {
            return null;
        }
    }
    return null;
}

function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.color = isError ? 'red' : 'green';
}

// Smooth scrolling for navigation links
document.querySelectorAll('.header-elements a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.hash !== "") {
            e.preventDefault();
            const hash = this.hash;
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Contact form validation and submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Simple validation
        const name = contactForm.name.value.trim();
        const email = contactForm.email.value.trim();
        const subject = contactForm.subject.value.trim();
        const message = contactForm.message.value.trim();

        if (!name || !email || !subject || !message) {
            alert('Please fill in all fields.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Here you would typically send the form data to a server
        alert('Thank you for contacting us, ' + name + '! We will get back to you soon.');

        contactForm.reset();
    });
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
}

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token);
                showMessage('message', 'Login successful! Redirecting...');

                // Decode token to get user role
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                const userRole = payload.role;

                setTimeout(() => {
                    if (userRole === 'student') {
                        window.location.href = 'student-dashboard.html';
                    } else {
                        showMessage('message', 'Please use the admin login page for event organizers.', true);
                    }
                }, 1000);
            } else {
                showMessage('message', data.message, true);
            }
        } catch (error) {
            showMessage('message', 'An error occurred. Please try again.', true);
        }
    });
}

// Register form for student
const studentForm = document.getElementById('studentForm');
if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = studentForm.username.value;
        const email = studentForm.email.value;
        const collegeName = studentForm.collegeName.value;
        const department = studentForm.department.value;
        const mobileNo = studentForm.mobileNo.value;
        const password = studentForm.password.value;
        const confirmPassword = studentForm.confirmPassword.value;

        if (password !== confirmPassword) {
            showMessage('studentMessage', 'Passwords do not match', true);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: 'student',
                    username,
                    email,
                    collegeName,
                    department,
                    mobileNo,
                    password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('studentMessage', 'Registration successful! Please login.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage('studentMessage', data.message, true);
            }
        } catch (error) {
            showMessage('studentMessage', 'An error occurred. Please try again.', true);
        }
    });
}

// Load events from API
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        const events = await response.json();

        if (response.ok) {
            // Sort events by creation date descending to show newest first
            events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            displayEvents(events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Display events
function displayEvents(events) {
    const eventsContainer = document.querySelector('.events-grid');
    if (!eventsContainer) return;

    eventsContainer.innerHTML = '';

    events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-card';

        const date = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        eventDiv.innerHTML = `
            <img src="${event.image}" alt="${event.title}" class="event-image">
            <div class="event-content">
                <h3>${event.title}</h3>
                <p class="event-date">📅 ${date}</p>
                <p>📍 ${event.location}</p>
                <p>${event.description}</p>
            </div>
        `;

        eventsContainer.appendChild(eventDiv);
    });
}

const menuBtn = document.getElementById('menuBtn');
const navLinks = document.querySelector('.nav-links');

if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Close mobile menu when clicking close button
const closeNav = document.getElementById('closeNav');
if (closeNav) {
    closeNav.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navLinks && !menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});

// Update login buttons based on user role
function updateLoginButtons() {
    const token = getToken();
    const loginLi = document.querySelector('.btn-login')?.parentElement;
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        const role = getUserRole();
        // Hide login button
        if (loginLi) {
            loginLi.style.display = 'none';
        }
        if (role === 'student') {
            if (dashboardLink) {
                dashboardLink.textContent = 'Dashboard';
                dashboardLink.href = 'student-dashboard.html';
                dashboardLink.style.display = 'inline-block';
            }
        } else if (role === 'admin' || role === 'organizer') {
            if (dashboardLink) {
                dashboardLink.textContent = 'Manage Events';
                dashboardLink.href = 'event-management.html';
                dashboardLink.style.display = 'inline-block';
            }
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.addEventListener('click', () => {
                removeToken();
                window.location.href = 'index.html';
            });
        }
    } else {
        // Show login button and hide dashboard and logout buttons
        if (loginLi) {
            loginLi.style.display = '';
        }
        if (dashboardLink) {
            dashboardLink.style.display = 'none';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

// Event filtering functionality
document.addEventListener('DOMContentLoaded', () => {
    // Update login buttons based on authentication status
    updateLoginButtons();

    // Load events if on index page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadEvents();
    }

    // Add event filter input
    const eventsSection = document.querySelector('.events-section');
    if (eventsSection) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.innerHTML = `
            <input type="text" id="eventFilter" placeholder="Search events..." class="filter-input">
        `;

        const container = eventsSection.querySelector('.container');
        if (container) {
            const sectionTitle = container.querySelector('.section-title');
            if (sectionTitle && sectionTitle.parentNode === container) {
                container.insertBefore(filterContainer, sectionTitle.nextSibling);
            } else {
                // If no section title or sectionTitle is not a child of container, just append to container
                container.appendChild(filterContainer);
            }
        }

        const filterInput = document.getElementById('eventFilter');
        filterInput.addEventListener('input', () => {
            const filterValue = filterInput.value.toLowerCase();
            const events = document.querySelectorAll('.event-card');

            events.forEach(event => {
                const text = event.textContent.toLowerCase();
                if (text.includes(filterValue)) {
                    event.style.display = '';
                } else {
                    event.style.display = 'none';
                }
            });
        });
    }
});


        // Load events and display with buttons that redirect to login page
        document.addEventListener('DOMContentLoaded', async () => {
            const eventsGrid = document.getElementById('eventsGrid');
            if (!eventsGrid) return;

            try {
                const response = await fetch('http://localhost:3000/api/events');
                const events = await response.json();

                if (!response.ok) {
                    eventsGrid.innerHTML = '<p>Failed to load events.</p>';
                    return;
                }

                if (events.length === 0) {
                    eventsGrid.innerHTML = '<p>No upcoming events.</p>';
                    return;
                }

                eventsGrid.innerHTML = events.map(event => {
                    const date = new Date(event.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return `
                        <div class="event-card">
                            <h4>${event.title}</h4>
                            <p class="event-date">📅 ${date}</p>
                            <p class="event-location">📍 ${event.location}</p>
                            <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                            <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                            <div class="event-actions">
                                <button class="btn-secondary" onclick="window.location.href='login.html'">Register</button>
                                <button class="btn-secondary" onclick="window.location.href='login.html'">More Details</button>
                            </div>
                        </div>
                    `;
                }).join('');
            } catch (error) {
                eventsGrid.innerHTML = '<p>Error loading events.</p>';
            }
        });
    
