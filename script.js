/* --- КОСМОС --- */
const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');
let stars = [], speed = 0.2, isWarping = false;
let accentColorRGB = {r: 255, g: 71, b: 87};
let starColorRGB = {r: 255, g: 71, b: 87};

const isMobile = window.innerWidth < 768;
const STAR_COUNT = isMobile ? 200 : 600;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; ctx.translate(canvas.width/2, canvas.height/2); }
window.addEventListener('resize', () => { ctx.setTransform(1, 0, 0, 1, 0, 0); resize(); });
resize();

class Star {
    constructor() { this.init(); }
    init() { this.x = (Math.random()-0.5)*canvas.width*3; this.y = (Math.random()-0.5)*canvas.height*3; this.z = Math.random()*canvas.width; }
    update() { this.z -= speed; if (this.z <= 0) { this.init(); this.z = canvas.width; } }
    draw() {
        if (this.z < 10) return;
        let x = (this.x/this.z)*(canvas.width/2), y = (this.y/this.z)*(canvas.height/2);
        let r = (1 - this.z/canvas.width)*2.5;
        ctx.beginPath(); ctx.lineCap = 'round';
        
        if (isWarping) {
            let tailZ = this.z + (speed*5);
            let tx = (this.x/tailZ)*(canvas.width/2), ty = (this.y/tailZ)*(canvas.height/2);
            ctx.moveTo(tx, ty); ctx.lineTo(x, y);
            ctx.lineWidth = Math.min(r*(speed/10), 3);
            ctx.strokeStyle = `rgba(${starColorRGB.r}, ${starColorRGB.g}, ${starColorRGB.b}, ${(1-this.z/canvas.width)})`;
            ctx.stroke();
        } else {
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 255, 255, ${(1-this.z/canvas.width)*0.8})`;
            ctx.fill();
        }
    }
}
for (let i=0; i<STAR_COUNT; i++) stars.push(new Star());

function animate() {
    const trail = isWarping ? 0.3 : 0.8;
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
    ctx.fillStyle = bgColor; ctx.globalAlpha = trail;
    ctx.fillRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    if (isWarping) { speed *= 1.05; if (speed > 60) speed = 60; }
    stars.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animate);
}
animate();

function startWarpSequence(redirectUrl) {
    isWarping = true;
    setTimeout(() => {
        const flash = document.getElementById('flash-overlay');
        if(flash) flash.style.opacity = '1';
    }, 1200);
    setTimeout(() => window.location.href = redirectUrl, 1400);
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        location.reload();
    }
});


/* --- ДАННЫЕ ПРОВАЙДЕРОВ --- */
const mailProviders = {
    'gmail': { name: 'Gmail', url: 'https://mail.google.com' },
    'mailru': { name: 'Mail.ru', url: 'https://e.mail.ru/messages/inbox/' },
    'yandex': { name: 'Yandex', url: 'https://mail.yandex.ru' },
    'outlook': { name: 'Outlook', url: 'https://outlook.live.com' },
    'yahoo': { name: 'Yahoo', url: 'https://mail.yahoo.com' }
};

const searchProviders = {
    'google': { name: 'Google', url: 'https://www.google.com/search', param: 'q' },
    'yandex': { name: 'Yandex', url: 'https://yandex.ru/search/', param: 'text' },
    'bing': { name: 'Bing', url: 'https://www.bing.com/search', param: 'q' },
    'duckduckgo': { name: 'DuckDuckGo', url: 'https://duckduckgo.com/', param: 'q' }
};

/* --- КАСТОМНЫЕ СЕЛЕКТЫ --- */
function setupCustomSelect(elementId, storageKey, dataObj, callback) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const selectedDiv = container.querySelector('.select-selected');
    const itemsDiv = container.querySelector('.select-items');
    const options = container.querySelectorAll('.select-item');

    const savedValue = localStorage.getItem(storageKey) || Object.keys(dataObj)[0];
    if (dataObj[savedValue]) {
        selectedDiv.textContent = dataObj[savedValue].name;
        if (callback) callback(savedValue);
    }

    selectedDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllSelects(container);
        itemsDiv.classList.toggle('select-open');
    });

    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            selectedDiv.textContent = option.textContent;
            itemsDiv.classList.remove('select-open');
            localStorage.setItem(storageKey, value);
            if (callback) callback(value);
        });
    });
}

function closeAllSelects(exceptContainer) {
    const items = document.querySelectorAll('.select-items');
    items.forEach(item => {
        if (exceptContainer && item.parentElement === exceptContainer) return;
        item.classList.remove('select-open');
    });
}

/* --- ИСТОРИЯ --- */
function getHistory() { try { return JSON.parse(localStorage.getItem('astro_history') || '[]'); } catch (e) { return []; } }
function addToHistory(query) {
    let history = getHistory();
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    if (history.length > 5) history.pop();
    localStorage.setItem('astro_history', JSON.stringify(history));
}
function clearHistory() { localStorage.removeItem('astro_history'); renderHistory(); }
function renderHistory() {
    const history = getHistory();
    const dropdown = document.getElementById('historyDropdown');
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (!dropdown) return;
    const items = dropdown.querySelectorAll('.history-item');
    items.forEach(el => el.remove());
    if (history.length === 0) { dropdown.classList.remove('active'); return; }
    history.forEach(text => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = text;
        div.onmousedown = function(e) {
            e.preventDefault();
            const input = document.getElementById('searchInput');
            input.value = text;
            document.getElementById('searchForm').dispatchEvent(new Event('submit'));
        };
        dropdown.insertBefore(div, clearBtn);
    });
    if(clearBtn) {
        clearBtn.style.display = 'block';
        clearBtn.onmousedown = function(e) { e.preventDefault(); clearHistory(); };
    }
}

/* --- ФОРМА И URL --- */
function isUrl(string) {
    if (string.includes(' ')) return false; 
    if (/^(http:\/\/|https:\/\/)/i.test(string)) return true;
    if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(string)) return true;
    return false;
}
function formatUrl(string) { if (!/^https?:\/\//i.test(string)) { return 'https://' + string; } return string; }

const form = document.getElementById('searchForm');
const input = document.getElementById('searchInput');
const historyDropdown = document.getElementById('historyDropdown');

if (form && input) {
    const openHistory = () => { renderHistory(); if (getHistory().length > 0) historyDropdown.classList.add('active'); };
    input.addEventListener('click', openHistory);
    input.addEventListener('focus', openHistory);
    input.addEventListener('blur', () => { setTimeout(() => { if(historyDropdown) historyDropdown.classList.remove('active'); }, 200); });
    input.addEventListener('input', () => { if(historyDropdown) historyDropdown.classList.remove('active'); });

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const query = input.value.trim();
        if (!query) { form.classList.add('shake'); input.focus(); setTimeout(() => form.classList.remove('shake'), 500); return; }

        let targetUrl;
        if (isUrl(query)) {
            targetUrl = formatUrl(query);
        } else {
            const providerKey = localStorage.getItem('astro_search_provider') || 'google';
            const provider = searchProviders[providerKey] || searchProviders['google'];
            targetUrl = `${provider.url}?${provider.param}=${encodeURIComponent(query)}`;
            addToHistory(query);
        }

        document.getElementById('clock').classList.add('fade-out');
        document.querySelector('h1').classList.add('fade-out');
        document.querySelector('.links').classList.add('fade-out');
        const settings = document.getElementById('settingsToggle');
        if(settings) settings.classList.add('fade-out');
        if(historyDropdown) historyDropdown.classList.remove('active');

        const measureSpan = document.createElement('span');
        measureSpan.style.visibility = 'hidden'; measureSpan.style.position = 'absolute';
        measureSpan.style.whiteSpace = 'nowrap'; measureSpan.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"; measureSpan.style.fontSize = '1.2rem'; 
        measureSpan.textContent = query;
        document.body.appendChild(measureSpan);
        const textWidth = measureSpan.getBoundingClientRect().width + 60; 
        document.body.removeChild(measureSpan);
        const maxScreenWidth = window.innerWidth * 0.9;
        const finalWidth = Math.min(textWidth, maxScreenWidth);

        const rect = form.getBoundingClientRect();
        const clone = document.createElement('div');
        clone.classList.add('search-clone');
        clone.style.top = rect.top + 'px'; clone.style.left = rect.left + 'px';
        clone.style.width = rect.width + 'px'; clone.style.height = rect.height + 'px';
        clone.textContent = query;
        document.body.appendChild(clone);

        form.style.opacity = '0';
        void clone.offsetWidth;
        clone.classList.add('launching');
        clone.style.width = finalWidth + 'px'; 
        startWarpSequence(targetUrl);
    });
}

/* --- ССЫЛКИ --- */
const links = document.querySelectorAll('.link-card');
links.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const url = this.href;
        document.getElementById('clock').classList.add('fade-out');
        document.querySelector('h1').classList.add('fade-out');
        document.getElementById('searchForm').classList.add('fade-out');
        const settings = document.getElementById('settingsToggle');
        if(settings) settings.classList.add('fade-out');
        links.forEach(o => { if (o!==this) o.classList.add('fade-out'); });
        const rect = this.getBoundingClientRect();
        this.style.position = 'fixed'; this.style.left = rect.left + 'px'; this.style.top = rect.top + 'px';
        this.style.width = rect.width + 'px'; this.style.margin = '0';
        void this.offsetWidth;
        this.classList.add('hero-button'); this.style.left = '50%'; this.style.top = '50%';
        this.style.transform = 'translate(-50%, -50%) scale(2)';
        startWarpSequence(url);
    });
});

/* --- UI, THEME & INIT --- */
function updateClock() { const clock = document.getElementById('clock'); if(clock) clock.textContent = new Date().toLocaleTimeString(); }
setInterval(updateClock, 1000); updateClock();
function hexToRgb(hex) { var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? {r:parseInt(r[1],16), g:parseInt(r[2],16), b:parseInt(r[3],16)} : {r:255,g:255,b:255}; }

const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
if(settingsToggle && settingsPanel) { 
    settingsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('active');
    });
}

const pickrInstances = [];

document.addEventListener('click', (e) => {
    closeAllSelects(); 
    if (!settingsPanel || !settingsPanel.classList.contains('active')) return;
    if (!settingsPanel.contains(e.target) && e.target !== settingsToggle && !e.target.closest('.pcr-app')) {
        settingsPanel.classList.remove('active');
        pickrInstances.forEach(p => p.hide());
    }
});

const defaults = { '--bg-color': '#050505', '--card-bg': '#1e1e1e', '--text-main': '#e0e0e0', '--accent': '#ff4757', '--star-color': '#ff4757' };

function createPicker(sel, varName, def) {
    const el = document.querySelector(sel); if (!el) return;
    const saved = localStorage.getItem('astro_theme_'+varName)||def;
    document.documentElement.style.setProperty(varName, saved);
    
    if(varName==='--accent') accentColorRGB=hexToRgb(saved);
    if(varName==='--star-color') starColorRGB=hexToRgb(saved);
    
    if (typeof Pickr !== 'undefined') {
        const p = Pickr.create({el:sel, theme:'nano', default:saved, components:{preview:true, opacity:true, hue:true, interaction:{hex:true,input:true,save:true}}});
        pickrInstances.push(p);

        p.on('change', c => {
            const h = c.toHEXA().toString();
            document.documentElement.style.setProperty(varName, h);
            localStorage.setItem('astro_theme_'+varName, h);
            p.applyColor(); 
            if(varName==='--accent') accentColorRGB=hexToRgb(h);
            if(varName==='--star-color') starColorRGB=hexToRgb(h);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createPicker('#picker-bg','--bg-color',defaults['--bg-color']);
    createPicker('#picker-card','--card-bg',defaults['--card-bg']);
    createPicker('#picker-text','--text-main',defaults['--text-main']);
    createPicker('#picker-accent','--accent',defaults['--accent']);
    createPicker('#picker-stars','--star-color',defaults['--star-color']);

    setupCustomSelect('mailSelect', 'astro_mail_provider', mailProviders, (val) => {
        const mailLink = document.getElementById('mailLink');
        if(mailLink && mailProviders[val]) mailLink.href = mailProviders[val].url;
    });

    setupCustomSelect('searchSelect', 'astro_search_provider', searchProviders, (val) => {});

    const resetBtn = document.getElementById('resetTheme');
    if(resetBtn) resetBtn.addEventListener('click', () => { 
        const savedHistory = localStorage.getItem('astro_history');
        localStorage.clear(); 
        if (savedHistory) localStorage.setItem('astro_history', savedHistory);
        location.reload(); 
    });

    if (!isMobile && input) {
        input.focus();
    }
});