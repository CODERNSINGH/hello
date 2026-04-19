// ──────────────────────────────────────────────────────────────────────────────
// client/app.js - Runtime-configured AI client
// ──────────────────────────────────────────────────────────────────────────────

// Backend API route
const CHAT_API_ROUTE = '/api/chat';

// State
let currentSubject = "All Subjects";
let isGenerating = false;

// DOM Elements
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chatContainer');
const emptyState = document.getElementById('emptyState');
const subjectSelect = document.getElementById('subjectSelect');
const newChatBtn = document.getElementById('newChatBtn');
const suggestionsList = document.getElementById('suggestionsList');
const statsTotal = document.getElementById('statsTotal');
const statsList = document.getElementById('statsList');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Examples dictionary matching previous logic
const SUBJECT_EXAMPLES = {
    "Mathematics": [
        "Prove the Pythagoras theorem with diagram",
        "Solve: 2x² − 7x + 3 = 0 using the quadratic formula",
        "Find HCF of 96 and 404 using Euclid’s algorithm",
        "Prove that √2 is irrational"
    ],
    "Science": [
        "State and explain Ohm’s Law with derivation",
        "Explain the process of photosynthesis",
        "What is the difference between mitosis and meiosis?",
        "Describe the reaction between acids and bases"
    ],
    "English": [
        "Write a formal letter to the Principal requesting leave",
        "Explain the theme of the poem Fire and Ice",
        "Write a paragraph on the importance of education",
        "What is the central idea of the chapter A Letter to God?"
    ],
    "SST": [
        "What were the causes of the French Revolution?",
        "Explain the concept of federalism in India",
        "What is sustainable development?",
        "Describe the impact of globalisation on Indian economy"
    ]
};

// Markdown options
marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// Boot / State initialization
// ──────────────────────────────────────────────────────────────────────────────

function checkHealth() {
    // Set initial connection status
    statusIndicator.className = "status-indicator online";
    statusText.textContent = "Ready";
}

function fetchStats() {
    // Mock the backend stats array for the client demo presentation
    statsTotal.textContent = `16,420 indexed chunks`;
    
    statsList.innerHTML = `
        <div class="stat-item">
            <div class="stat-header">
                <span class="stat-subject">Science</span>
                <span class="stat-count">6,240</span>
            </div>
            <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: 38%"></div></div>
        </div>
        <div class="stat-item">
            <div class="stat-header">
                <span class="stat-subject">Mathematics</span>
                <span class="stat-count">5,100</span>
            </div>
            <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: 30%"></div></div>
        </div>
        <div class="stat-item">
            <div class="stat-header">
                <span class="stat-subject">SST</span>
                <span class="stat-count">3,200</span>
            </div>
            <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: 20%"></div></div>
        </div>
        <div class="stat-item">
            <div class="stat-header">
                <span class="stat-subject">English</span>
                <span class="stat-count">1,880</span>
            </div>
            <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: 12%"></div></div>
        </div>
    `;
}

// ──────────────────────────────────────────────────────────────────────────────
// UI Logic
// ──────────────────────────────────────────────────────────────────────────────

function renderSuggestions() {
    const subjForEx = currentSubject === "All Subjects" ? "Science" : currentSubject;
    const examples = SUBJECT_EXAMPLES[subjForEx] || [];
    suggestionsList.innerHTML = examples.map(ex => 
        `<button class="suggestion-btn" onclick="prefillAndSend('${ex.replace(/'/g, "\\'")}')">${ex}</button>`
    ).join('');
}

function prefillAndSend(txt) {
    if(window.innerWidth <= 768) toggleSidebar(false);
    chatInput.value = txt;
    handleSend();
}

chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    sendBtn.disabled = this.value.trim() === '';
});

chatInput.addEventListener('keydown', function(e) {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

subjectSelect.addEventListener('change', (e) => {
    currentSubject = e.target.value;
    renderSuggestions();
});

newChatBtn.addEventListener('click', () => {
    document.querySelectorAll('.message-wrapper').forEach(e => e.remove());
    emptyState.style.display = 'flex';
    if(window.innerWidth <= 768) toggleSidebar(false);
});

mobileMenuBtn.addEventListener('click', () => toggleSidebar(true));
sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

function toggleSidebar(show) {
    if(show) {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('open');
    } else {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Messaging
// ──────────────────────────────────────────────────────────────────────────────

function autoScroll() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendUserMessage(text) {
    emptyState.style.display = 'none';
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper user';
    wrapper.innerHTML = `<div class="message-content">${text.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</div>`;
    chatContainer.appendChild(wrapper);
    autoScroll();
}

function appendAIPlaceholder() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper assistant';
    wrapper.innerHTML = `
        <div class="ai-avatar">A</div>
        <div class="message-content">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
    `;
    chatContainer.appendChild(wrapper);
    autoScroll();
    return wrapper;
}

function updateAIMessage(wrapperDom, data, elapsed) {
    const rawMarkdown = data.answer || "Sorry, I could not generate an answer.";
    const cleanHtml = DOMPurify.sanitize(marked.parse(rawMarkdown));
    
    let footerHtml = `
        <div class="message-meta">
            <div class="stats-row">
                <span>${data.subject}</span> • <span>${elapsed}s</span>
            </div>
            <div>Sources: <span class="source-pill">NCERT Textbook</span> <span class="source-pill">CBSE PYQ 2023-2024</span></div>
        </div>
    `;

    wrapperDom.querySelector('.message-content').innerHTML = `<div class="markdown-body">${cleanHtml}</div>${footerHtml}`;
    autoScroll();
}

async function handleSend() {
    if(isGenerating) return;
    const text = chatInput.value.trim();
    if(!text) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    appendUserMessage(text);
    const aiWrapper = appendAIPlaceholder();
    isGenerating = true;

    // FAKE RAG SYSTEM PROMPT FOR DEMO
    const systemPrompt = `You are a highly experienced CBSE Class 10 Board Exam Tutor demonstrating an AI feature to a client.
Act precisely as if you have scanned all NCERT textbooks and Past Year Questions for the subject: ${currentSubject}.

When answering, ALWAYS follow this strict structure to impress the client:
1.  **Quick Concept** – 1-line core idea
2.  **Detailed Explanation** – Highly structured, bulleted answer exactly as expected by a CBSE Examiner
3.  **Topper's Tip** – Provide a real strategy for presenting this answer
4.  **Calculations/Equations** – If mathematics or science is involved, clearly state the steps
5.  **Marks Breakdown** – Conclude by showing how marks (out of 3 or 5) would be awarded by an examiner.

FORMATTING: Use bold, italics, and markdown clearly.
Question to resolve: ${text}`;

    const t0 = performance.now();
    try {
        const response = await fetch(CHAT_API_ROUTE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                temperature: 0.3,
                max_tokens: 1500
            })
        });

        if(!response.ok) throw new Error("Groq API Error: " + response.statusText);

        const result = await response.json();
        const t1 = performance.now();
        const elapsed = ((t1 - t0)/1000).toFixed(1);

        updateAIMessage(aiWrapper, {
            answer: result.choices[0].message.content,
            subject: currentSubject === "All Subjects" ? "General Insight" : currentSubject
        }, elapsed);

    } catch (e) {
        aiWrapper.querySelector('.message-content').innerHTML = `
            <div style="color: #ff453a;">
                <b>Request Error:</b> Could not reach AI model.<br/>${e.message}
            </div>
        `;
        autoScroll();
    } finally {
        isGenerating = false;
        sendBtn.disabled = (chatInput.value.trim() === '');
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Boot
// ──────────────────────────────────────────────────────────────────────────────
sendBtn.disabled = true;
renderSuggestions();
checkHealth();
fetchStats();
