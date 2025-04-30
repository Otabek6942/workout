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
const deleteAccountBtn = document.getElementById('delete-account');
const deleteAccountModal = document.getElementById('delete-account-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// Exercise Demo Modal
const exerciseDemoModal = document.getElementById('exercise-demo-modal');
const closeDemoBtn = document.querySelector('.close-demo');

// State management
let currentUser = null;
let workoutProgram = [];
let timerInterval = null;
let currentRestTime = 0;

// Animation state
let animationState = {
    isPlaying: false,
    isSlowMotion: false,
    currentStep: 1,
    totalSteps: 3
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set light theme
    document.documentElement.setAttribute('data-theme', 'light');

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

    // Account deletion
    deleteAccountBtn.addEventListener('click', () => {
        deleteAccountModal.classList.add('show');
    });

    confirmDeleteBtn.addEventListener('click', handleDeleteAccount);
    cancelDeleteBtn.addEventListener('click', () => {
        deleteAccountModal.classList.remove('show');
    });

    // Close modal when clicking outside
    deleteAccountModal.addEventListener('click', (e) => {
        if (e.target === deleteAccountModal) {
            deleteAccountModal.classList.remove('show');
        }
    });

    // Animation controls
    const playBtn = document.querySelector('.play-btn');
    const pauseBtn = document.querySelector('.pause-btn');
    const resetBtn = document.querySelector('.reset-btn');
    const slowBtn = document.querySelector('.slow-btn');
    const pushupAnimation = document.querySelector('.pushup-animation');

    if (playBtn && pauseBtn && resetBtn && slowBtn && pushupAnimation) {
        // Set initial state
        playBtn.classList.add('active');
        pauseBtn.classList.remove('active');
        pushupAnimation.classList.add('paused');

        playBtn.addEventListener('click', () => {
            animationState.isPlaying = true;
            pushupAnimation.classList.remove('paused');
            pushupAnimation.classList.add('playing');
            updateAnimationControls();
        });

        pauseBtn.addEventListener('click', () => {
            animationState.isPlaying = false;
            pushupAnimation.classList.remove('playing');
            pushupAnimation.classList.add('paused');
            updateAnimationControls();
        });

        resetBtn.addEventListener('click', () => {
            // Reset animation
            pushupAnimation.classList.remove('playing', 'paused');
            void pushupAnimation.offsetWidth; // Trigger reflow
            pushupAnimation.classList.add('paused');
            
            // Reset step
            animationState.currentStep = 1;
            updateStepIndicator();
        });

        slowBtn.addEventListener('click', () => {
            animationState.isSlowMotion = !animationState.isSlowMotion;
            if (animationState.isSlowMotion) {
                pushupAnimation.classList.add('slow-motion');
                slowBtn.style.background = 'rgba(255, 255, 255, 0.3)';
            } else {
                pushupAnimation.classList.remove('slow-motion');
                slowBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        });

        // Update step indicator based on animation progress
        const body = pushupAnimation.querySelector('.body');
        body.addEventListener('animationiteration', () => {
            animationState.currentStep = (animationState.currentStep % animationState.totalSteps) + 1;
            updateStepIndicator();
        });
    }

    // Animation controls in demo modal
    const playBtnDemo = exerciseDemoModal.querySelector('.play-btn');
    const pauseBtnDemo = exerciseDemoModal.querySelector('.pause-btn');
    const resetBtnDemo = exerciseDemoModal.querySelector('.reset-btn');
    const slowBtnDemo = exerciseDemoModal.querySelector('.slow-btn');
    const pushupAnimationDemo = exerciseDemoModal.querySelector('.pushup-animation');

    if (playBtnDemo && pauseBtnDemo && resetBtnDemo && slowBtnDemo && pushupAnimationDemo) {
        playBtnDemo.addEventListener('click', () => {
            animationState.isPlaying = true;
            updateAnimationState();
            updateAnimationControls();
        });

        pauseBtnDemo.addEventListener('click', () => {
            animationState.isPlaying = false;
            updateAnimationState();
            updateAnimationControls();
        });

        resetBtnDemo.addEventListener('click', () => {
            pushupAnimationDemo.classList.remove('playing', 'paused');
            void pushupAnimationDemo.offsetWidth;
            pushupAnimationDemo.classList.add('paused');
            animationState.currentStep = 1;
            updateAnimationState();
        });

        slowBtnDemo.addEventListener('click', () => {
            animationState.isSlowMotion = !animationState.isSlowMotion;
            if (animationState.isSlowMotion) {
                pushupAnimationDemo.classList.add('slow-motion');
                slowBtnDemo.style.background = 'rgba(255, 255, 255, 0.3)';
            } else {
                pushupAnimationDemo.classList.remove('slow-motion');
                slowBtnDemo.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        });
    }
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

// Handle account deletion
function handleDeleteAccount() {
    try {
        // Remove user from users list
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(u => u.email !== currentUser.email);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        // Clear current user data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('workoutProgram');
        currentUser = null;
        workoutProgram = [];

        // Hide modal and show login form
        deleteAccountModal.classList.remove('show');
        showLoginForm();

        // Show success message
        alert('Your account has been successfully deleted.');
    } catch (error) {
        console.error('Account deletion error:', error);
        alert('An error occurred while deleting your account.');
    }
}

// Update animation controls visibility
function updateAnimationControls() {
    const playBtn = document.querySelector('.play-btn');
    const pauseBtn = document.querySelector('.pause-btn');

    if (animationState.isPlaying) {
        playBtn.classList.remove('active');
        pauseBtn.classList.add('active');
    } else {
        playBtn.classList.add('active');
        pauseBtn.classList.remove('active');
    }
}

// Update step indicator
function updateStepIndicator() {
    const currentStep = document.querySelector('.current-step');
    const stepDescription = document.querySelector('.step-description p');
    
    if (currentStep) {
        currentStep.textContent = animationState.currentStep;
    }

    if (stepDescription) {
        const descriptions = [
            'Starting position: Get into a plank position with hands slightly wider than shoulders',
            'Lower your body until your chest nearly touches the floor',
            'Push back up to the starting position'
        ];
        stepDescription.textContent = descriptions[animationState.currentStep - 1];
    }
}

// Show exercise demo
function showExerciseDemo(exerciseElement) {
    const exerciseName = exerciseElement.querySelector('h5').textContent;
    document.getElementById('demo-exercise-name').textContent = exerciseName;
    exerciseDemoModal.classList.add('show');
    
    // Reset animation state
    const pushupAnimation = exerciseDemoModal.querySelector('.pushup-animation');
    pushupAnimation.classList.remove('playing', 'paused', 'slow-motion');
    pushupAnimation.classList.add('paused');
    
    // Reset steps
    const steps = exerciseDemoModal.querySelectorAll('.instruction-step');
    steps.forEach(step => step.classList.remove('active'));
    steps[0].classList.add('active');
    
    // Reset animation controls
    const playBtn = exerciseDemoModal.querySelector('.play-btn');
    const pauseBtn = exerciseDemoModal.querySelector('.pause-btn');
    playBtn.classList.add('active');
    pauseBtn.classList.remove('active');
}

function closeExerciseDemo() {
    exerciseDemoModal.classList.remove('show');
}

// Close modal when clicking outside
exerciseDemoModal.addEventListener('click', (e) => {
    if (e.target === exerciseDemoModal) {
        closeExerciseDemo();
    }
});

closeDemoBtn.addEventListener('click', closeExerciseDemo);

// Update animation state
function updateAnimationState() {
    const pushupAnimation = exerciseDemoModal.querySelector('.pushup-animation');
    const steps = exerciseDemoModal.querySelectorAll('.instruction-step');
    
    if (animationState.isPlaying) {
        pushupAnimation.classList.remove('paused');
        pushupAnimation.classList.add('playing');
        
        // Update active step based on animation progress
        const currentStep = Math.floor((Date.now() / 2000) % 3) + 1;
        steps.forEach(step => step.classList.remove('active'));
        steps[currentStep - 1].classList.add('active');
    } else {
        pushupAnimation.classList.remove('playing');
        pushupAnimation.classList.add('paused');
    }
} 