/*
 * فایل نهایی newtab.js
 * شامل: منطق کامل برای همه‌ی ویجت‌ها با استفاده از chrome.storage
 */

// --- کلید API آب و هوا ---
// !!! کلید API رایگان خود را از openweathermap.org دریافت و اینجا جایگزین کنید
const WEATHER_API_KEY = '707f299d3753d5d4ab668e82f1930a56'; 

document.addEventListener('DOMContentLoaded', () => {

    // --- ۰. ماژول تغییر تم ---
    setupThemeToggle();

    // --- ۱. ماژول ساعت و خوش‌آمدگویی ---
    setupClockAndGreeting();

    // --- ۲. ماژول آب و هوا ---
    setupWeather();

    // --- ۳. ماژول لیست کارها ---
    setupTodos();

    // --- ۴. ماژول یادداشت‌های سریع ---
    setupNotes();

    // --- ۵. ماژول پیوندهای سفارشی ---
    setupLinks();

    // --- ۶. ابزارهای توسعه‌دهنده ---
    setupDevTools();

    // --- ۷. منوی برنامه‌های گوگل ---
    setupGoogleApps();

});

// -------------------------------------------------------------------
// --- منوی برنامه‌های گوگل ---
// -------------------------------------------------------------------

function setupGoogleApps() {
    const appsBtn = document.getElementById('apps-btn');
    const appsMenu = document.getElementById('apps-menu');

    if (!appsBtn || !appsMenu) return;

    appsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        appsMenu.classList.toggle('active');
    });

    // بستن منو با کلیک خارج از آن
    document.addEventListener('click', (e) => {
        if (!appsMenu.contains(e.target) && !appsBtn.contains(e.target)) {
            appsMenu.classList.remove('active');
        }
    });

    // جلوگیری از بسته شدن منو با کلیک داخل آن
    appsMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// -------------------------------------------------------------------
// --- پیاده‌سازی ماژول‌ها ---
// -------------------------------------------------------------------

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeStorageKey = 'devDashboardTheme';
    if (!themeToggle) return;

    // بارگذاری تم ذخیره شده
    chrome.storage.local.get([themeStorageKey], (result) => {
        if (result[themeStorageKey] === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        } else {
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
        }
        chrome.storage.local.set({ [themeStorageKey]: newTheme });
    });
}

function setupClockAndGreeting() {
    const timeElement = document.getElementById('clock-display');
    const greetingElement = document.getElementById('greeting-display');

    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        
        const timeString = now.toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        if (timeElement) timeElement.textContent = timeString;

        // خوشامدگویی پویا
        let greeting = '';
        if (hours < 5) greeting = 'شب بخیر!';
        else if (hours < 12) greeting = 'صبح بخیر!';
        else if (hours < 18) greeting = 'ظهر بخیر!';
        else if (hours < 22) greeting = 'عصر بخیر!';
        else greeting = 'شب بخیر!';
        
        if (greetingElement && greetingElement.textContent !== greeting) {
            greetingElement.textContent = greeting;
        }
    }
    setInterval(updateClock, 1000);
    updateClock();
}

function setupWeather() {
    const loadingElement = document.getElementById('weather-loading');
    const container = document.getElementById('weather-container');
    if (!container) return;

    if (WEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
        loadingElement.textContent = 'کلید API آب و هوا تنظیم نشده است.';
        return;
    }

    function getWeather() {
        // ۱. تلاش برای خواندن از کش (برای جلوگیری از درخواست‌های مکرر)
        chrome.storage.local.get(['weatherCache', 'weatherCacheTime'], (result) => {
            const now = new Date().getTime();
            // کش برای ۳۰ دقیقه معتبر است (30 * 60 * 1000 = 1800000ms)
            if (result.weatherCache && result.weatherCacheTime && (now - result.weatherCacheTime < 1800000)) {
                displayWeather(result.weatherCache);
            } else {
                // اگر کش معتبر نبود، از geolocation استفاده کن
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        fetchWeather(latitude, longitude);
                    },
                    (error) => {
                        console.error("خطای Geolocation:", error);
                        loadingElement.textContent = 'امکان دسترسی به موقعیت مکانی نیست.';
                    }
                );
            }
        });
    }

    async function fetchWeather(lat, lon) {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=fa`);
            if (!response.ok) throw new Error('پاسخ شبکه ناموفق بود');
            const data = await response.json();
            
            // ذخیره در کش
            chrome.storage.local.set({
                'weatherCache': data,
                'weatherCacheTime': new Date().getTime()
            });

            displayWeather(data);
        } catch (error) {
            console.error("خطای دریافت آب و هوا:", error);
            loadingElement.textContent = 'خطا در دریافت اطلاعات آب و هوا.';
        }
    }

    function displayWeather(data) {
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const icon = data.weather[0].icon;

        container.innerHTML = `
            <div id="weather-info" class="weather-info">
                <span id="weather-temp">${temp}°C</span>
                <span id="weather-desc">${description}</span>
                <img id="weather-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
            </div>
        `;
    }

    getWeather();
}

function setupTodos() {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoStorageKey = 'devDashboardTodos';
    let todos = [];

    if (!todoForm) return;

    async function loadTodos() {
        const result = await chrome.storage.local.get([todoStorageKey]);
        todos = result[todoStorageKey] || [];
        renderTodos();
    }

    function renderTodos() {
        if (!todoList) return;
        todoList.innerHTML = ''; 
        if (todos.length === 0) {
            todoList.innerHTML = '<p class="text-center" style="opacity: 0.5; color: var(--text-color-light);">کاری برای انجام نیست.</p>';
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
}

function setupNotes() {
    const notesTextarea = document.getElementById('notes-textarea');
    const notesStorageKey = 'devDashboardNotes';
    let notesTimer = null; 
    if (!notesTextarea) return;

    // بارگذاری یادداشت‌ها
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

function setupLinks() {
    const linksGrid = document.getElementById('links-grid');
    const addLinkForm = document.getElementById('add-link-form');
    const linkUrlInput = document.getElementById('link-url-input');
    const linksStorageKey = 'loopDashboardLinks';
    let links = [];

    if (!addLinkForm) return;

    // استخراج دامنه از URL
    function getDomain(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    // دریافت آیکون سایت
    function getFaviconUrl(url) {
        const domain = getDomain(url);
        // استفاده از Google Favicon Service
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }

    async function loadLinks() {
        const result = await chrome.storage.local.get([linksStorageKey]);
        links = result[linksStorageKey] || [
            { url: "https://github.com" },
            { url: "https://stackoverflow.com" },
            { url: "https://dev.to" },
            { url: "https://youtube.com" },
            { url: "https://twitter.com" }
        ];
        renderLinks();
    }

    function renderLinks() {
        if (!linksGrid) return;
        linksGrid.innerHTML = '';
        
        links.forEach((link, index) => {
            const fullUrl = link.url.startsWith('http') ? link.url : 'https://' + link.url;
            const domain = getDomain(link.url);
            const faviconUrl = getFaviconUrl(link.url);
            
            const linkCard = document.createElement('a');
            linkCard.href = fullUrl;
            linkCard.target = '_blank';
            linkCard.className = 'glass-effect link-card';
            linkCard.title = domain;
            
            // آیکون سایت
            const favicon = document.createElement('img');
            favicon.src = faviconUrl;
            favicon.alt = domain;
            favicon.className = 'link-favicon';
            favicon.onerror = () => {
                // اگر آیکون لود نشد، یک آیکون پیش‌فرض نمایش بده
                favicon.style.display = 'none';
                const fallbackIcon = document.createElement('div');
                fallbackIcon.className = 'link-favicon-fallback';
                fallbackIcon.textContent = domain.charAt(0).toUpperCase();
                linkCard.insertBefore(fallbackIcon, favicon);
            };
            
            // دکمه حذف
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '×';
            deleteButton.className = 'link-delete-btn';
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault(); 
                e.stopPropagation(); 
                deleteLink(index);
            });
            
            linkCard.appendChild(favicon);
            linkCard.appendChild(deleteButton);
            linksGrid.appendChild(linkCard);
        });
    }

    async function saveLinks() {
        await chrome.storage.local.set({ [linksStorageKey]: links });
    }

    addLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = linkUrlInput.value.trim();
        
        if (url) {
            // بررسی تکراری نبودن
            const fullUrl = url.startsWith('http') ? url : 'https://' + url;
            const domain = getDomain(fullUrl);
            const exists = links.some(link => getDomain(link.url) === domain);
            
            if (!exists) {
                links.push({ url: fullUrl });
                linkUrlInput.value = '';
                await saveLinks();
                renderLinks();
            } else {
                // نمایش پیام خطا (اختیاری)
                linkUrlInput.style.borderColor = 'var(--danger-color)';
                setTimeout(() => {
                    linkUrlInput.style.borderColor = '';
                }, 1000);
            }
        }
    });

    async function deleteLink(index) {
        links.splice(index, 1);
        await saveLinks();
        renderLinks();
    }
    
    loadLinks();
}

function setupDevTools() {
    const modal = document.getElementById('tool-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');

    // بستن مودال
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // JSON Formatter
    document.getElementById('json-formatter-btn').addEventListener('click', () => {
        modalTitle.textContent = 'JSON Formatter';
        modalBody.innerHTML = `
            <div class="tool-container">
                <div>
                    <div class="tool-label">JSON Input:</div>
                    <textarea id="json-input" class="tool-textarea" placeholder='{"key": "value"}'></textarea>
                </div>
                <div class="tool-actions">
                    <button class="tool-action-btn" id="json-format">Format</button>
                    <button class="tool-action-btn" id="json-minify">Minify</button>
                    <button class="tool-action-btn secondary" id="json-copy">Copy</button>
                </div>
                <div>
                    <div class="tool-label">Output:</div>
                    <div id="json-output" class="tool-result">نتیجه اینجا نمایش داده می‌شود...</div>
                </div>
            </div>
        `;
        modal.classList.add('active');

        document.getElementById('json-format').addEventListener('click', () => {
            try {
                const input = document.getElementById('json-input').value;
                const parsed = JSON.parse(input);
                document.getElementById('json-output').textContent = JSON.stringify(parsed, null, 2);
            } catch (e) {
                document.getElementById('json-output').textContent = 'خطا: ' + e.message;
            }
        });

        document.getElementById('json-minify').addEventListener('click', () => {
            try {
                const input = document.getElementById('json-input').value;
                const parsed = JSON.parse(input);
                document.getElementById('json-output').textContent = JSON.stringify(parsed);
            } catch (e) {
                document.getElementById('json-output').textContent = 'خطا: ' + e.message;
            }
        });

        document.getElementById('json-copy').addEventListener('click', () => {
            const output = document.getElementById('json-output').textContent;
            navigator.clipboard.writeText(output);
        });
    });

    // Base64 Encoder/Decoder
    document.getElementById('base64-btn').addEventListener('click', () => {
        modalTitle.textContent = 'Base64 Encoder/Decoder';
        modalBody.innerHTML = `
            <div class="tool-container">
                <div>
                    <div class="tool-label">Input:</div>
                    <textarea id="base64-input" class="tool-textarea" placeholder="متن یا Base64..."></textarea>
                </div>
                <div class="tool-actions">
                    <button class="tool-action-btn" id="base64-encode">Encode</button>
                    <button class="tool-action-btn" id="base64-decode">Decode</button>
                    <button class="tool-action-btn secondary" id="base64-copy">Copy</button>
                </div>
                <div>
                    <div class="tool-label">Output:</div>
                    <div id="base64-output" class="tool-result">نتیجه اینجا نمایش داده می‌شود...</div>
                </div>
            </div>
        `;
        modal.classList.add('active');

        document.getElementById('base64-encode').addEventListener('click', () => {
            try {
                const input = document.getElementById('base64-input').value;
                const encoded = btoa(unescape(encodeURIComponent(input)));
                document.getElementById('base64-output').textContent = encoded;
            } catch (e) {
                document.getElementById('base64-output').textContent = 'خطا: ' + e.message;
            }
        });

        document.getElementById('base64-decode').addEventListener('click', () => {
            try {
                const input = document.getElementById('base64-input').value;
                const decoded = decodeURIComponent(escape(atob(input)));
                document.getElementById('base64-output').textContent = decoded;
            } catch (e) {
                document.getElementById('base64-output').textContent = 'خطا: ' + e.message;
            }
        });

        document.getElementById('base64-copy').addEventListener('click', () => {
            const output = document.getElementById('base64-output').textContent;
            navigator.clipboard.writeText(output);
        });
    });

    // API Tester
    document.getElementById('api-tester-btn').addEventListener('click', () => {
        modalTitle.textContent = 'API Tester';
        modalBody.innerHTML = `
            <div class="tool-container">
                <div>
                    <div class="tool-label">Method:</div>
                    <select id="api-method" class="tool-select">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
                <div>
                    <div class="tool-label">URL:</div>
                    <input type="text" id="api-url" class="tool-input" placeholder="https://api.example.com/endpoint">
                </div>
                <div>
                    <div class="tool-label">Headers (JSON):</div>
                    <textarea id="api-headers" class="tool-textarea" style="min-height: 80px;" placeholder='{"Content-Type": "application/json"}'></textarea>
                </div>
                <div>
                    <div class="tool-label">Body (JSON):</div>
                    <textarea id="api-body" class="tool-textarea" style="min-height: 100px;" placeholder='{"key": "value"}'></textarea>
                </div>
                <div class="tool-actions">
                    <button class="tool-action-btn" id="api-send">Send Request</button>
                </div>
                <div>
                    <div class="tool-label">Response:</div>
                    <div id="api-response" class="tool-result">پاسخ اینجا نمایش داده می‌شود...</div>
                </div>
            </div>
        `;
        modal.classList.add('active');

        document.getElementById('api-send').addEventListener('click', async () => {
            try {
                const method = document.getElementById('api-method').value;
                const url = document.getElementById('api-url').value;
                const headersText = document.getElementById('api-headers').value;
                const bodyText = document.getElementById('api-body').value;

                const headers = headersText ? JSON.parse(headersText) : {};
                const options = { method, headers };

                if (method !== 'GET' && bodyText) {
                    options.body = bodyText;
                }

                document.getElementById('api-response').textContent = 'در حال ارسال درخواست...';
                
                const response = await fetch(url, options);
                const data = await response.json();
                
                document.getElementById('api-response').textContent = JSON.stringify({
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                }, null, 2);
            } catch (e) {
                document.getElementById('api-response').textContent = 'خطا: ' + e.message;
            }
        });
    });

    // Color Picker
    document.getElementById('color-picker-btn').addEventListener('click', () => {
        modalTitle.textContent = 'Color Picker';
        modalBody.innerHTML = `
            <div class="tool-container">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="color" id="color-input" style="width: 80px; height: 80px; border: none; border-radius: 0.75rem; cursor: pointer;">
                    <div style="flex: 1;">
                        <div class="tool-label">HEX:</div>
                        <input type="text" id="color-hex" class="tool-input" readonly>
                        <div class="tool-label" style="margin-top: 0.5rem;">RGB:</div>
                        <input type="text" id="color-rgb" class="tool-input" readonly>
                    </div>
                </div>
            </div>
        `;
        modal.classList.add('active');

        const colorInput = document.getElementById('color-input');
        const hexInput = document.getElementById('color-hex');
        const rgbInput = document.getElementById('color-rgb');

        function updateColors(hex) {
            hexInput.value = hex;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            rgbInput.value = `rgb(${r}, ${g}, ${b})`;
        }

        colorInput.addEventListener('input', (e) => {
            updateColors(e.target.value);
        });

        updateColors(colorInput.value);
    });

    // Regex Tester
    document.getElementById('regex-btn').addEventListener('click', () => {
        modalTitle.textContent = 'Regex Tester';
        modalBody.innerHTML = `
            <div class="tool-container">
                <div>
                    <div class="tool-label">Pattern:</div>
                    <input type="text" id="regex-pattern" class="tool-input" placeholder="\\d+">
                </div>
                <div>
                    <div class="tool-label">Flags:</div>
                    <input type="text" id="regex-flags" class="tool-input" placeholder="gi" value="g">
                </div>
                <div>
                    <div class="tool-label">Test String:</div>
                    <textarea id="regex-test" class="tool-textarea" placeholder="متن تست..."></textarea>
                </div>
                <div class="tool-actions">
                    <button class="tool-action-btn" id="regex-run">Test</button>
                </div>
                <div>
                    <div class="tool-label">Matches:</div>
                    <div id="regex-output" class="tool-result">نتایج اینجا نمایش داده می‌شود...</div>
                </div>
            </div>
        `;
        modal.classList.add('active');

        document.getElementById('regex-run').addEventListener('click', () => {
            try {
                const pattern = document.getElementById('regex-pattern').value;
                const flags = document.getElementById('regex-flags').value;
                const testString = document.getElementById('regex-test').value;

                const regex = new RegExp(pattern, flags);
                const matches = testString.match(regex);

                if (matches) {
                    document.getElementById('regex-output').textContent = 
                        `تعداد: ${matches.length}\n\n` + matches.join('\n');
                } else {
                    document.getElementById('regex-output').textContent = 'هیچ تطابقی یافت نشد.';
                }
            } catch (e) {
                document.getElementById('regex-output').textContent = 'خطا: ' + e.message;
            }
        });
    });
}