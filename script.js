let database = [];
let targetItem = null;

const SIZE_RANK = { "Крошечный": 1, "Tiny": 1, 
    "Маленький": 2, "Small": 2, 
    "Средний": 3, "Medium": 3,
    "Большой": 4, "Large": 4,
    "Гигантский": 5, "Ginormous":5 };

const locales = {
  ru: "locale/toolsRu.json",
  en: "locale/toolsEn.json"
};

let selectedLocale = 'ru';

fetch(locales[selectedLocale])
    .then(response => response.json())
    .then(data => {
        database = data;
        startNewGame();
    })
    .catch(error => console.error('Ошибка загрузки JSON:', error));

function startNewGame() {
    targetItem = database[Math.floor(Math.random() * database.length)];
    //console.log("Загадано (для теста):", targetItem.name);
}

const input = document.getElementById('guessInput');
const suggestionsBox = document.getElementById('suggestions');

input.addEventListener('input', () => {
    const query = input.value.toLowerCase();
    suggestionsBox.innerHTML = '';
    
    if (query.length < 1) return;

    const matches = database.filter(item => item.name.toLowerCase().includes(query));
    
    matches.slice(0, 8).forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-group-item';
        div.textContent = item.name;
        div.onclick = () => {
            suggestionsBox.innerHTML = '';
            makeGuess(item);
        };
        suggestionsBox.appendChild(div);
    });
});

document.getElementById('guessBtn').addEventListener('click', () => {
    const name = input.value;
    const item = database.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (item) makeGuess(item);
});

function makeGuess(guess) {
    const tbody = document.getElementById('resultsTable');
    const row = document.createElement('tr');

    row.innerHTML += `<td><div class="square ${guess.name === targetItem.name ? 'correct' : 'wrong'}">${guess.name}</div></td>`;

    let deptClass = 'wrong';
    if (guess.department === targetItem.department) deptClass = 'correct';
    else if (targetItem.department.includes(guess.department) || guess.department.includes(targetItem.department)) deptClass = 'partial';
    row.innerHTML += `<td><div class="square ${deptClass}">${guess.department}</div></td>`;

    row.innerHTML += `<td>${compareNumbers(guess.sell_price, targetItem.sell_price)}</td>`;

    row.innerHTML += `<td>${compareSize(guess.size, targetItem.size)}</td>`;

    row.innerHTML += `<td>${formatDamage(guess, targetItem)}</td>`;

    const gAction = Array.isArray(guess.action) ? guess.action.join(", ") : guess.action;
    const tAction = Array.isArray(targetItem.action) ? targetItem.action.join(", ") : targetItem.action;
    
    let actClass = 'wrong';
    const gWords = gAction.toLowerCase().split(/[\s,]+/);
    const tWords = tAction.toLowerCase().split(/[\s,]+/);
    const intersection = gWords.filter(element => tWords.includes(element));
    
    if (gAction === tAction) actClass = 'correct';
    else if (intersection.length > 0) actClass = 'partial';
    
    row.innerHTML += `<td><div class="square ${actClass}">${gAction}</div></td>`;

    tbody.prepend(row);
    input.value = '';

    if (guess.name === targetItem.name) {
        setTimeout(() => alert("ПОБЕДА! 🎉"), 100);
    }
}

function getArrow(g, t) {
    if (g < t) return '🔼';
    if (g > t) return '🔽';
    return '';
}

function compareNumbers(gStr, tStr) {
    const gVal = parseFloat(String(gStr).replace(/[^0-9.]/g, '')) || 0;
    const tVal = parseFloat(String(tStr).replace(/[^0-9.]/g, '')) || 0;
    
    const arrow = getArrow(gVal, tVal);
    const className = (arrow === '') ? 'correct' : 'wrong';
    
    return `<div class="square ${className}">${gStr} ${arrow}</div>`;
}

function compareSize(gSize, tSize) {
    const gRank = SIZE_RANK[gSize] || 0;
    const tRank = SIZE_RANK[tSize] || 0;
    
    const arrow = getArrow(gRank, tRank);
    const className = (arrow === '') ? 'correct' : 'wrong';
    
    return `<div class="square ${className}">${gSize} ${arrow}</div>`;
}

function formatDamage(guess, target) {
    const gMax = parseFloat(guess.max_damage) || 0;
    const tMax = parseFloat(target.max_damage) || 0;
    const arrow = getArrow(gMax, tMax);

    let fullClass = (arrow === '') ? 'correct' : 'wrong';

    return `<div class="square ${fullClass}" style="font-size: 0.8em;">
        ${guess.damage_raw} <br> 
        <span style="font-size:1.2em">${arrow}</span>
    </div>`;
}

const langToggle = document.getElementById('langToggle');

langToggle.addEventListener('click', async () => {
    const targetIndex = database.indexOf(targetItem);

    selectedLocale = selectedLocale === 'ru' ? 'en' : 'ru';
    langToggle.textContent = selectedLocale === 'ru' ? 'EN' : 'RU';

    try {
        const response = await fetch(locales[selectedLocale]);
        database = await response.json();

        if (targetIndex !== -1 && database[targetIndex]) {
            targetItem = database[targetIndex];
            //console.log("Цель обновлена на:", targetItem.name);
        } 
        else {
            startNewGame();
        }
        suggestionsBox.innerHTML = '';
        input.value = '';

    } catch (error) {
        console.error('Ошибка загрузки локали:', error);
        // Откат языка, если загрузка упала
        selectedLocale = selectedLocale === 'ru' ? 'en' : 'ru';
    }
});

