// ============================================
// MAIN.js - Lógica principal e estado global
// ============================================

import { carregarCreditosSupabase, salvarCreditoSupabase, getProStatus, limparDadosAntigos } from './supabase.js';
import { mostrarToast } from './utils.js';
import { LOTERIAS, cacheDados, cacheDatas } from './loterias.js';
import { atualizarInterfaceUsuario } from './ui.js';

// Estado global
export let usuarioAtual = null;
export let creditosUsuario = 0;
export let isUserPro = false;

// Setters para atualizar estado
export function setUsuarioAtual(valor) { 
    usuarioAtual = valor; 
    window.usuarioAtual = valor; 
}
export function setCreditosUsuario(valor) { 
    creditosUsuario = valor; 
    window.creditosUsuario = valor; 
}
export function setIsUserPro(valor) { 
    isUserPro = valor; 
    window.usuarioIsPro = valor; 
}

// Inicializar variáveis globais
window.usuarioAtual = null;
window.creditosUsuario = 0;
window.usuarioIsPro = false;
window.dadosAtuais = [];
window.isTraining = false;
window.iaTreinada = false;
window.aiModel = null;
window.cacheDados = cacheDados;
window.cacheDatas = cacheDatas;
window.LOTERIAS = LOTERIAS;
window.periodoSelecionado = 'all';
window.dispersaoAtual = 15;
window.loteriaAtual = 'megasena';

export async function processarLogin(user) {
    const { isAdminUser } = await import('./auth.js');
    if (isAdminUser()) return;
    
    // Carregar créditos
    let creditos = await carregarCreditosSupabase(user.uid, usuarioAtual);
    
    // Migração de localStorage
    const oldCredits = localStorage.getItem(`creditos_${user.uid}`);
    if (oldCredits) { 
        const old = parseInt(oldCredits); 
        if (old > 0 && creditos === 5) { 
            creditos = old; 
            await salvarCreditoSupabase(user.uid, old); 
        } 
        localStorage.removeItem(`creditos_${user.uid}`);
        localStorage.removeItem(`historico_${user.uid}`);
    }
    
    // Carregar status PRO
    const proStatus = await getProStatus(user.uid);
    
    // Criar objeto do usuário
    const usuario = { 
        uid: user.uid, 
        nome: user.displayName || user.email?.split('@')[0] || 'Usuário', 
        email: user.email, 
        foto: user.photoURL, 
        isAdmin: false,
        isPro: proStatus?.is_pro || false,
        proExpiresAt: proStatus?.expira_em || null,
        proDiasRestantes: proStatus?.dias_restantes || 0
    };
    
    // Atualizar estado
    setUsuarioAtual(usuario);
    setCreditosUsuario(creditos);
    setIsUserPro(proStatus?.is_pro || false);
    
    // Carregar configurações salvas
    carregarConfiguracoesUsuario();
    
    // Atualizar interface
    atualizarInterfaceUsuario();
    
    // Limpar dados antigos (10 ou 30 dias baseado no status PRO)
    await limparDadosAntigos(user.uid);
    
    const proMsg = proStatus?.is_pro ? ` ⭐ PRO (válido até ${new Date(proStatus.expira_em).toLocaleDateString()})` : '';
    mostrarToast(`Bem-vindo ${usuario.nome}! Saldo: R$ ${creditos}${proMsg}`, 'success');
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

export function salvarConfiguracoesUsuario() {
    if (!window.usuarioAtual) return;
    const config = { 
        qtdJogos: document.getElementById('qtdJogos')?.value, 
        modoGeracao: document.getElementById('modoGeracao')?.value, 
        dispersao: window.dispersaoAtual, 
        periodo: window.periodoSelecionado 
    };
    localStorage.setItem(`config_${window.usuarioAtual.uid}`, JSON.stringify(config));
}