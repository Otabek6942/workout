// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const dashboard = document.getElementById('dashboard');
const loginLink = document.getElementById('login-link');
const registerLink = document.getElementById('register-link');
const homeLink = document.getElementById('home-link');
const completeWorkoutBtn = document.getElementById('complete-workout');
const startTimerBtn = document.getElementById('start-timer');
const timerDisplay = document.getElementById('timer');

// State management
let currentUser = null;
let workoutProgram = [];
let timerInterval = null;
let currentRestTime = 0;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadWorkoutProgram();
        showDashboard();
    } else {
        showLoginForm();
    }

    // Event listeners
    loginLink.addEventListener('click', showLoginForm);
    registerLink.addEventListener('click', showRegisterForm);
    homeLink.addEventListener('click', () => {
        if (currentUser) {
            showDashboard();
        } else {
            showLoginForm();
        }
    });

    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    completeWorkoutBtn.addEventListener('click', completeWorkout);
    startTimerBtn.addEventListener('click', toggleTimer);
});

// Load workout program
function loadWorkoutProgram() {
    const savedProgram = localStorage.getItem('workoutProgram');
    if (savedProgram) {
        workoutProgram = JSON.parse(savedProgram);
    } else if (currentUser) {
        // Generate new program if none exists
        generateWorkoutProgram(currentUser);
    }
}

// Show login form
function showLoginForm() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    dashboard.style.display = 'none';
}

// Show register form
function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    dashboard.style.display = 'none';
}

// Show dashboard
function showDashboard() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    dashboard.style.display = 'grid';
    updateUserInfo();
    loadTodayWorkout();
    updateProgress();
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            loadWorkoutProgram();
            showDashboard();
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        height: parseFloat(document.getElementById('height').value),
        weight: parseFloat(document.getElementById('weight').value),
        age: parseInt(document.getElementById('age').value),
        fitnessLevel: document.getElementById('fitness-level').value,
        currentDay: 1,
        progress: []
    };

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.email === userData.email)) {
            alert('Email already registered');
            return;
        }

        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        await generateWorkoutProgram(userData);
        showDashboard();
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration');
    }
}

// Generate personalized workout program
async function generateWorkoutProgram(userData) {
    const baseProgram = {
        beginner: generateBeginnerProgram(),
        intermediate: generateIntermediateProgram(),
        advanced: generateAdvancedProgram()
    };

    workoutProgram = baseProgram[userData.fitnessLevel];
    localStorage.setItem('workoutProgram', JSON.stringify(workoutProgram));
}

// Update user info in dashboard
function updateUserInfo() {
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('current-day').textContent = currentUser.currentDay;
    updateProgress();
}

// Load today's workout
function loadTodayWorkout() {
    const workoutContent = document.getElementById('workout-content');
    const todayWorkout = workoutProgram[currentUser.currentDay - 1];

    if (todayWorkout) {
        // Update workout header
        document.getElementById('workout-day').textContent = currentUser.currentDay;
        document.getElementById('workout-duration').textContent = todayWorkout.duration;
        document.getElementById('workout-difficulty').textContent = todayWorkout.difficulty;

        let html = '';

        todayWorkout.exercises.forEach(exercise => {
            html += `
                <div class="exercise">
                    <h5>${exercise.name}</h5>
                    <div class="exercise-details">
                        <div class="exercise-detail">
                            <span>Sets</span>
                            <span>${exercise.sets}</span>
                        </div>
                        <div class="exercise-detail">
                            <span>Reps</span>
                            <span>${exercise.reps}</span>
                        </div>
                        <div class="exercise-detail">
                            <span>Rest Time</span>
                            <span>${exercise.restTime} seconds</span>
                        </div>
                        <div class="exercise-detail">
                            <span>Muscle Group</span>
                            <span>${exercise.muscleGroup}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        workoutContent.innerHTML = html;
    } else {
        workoutContent.innerHTML = '<p>No workout available for today. Please check back tomorrow!</p>';
    }
}

// Toggle timer
function toggleTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    } else {
        const todayWorkout = workoutProgram[currentUser.currentDay - 1];
        if (todayWorkout) {
            currentRestTime = todayWorkout.exercises[0].restTime;
            updateTimerDisplay();
            timerInterval = setInterval(() => {
                currentRestTime--;
                updateTimerDisplay();
                if (currentRestTime <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
                }
            }, 1000);
            startTimerBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(currentRestTime / 60);
    const seconds = currentRestTime % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Complete workout
function completeWorkout() {
    const today = new Date().toISOString().split('T')[0];
    const lastWorkoutDate = currentUser.lastWorkoutDate?.split('T')[0];

    if (lastWorkoutDate === today) {
        alert('You have already completed today\'s workout!');
        return;
    }

    currentUser.progress.push({
        day: currentUser.currentDay,
        completed: true,
        date: new Date().toISOString()
    });

    currentUser.currentDay++;
    currentUser.lastWorkoutDate = new Date().toISOString();

    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    updateProgress();
    loadTodayWorkout();
}

// Update progress
function updateProgress() {
    const progress = (currentUser.currentDay - 1) / 30 * 100;
    document.getElementById('progress').textContent = `${Math.round(progress)}%`;
    document.querySelector('.progress-fill').style.width = `${progress}%`;

    const calendar = document.querySelector('.calendar');
    calendar.innerHTML = '';
    
    for (let i = 1; i <= 30; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;
        
        if (i < currentUser.currentDay) {
            day.classList.add('completed');
        }
        
        calendar.appendChild(day);
    }
}

// Sample workout programs
function generateBeginnerProgram() {
    return Array(30).fill().map((_, index) => ({
        day: index + 1,
        exercises: [
            {
                name: 'Bodyweight Squats',
                sets: 3,
                reps: 10,
                restTime: 60,
                muscleGroup: 'legs'
            },
            {
                name: 'Push-ups',
                sets: 3,
                reps: 8,
                restTime: 60,
                muscleGroup: 'chest'
            },
            {
                name: 'Plank',
                sets: 3,
                reps: 30,
                restTime: 60,
                muscleGroup: 'core'
            }
        ],
        duration: 30,
        difficulty: 'beginner'
    }));
}

function generateIntermediateProgram() {
    return Array(30).fill().map((_, index) => ({
        day: index + 1,
        exercises: [
            {
                name: 'Weighted Squats',
                sets: 4,
                reps: 12,
                restTime: 90,
                muscleGroup: 'legs'
            },
            {
                name: 'Pull-ups',
                sets: 4,
                reps: 8,
                restTime: 90,
                muscleGroup: 'back'
            },
            {
                name: 'Dumbbell Press',
                sets: 4,
                reps: 10,
                restTime: 90,
                muscleGroup: 'chest'
            }
        ],
        duration: 45,
        difficulty: 'intermediate'
    }));
}

function generateAdvancedProgram() {
    return Array(30).fill().map((_, index) => ({
        day: index + 1,
        exercises: [
            {
                name: 'Barbell Squats',
                sets: 5,
                reps: 8,
                restTime: 120,
                muscleGroup: 'legs'
            },
            {
                name: 'Deadlifts',
                sets: 5,
                reps: 6,
                restTime: 120,
                muscleGroup: 'back'
            },
            {
                name: 'Bench Press',
                sets: 5,
                reps: 8,
                restTime: 120,
                muscleGroup: 'chest'
            }
        ],
        duration: 60,
        difficulty: 'advanced'
    }));
} 