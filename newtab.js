/*
 * این فایل حاوی تمام منطق جاوا اسکریپت خالص (Vanilla JS) برای داشبورد است.
 * از chrome.storage برای ذخیره‌سازی دائمی داده‌ها استفاده می‌شود.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- ۰. ماژول تغییر تم (جدید) ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeStorageKey = 'devDashboardTheme';

    // بارگذاری تم ذخیره شده
    chrome.storage.local.get([themeStorageKey], (result) => {
        const theme = result[themeStorageKey];
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        } else {
            // پیش‌فرض تم تاریک است
            document.body.classList.remove('light-mode');
            themeToggle.checked = false;
        }
    });

    // ذخیره تم هنگام تغییر
    themeToggle.addEventListener('change', () => {
        let newTheme = 'dark';
        if (themeToggle.checked) {
            document.body.classList.add('light-mode');
            newTheme = 'light';
        } else {
            document.body.classList.remove('light-mode');
            newTheme = 'dark';
        }
        chrome.storage.local.set({ [themeStorageKey]: newTheme });
    });


    // --- ۱. ماژول ساعت و خوش‌آمدگویی (بدون تغییر) ---
    const timeElement = document.getElementById('time');
    const greetingElement = document.getElementById('greeting');

    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        
        const timeString = now.toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        if (timeElement) timeElement.textContent = timeString;

        let greeting = '';
        if (hours < 5) greeting = 'شب بخیر!';
        else if (hours < 12) greeting = 'صبح بخیر!';
        else if (hours < 18) greeting = 'ظهر بخیر!';
        else if (hours < 22) greeting = 'عصر بخیر!';
        else greeting = 'شب بخیر!';
        
        if (greetingElement) greetingElement.textContent = greeting;
    }
    setInterval(updateClock, 1000);
    updateClock();


    // --- ۲. ماژول لیست کارها (Todo List) (به‌روز شده با chrome.storage) ---
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStorageKey = 'devDashboardTodos';
    let todos = [];

    async function loadTodos() {
        const result = await chrome.storage.local.get([todoStorageKey]);
        todos = result[todoStorageKey] || [];
        renderTodos();
    }

    function renderTodos() {
        if (!todoList) return;
        todoList.innerHTML = ''; 
        if (todos.length === 0) {
            todoList.innerHTML = '<p class="text-center" style="opacity: 0.5;">کاری برای انجام نیست.</p>';
            return;
        }

        todos.forEach((todo, index) => {
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';
            
            const todoText = document.createElement('span');
            todoText.textContent = todo.text;
            todoText.className = 'todo-text';
            if (todo.completed) {
                todoText.classList.add('completed');
            }
            todoText.addEventListener('click', () => toggleTodo(index));
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.className = 'todo-delete-btn';
            deleteButton.addEventListener('click', () => deleteTodo(index));

            todoItem.appendChild(todoText);
            todoItem.appendChild(deleteButton);
            todoList.appendChild(todoItem);
        });
    }

    async function saveTodos() {
        await chrome.storage.local.set({ [todoStorageKey]: todos });
    }

    if (todoForm) {
        todoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newTodoText = todoInput.value.trim();
            if (newTodoText) {
                todos.push({ text: newTodoText, completed: false });
                todoInput.value = '';
                await saveTodos();
                renderTodos();
            }
        });
    }

    async function toggleTodo(index) {
        todos[index].completed = !todos[index].completed;
        await saveTodos();
        renderTodos();
    }

    async function deleteTodo(index) {
        todos.splice(index, 1);
        await saveTodos();
        renderTodos();
    }
    loadTodos();


    // --- ۳. ماژول یادداشت‌های سریع (به‌روز شده با chrome.storage) ---
    const notesTextarea = document.getElementById('notes-textarea');
    const notesStorageKey = 'devDashboardNotes';
    let notesTimer = null; 

    // بارگذاری یادداشت‌ها
    if (notesTextarea) {
        chrome.storage.local.get([notesStorageKey], (result) => {
            notesTextarea.value = result[notesStorageKey] || '';
        });

        // ذخیره کردن با Debounce
        notesTextarea.addEventListener('keyup', () => {
            if (notesTimer) {
                clearTimeout(notesTimer);
            }
            notesTimer = setTimeout(() => {
                chrome.storage.local.set({ [notesStorageKey]: notesTextarea.value });
            }, 300);
        });
    }


    // --- ۴. ماژول پیوندهای سفارشی (جدید) ---
    const linksGrid = document.getElementById('links-grid');
    const addLinkForm = document.getElementById('add-link-form');
    const linkNameInput = document.getElementById('link-name-input');
    const linkUrlInput = document.getElementById('link-url-input');
    const linksStorageKey = 'devDashboardLinks';
    let links = [];

    async function loadLinks() {
        const result = await chrome.storage.local.get([linksStorageKey]);
        links = result[linksStorageKey] || [
            // پیوندهای پیش‌فرض برای کاربر جدید
            { name: "گیت‌هاب", url: "https://github.com" },
            { name: "Stack Overflow", url: "https://stackoverflow.com" }
        ];
        renderLinks();
    }

    function renderLinks() {
        if (!linksGrid) return;
        linksGrid.innerHTML = '';
        links.forEach((link, index) => {
            const linkCard = document.createElement('a');
            linkCard.href = link.url;
            linkCard.target = '_blank';
            linkCard.className = 'glass-effect link-card';
            
            const linkText = document.createElement('span');
            linkText.className = 'link-text';
            linkText.textContent = link.name;
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.className = 'link-delete-btn';
            
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault(); // جلوگیری از باز شدن لینک
                e.stopPropagation(); // جلوگیری از رویداد کلیک والد
                deleteLink(index);
            });
            
            linkCard.appendChild(linkText);
            linkCard.appendChild(deleteButton);
            linksGrid.appendChild(linkCard);
        });
    }

    async function saveLinks() {
        await chrome.storage.local.set({ [linksStorageKey]: links });
    }

    if (addLinkForm) {
        addLinkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = linkNameInput.value.trim();
            const url = linkUrlInput.value.trim();
            
            if (name && url) {
                links.push({ name, url });
                linkNameInput.value = '';
                linkUrlInput.value = '';
                await saveLinks();
                renderLinks();
            }
        });
    }

    async function deleteLink(index) {
        links.splice(index, 1);
        await saveLinks();
        renderLinks();
    }
    loadLinks();


    // --- ۵. ماژول تایمر پومودورو (جدید) ---
    const pomoDisplay = document.getElementById('pomodoro-display');
    const pomoStartBtn = document.getElementById('pomo-start-btn');
    const pomoResetBtn = document.getElementById('pomo-reset-btn');

    let pomoInterval = null;
    let pomoSeconds = 25 * 60; // 25 دقیقه
    let isPomoRunning = false;

    function updatePomoDisplay() {
        const minutes = Math.floor(pomoSeconds / 60);
        const seconds = pomoSeconds % 60;
        if (pomoDisplay) {
            pomoDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }

    function startPomo() {
        if (isPomoRunning) return;
        isPomoRunning = true;
        pomoStartBtn.textContent = 'توقف';
        
        pomoInterval = setInterval(() => {
            pomoSeconds--;
            updatePomoDisplay();

            if (pomoSeconds <= 0) {
                clearInterval(pomoInterval);
                alert('زمان پومودورو تمام شد! وقت استراحت.');
                resetPomo();
            }
        }, 1000);
    }

    function stopPomo() {
        isPomoRunning = false;
        pomoStartBtn.textContent = 'ادامه';
        clearInterval(pomoInterval);
    }

    function resetPomo() {
        stopPomo();
        pomoSeconds = 25 * 60;
        updatePomoDisplay();
        pomoStartBtn.textContent = 'شروع';
    }
    
    if (pomoStartBtn) {
        pomoStartBtn.addEventListener('click', () => {
            if (isPomoRunning) {
                stopPomo();
            } else {
                startPomo();
            }
        });
    }
    
    if (pomoResetBtn) {
        pomoResetBtn.addEventListener('click', resetPomo);
    }

    // مقداردهی اولیه نمایش
    updatePomoDisplay();

});