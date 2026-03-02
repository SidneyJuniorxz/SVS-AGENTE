// SVS Chatbot Widget
(function() {
  const SVSChatbot = {
    config: {
      apiUrl: 'https://svs-agent.manus.space/api/trpc',
      position: 'bottom-right',
      theme: 'light'
    },
    
    visitorId: null,
    messages: [],
    isOpen: false,
    
    init: function(options) {
      this.config = { ...this.config, ...options };
      this.visitorId = this.generateVisitorId();
      this.createWidget();
      this.attachEventListeners();
    },
    
    generateVisitorId: function() {
      const stored = localStorage.getItem('svs_visitor_id');
      if (stored) return stored;
      
      const id = 'visitor_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('svs_visitor_id', id);
      return id;
    },
    
    createWidget: function() {
      // Container principal
      const container = document.createElement('div');
      container.id = 'svs-chatbot-container';
      container.style.cssText = `
        position: fixed;
        ${this.config.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : 'bottom: 20px; left: 20px;'}
        width: 380px;
        max-width: 90vw;
        height: 600px;
        max-height: 80vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        z-index: 9999;
        box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: white;
      `;
      
      // Header
      const header = document.createElement('div');
      header.style.cssText = `
        background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      `;
      
      const title = document.createElement('div');
      title.innerHTML = '<strong>SVS Soluções</strong><br><small style="opacity: 0.9; font-size: 12px;">Estamos aqui para ajudar!</small>';
      title.style.cssText = 'flex: 1;';
      
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      header.appendChild(title);
      header.appendChild(closeBtn);
      
      // Messages area
      const messagesArea = document.createElement('div');
      messagesArea.id = 'svs-messages';
      messagesArea.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 12px;
      `;
      
      // Input area
      const inputArea = document.createElement('div');
      inputArea.style.cssText = `
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 8px;
        background: white;
      `;
      
      const input = document.createElement('input');
      input.id = 'svs-message-input';
      input.type = 'text';
      input.placeholder = 'Digite sua mensagem...';
      input.style.cssText = `
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        font-family: inherit;
      `;
      
      const sendBtn = document.createElement('button');
      sendBtn.innerHTML = '➤';
      sendBtn.style.cssText = `
        background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 16px;
      `;
      
      inputArea.appendChild(input);
      inputArea.appendChild(sendBtn);
      
      // Montar widget
      container.appendChild(header);
      container.appendChild(messagesArea);
      container.appendChild(inputArea);
      document.body.appendChild(container);
      
      // Event listeners
      closeBtn.addEventListener('click', () => this.toggleWidget());
      header.addEventListener('click', (e) => {
        if (e.target !== closeBtn && !closeBtn.contains(e.target)) {
          this.toggleWidget();
        }
      });
      
      sendBtn.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
      
      // Mensagem inicial
      this.addMessage('assistant', 'Olá! 👋 Como posso ajudá-lo?');
    },
    
    toggleWidget: function() {
      const container = document.getElementById('svs-chatbot-container');
      this.isOpen = !this.isOpen;
      container.style.height = this.isOpen ? '600px' : '60px';
      container.style.maxHeight = this.isOpen ? '80vh' : '60px';
    },
    
    addMessage: function(role, content) {
      const messagesArea = document.getElementById('svs-messages');
      const messageEl = document.createElement('div');
      messageEl.style.cssText = `
        display: flex;
        ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      `;
      
      const bubble = document.createElement('div');
      bubble.style.cssText = `
        max-width: 70%;
        padding: 10px 14px;
        border-radius: 12px;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.4;
        ${role === 'user'
          ? 'background: #1e40af; color: white; border-bottom-right-radius: 4px;'
          : 'background: white; color: #1f2937; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px;'
        }
      `;
      
      bubble.textContent = content;
      messageEl.appendChild(bubble);
      messagesArea.appendChild(messageEl);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    },
    
    sendMessage: function() {
      const input = document.getElementById('svs-message-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      this.addMessage('user', message);
      input.value = '';
      
      // Mostrar indicador de digitação
      const messagesArea = document.getElementById('svs-messages');
      const typingEl = document.createElement('div');
      typingEl.id = 'svs-typing';
      typingEl.style.cssText = `
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        width: fit-content;
      `;
      typingEl.innerHTML = '<span style="animation: pulse 1s infinite;">●</span><span style="animation: pulse 1s infinite; animation-delay: 0.2s;">●</span><span style="animation: pulse 1s infinite; animation-delay: 0.4s;">●</span>';
      messagesArea.appendChild(typingEl);
      messagesArea.scrollTop = messagesArea.scrollHeight;
      
      // Enviar para o servidor
      this.sendToServer(message).then(response => {
        typingEl.remove();
        this.addMessage('assistant', response);
      }).catch(error => {
        typingEl.remove();
        this.addMessage('assistant', 'Desculpe, ocorreu um erro. Por favor, tente novamente.');
        console.error('Chatbot error:', error);
      });
    },
    
    sendToServer: function(message) {
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'chatbot.sendMessage',
        params: {
          visitorId: this.visitorId,
          message: message
        }
      };
      
      return fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.result?.response) {
          return data.result.response;
        }
        throw new Error('Invalid response');
      });
    }
  };
  
  // Expor globalmente
  window.SVSChatbot = SVSChatbot;
  
  // Auto-init se houver configuração no HTML
  if (window.SVSChatbotConfig) {
    SVSChatbot.init(window.SVSChatbotConfig);
  }
})();

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  
  #svs-messages::-webkit-scrollbar {
    width: 6px;
  }
  
  #svs-messages::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  #svs-messages::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  #svs-messages::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;
document.head.appendChild(style);
