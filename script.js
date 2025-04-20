// API Configuration
const API_KEY = "AIzaSyAbGmRoKZ2AItMiN02M4_xzVr6UC10pNsQ";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const newChatBtn = document.getElementById('new-chat-btn');
const conversationHistory = document.getElementById('conversation-history');

// Chat History
let chatHistory = [];
let conversations = [];
let currentConversationId = Date.now().toString();

// Initialize the app
function init() {
    loadConversations();
    
    // Load last active conversation if exists
    const lastConversationId = localStorage.getItem('currentConversationId');
    if (lastConversationId) {
        loadConversation(lastConversationId);
    } else {
        showWelcomeMessage();
    }
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    newChatBtn.addEventListener('click', startNewChat);

    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });
    
    // Add this to your existing init() function
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });

    // Ensure the mobile menu button follows the sidebar
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
}

function loadConversations() {
    const savedConversations = localStorage.getItem('gemini-conversations');
    if (savedConversations) {
        conversations = JSON.parse(savedConversations);
        renderConversationHistory();
    }
}

function saveConversations() {
    localStorage.setItem('gemini-conversations', JSON.stringify(conversations));
    renderConversationHistory();
}

function renderConversationHistory() {
    conversationHistory.innerHTML = '';
    conversations.forEach(convo => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.dataset.id = convo.id;
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'conversation-title-container';
        
        // Add title
        const title = document.createElement('span');
        title.textContent = convo.title;
        title.style.cursor = 'pointer';
        
        // Add click event to the entire item
        item.addEventListener('click', () => loadConversation(convo.id));
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-chat-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(convo.id);
        });
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(deleteBtn);
        item.appendChild(titleContainer);
        conversationHistory.appendChild(item);
    });
}

function deleteConversation(conversationId) {
    if (confirm('Are you sure you want to delete this conversation?')) {
        conversations = conversations.filter(c => c.id !== conversationId);
        saveConversations();
        
        if (conversationId === currentConversationId) {
            startNewChat();
        }
    }
}

function loadConversation(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
        currentConversationId = conversationId;
        localStorage.setItem('currentConversationId', conversationId);
        chatHistory = conversation.messages;
        chatContainer.innerHTML = '';
        
        if (chatHistory.length === 0) {
            showWelcomeMessage();
        } else {
            chatHistory.forEach(msg => {
                addMessageToUI(msg.role, msg.content);
            });
        }
    }
}

function startNewChat() {
    currentConversationId = Date.now().toString();
    localStorage.setItem('currentConversationId', currentConversationId);
    chatHistory = [];
    showWelcomeMessage();
    
    // Clear message input
    if (messageInput) {
        messageInput.value = '';
        messageInput.style.height = 'auto';
    }
    
    // Close mobile sidebar and menu button if open
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
    }
}

function showWelcomeMessage() {
    chatContainer.innerHTML = `
        <div class="welcome-message" id="welcome-message">
            <h2>Apa yang bisa saya bantu?</h2>
        </div>
    `;
}

function formatMessage(text) {
    // Convert asterisk lists to numbered lists
    let listCounter = 1;
    text = text.replace(/^\* (.+)$/gm, function(match, content) {
        return `${listCounter++}. ${content}`;
    });

    // Existing format handling
    text = text.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>');
    text = text.replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.split('\n\n').map(para => `<p>${para}</p>`).join('');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function addMessageToUI(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);
    
    messageDiv.appendChild(messageContent);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.id = 'loading-indicator';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content typing-animation';
    messageContent.innerHTML = '<span class="typing-dots">...</span>';
    
    loadingDiv.appendChild(messageContent);
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) welcomeMessage.remove();

    messageInput.value = '';
    messageInput.style.height = 'auto';
    addMessageToUI('user', message);
    chatHistory.push({ role: 'user', content: message });

    sendButton.disabled = true;
    showLoadingIndicator();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: message }]
                }]
            })
        });

        const data = await response.json();
        removeLoadingIndicator();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to get response');
        }

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            let responseText = data.candidates[0].content.parts[0].text;

            // Filter out sensitive information
            const sensitivePatterns = [
                /google/i,
                /gemini/i,
                /model\s+bahasa/i,
                /large\s+language\s+model/i,
            ];

            sensitivePatterns.forEach(pattern => {
                if (pattern.test(responseText)) {
                    responseText = "Saya adalah asisten virtual yang dirancang untuk membantu Anda dengan berbagai pertanyaan dan tugas. Apakah ada yang bisa saya bantu lebih lanjut?";
                }
            });

            addMessageToUI('bot', responseText);
            chatHistory.push({ role: 'bot', content: responseText });

            // Update conversation history
            const convoIndex = conversations.findIndex(c => c.id === currentConversationId);
            if (convoIndex >= 0) {
                conversations[convoIndex].messages = chatHistory;
            } else {
                conversations.push({
                    id: currentConversationId,
                    title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
                    messages: chatHistory
                });
            }
            saveConversations();
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        console.error('API Error:', error);
        addMessageToUI('bot', 'Maaf, terjadi kesalahan. Silakan coba lagi atau tanyakan hal lain.');
    }

    sendButton.disabled = false;
}

// Initialize the application
init();