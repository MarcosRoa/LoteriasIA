// ============================================
// MAIN - Ponto de entrada do sistema
// ============================================

import { auth, onAuthStateChanged } from './auth.js';
import { carregarCreditosSupabase, salvarCreditoSupabase } from './supabase.js';
import { 
    LOTERIAS, cacheDados, cacheDatas, dadosAtuais,
    usuarioAtual, creditosUsuario, isTraining, iaTreinada, aiModel,
    setUsuarioAtual, setCreditosUsuario, setDadosAtuais, setIaTreinada, setAiModel, setIsTraining
} from './loterias.js';
import { carregarGridLoterias, selecionarLoteria, atualizarInterfaceUsuario, renderizarConteudo } from './ui.js';
import { checkMaintenance, mostrarToast, aguardarSupabase } from './utils.js';

// Exportar variáveis para outros módulos
export { usuarioAtual, creditosUsuario, isTraining, iaTreinada, aiModel };
export function setUsuarioAtual(valor) { window.usuarioAtual = valor; }
export function setCreditosUsuario(valor) { window.creditosUsuario = valor; }
export function setDadosAtuais(valor) { window.dadosAtuais = valor; }
export function setIaTreinada(valor) { window.iaTreinada = valor; }
export function setAiModel(valor) { window.aiModel = valor; }
export function setIsTraining(valor) { window.isTraining = valor; }

// Variáveis globais (acessíveis por outros módulos)
window.usuarioAtual = null;
window.creditosUsuario = 0;
window.dadosAtuais = [];
window.isTraining = false;
window.iaTreinada = false;
window.aiModel = null;
window.cacheDados = cacheDados;
window.cacheDatas = cacheDatas;
window.LOTERIAS = LOTERIAS;

export async function processarLogin(user) {
    const { isAdminUser } = await import('./auth.js');
    if (isAdminUser()) return;
    
    setUsuarioAtual({ 
        uid: user.uid, 
        nome: user.displayName || user.email?.split('@')[0] || 'Usuário', 
        email: user.email, 
        foto: user.photoURL, 
        isAdmin: false 
    });
    
    let creditos = await carregarCreditosSupabase(user.uid, usuarioAtual);
    setCreditosUsuario(creditos);
    
    // Migração de localStorage
    const oldCredits = localStorage.getItem(`creditos_${user.uid}`);
    if (oldCredits) { 
        const old = parseInt(oldCredits); 
        if (old > 0 && creditos === 5) { 
            setCreditosUsuario(old); 
            await salvarCreditoSupabase(user.uid, old); 
        } 
        localStorage.removeItem(`creditos_${user.uid}`);
        localStorage.removeItem(`historico_${user.uid}`);
    }
    
    carregarConfiguracoesUsuario();
    atualizarInterfaceUsuario();
    mostrarToast(`Bem-vindo ${window.usuarioAtual.nome}! Saldo: R$ ${window.creditosUsuario}`, 'success');
}

function carregarConfiguracoesUsuario() {
    if (!window.usuarioAtual) return;
    const saved = localStorage.getItem(`config_${window.usuarioAtual.uid}`);
    if (saved) {
        const config = JSON.parse(saved);
        const qtdInput = document.getElementById('qtdJogos');
        const modoSelect = document.getElementById('modoGeracao');
        if (config.qtdJogos && qtdInput) qtdInput.value = config.qtdJogos;
        if (config.modoGeracao && modoSelect) modoSelect.value = config.modoGeracao;
        if (config.dispersao) window.dispersaoAtual = config.dispersao;
        if (config.periodo) window.periodoSelecionado = config.periodo;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    checkMaintenance();
    
    const tema = localStorage.getItem('tema');
    if (tema === 'light') document.body.classList.add('light-mode');
    
    await aguardarSupabase();
    
    carregarGridLoterias();
    selecionarLoteria('megasena');
    
    onAuthStateChanged(async (user) => { 
        if (user) await processarLogin(user); 
        else atualizarInterfaceUsuario(); 
    });
    
    console.log('%c✅ Loterias V.6.1 - Versão Modularizada!', 'color: #22c55e; font-size: 14px;');
    mostrarToast(`Versão 6.1 - Sistema pronto!`, 'info');
});