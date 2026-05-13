// ============================================
// UTILS - Funções auxiliares
// ============================================

export function getNomeMes(numero) {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[numero - 1] || 'Desconhecido';
}

export function formatarNumeroZero(numero) {
    return numero.toString().padStart(2, '0');
}

export function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = tipo === 'success' ? '#22c55e' : tipo === 'error' ? '#ef4444' : '#f59e0b';
    toast.innerHTML = `<div><span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span><span>${mensagem}</span><button onclick="this.parentElement.remove()">✕</button></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

export function aguardarSupabase() {
    return new Promise((resolve) => {
        if (window.supabaseClient) { resolve(); return; }
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) { clearInterval(checkInterval); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(checkInterval); resolve(); }, 5000);
    });
}

export function mostrarModalLogin() {
    const existing = document.querySelector('.modal-login-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-login-overlay';
    overlay.innerHTML = `
        <div class="modal-login-container">
            <div class="modal-login-logo">🎲</div>
            <div class="modal-login-title">Loterias V.6.1</div>
            <div class="modal-login-message">
                🔐 Para gerar seus palpites e salvar seu histórico,<br>
                <strong>faça login utilizando Google ou Facebook</strong>.
            </div>
            <button class="modal-login-btn" onclick="fecharModalLogin()">OK, entendi</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

export function fecharModalLogin() {
    const modal = document.querySelector('.modal-login-overlay');
    if (modal) modal.remove();
}

export function verificarLoginEAcao(acao, usuarioAtual) {
    if (!usuarioAtual) {
        mostrarModalLogin();
        return false;
    }
    if (typeof acao === 'function') acao();
    return true;
}

// Variável global de manutenção
export let maintenanceMode = false;

export function checkMaintenance() {
    const maintenanceScreen = document.getElementById('maintenanceScreen');
    const container = document.querySelector('.container');
    const header = document.querySelector('.header');
    const userPanel = document.getElementById('userPanel');
    
    if (maintenanceMode === true) {
        if (maintenanceScreen) maintenanceScreen.style.display = 'block';
        if (container) container.style.display = 'none';
        if (header) header.style.display = 'none';
        if (userPanel) userPanel.style.display = 'none';
        return true;
    } else {
        if (maintenanceScreen) maintenanceScreen.style.display = 'none';
        if (container) container.style.display = 'block';
        if (header) header.style.display = 'block';
        if (userPanel) userPanel.style.display = 'flex';
        return false;
    }
}

export function getModoTexto(modo) { 
    const modos = { 
        'ia_especialista': '🎓 IA Especialista', 
        'probabilistico': '📊 Probabilístico', 
        'aleatorio_inteligente': '🎲 Aleatório Inteligente',
        'aleatorio_puro': '🎯 Aleatório Puro (RNG)'
    }; 
    return modos[modo] || modo; 
}