// ============================================
// AUTH.js - Autenticação Firebase
// ============================================

import { mostrarToast, mostrarModalLogin, fecharModalLogin } from './utils.js';

// NÃO inicializar Firebase aqui! Ele já está no HTML

// Obter instância do auth
export const auth = firebase.auth();

export async function loginGoogle() {
    try {
        console.log('🔐 Iniciando login Google...');
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Login Google sucesso:', result.user.email);
        
        const { processarLogin } = await import('./main.js');
        await processarLogin(result.user);
        fecharModalLogin();
    } catch(e) {
        console.error('❌ Erro login Google:', e);
        mostrarToast('Erro no login Google: ' + e.message, 'error');
    }
}

export async function loginFacebook() {
    try {
        console.log('🔐 Iniciando login Facebook...');
        const provider = new firebase.auth.FacebookAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Login Facebook sucesso:', result.user.email);
        
        const { processarLogin } = await import('./main.js');
        await processarLogin(result.user);
        fecharModalLogin();
    } catch(e) {
        console.error('❌ Erro login Facebook:', e);
        mostrarToast('Erro no login Facebook: ' + e.message, 'error');
    }
}

export async function logout() {
    try {
        await auth.signOut();
        console.log('✅ Logout realizado');
        
        if (window.usuarioAtual) window.usuarioAtual = null;
        window.creditosUsuario = 0;
        window.usuarioIsPro = false;
        
        const { atualizarInterfaceUsuario } = await import('./ui.js');
        atualizarInterfaceUsuario();
        mostrarToast('Logout realizado!', 'success');
    } catch(e) {
        console.error('❌ Erro logout:', e);
    }
}

export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

export function getCurrentUser() {
    return auth.currentUser;
}

// Função para atualizar status PRO
export async function atualizarStatusPro() {
    if (!window.usuarioAtual) return false;
    
    const { getProStatus } = await import('./supabase.js');
    const proStatus = await getProStatus(window.usuarioAtual.uid);
    
    window.usuarioAtual.isPro = proStatus?.is_pro || false;
    window.usuarioAtual.proExpiresAt = proStatus?.expira_em || null;
    window.usuarioAtual.proDiasRestantes = proStatus?.dias_restantes || 0;
    window.usuarioIsPro = proStatus?.is_pro || false;
    
    const { atualizarInterfaceUsuario } = await import('./ui.js');
    atualizarInterfaceUsuario();
    
    return proStatus?.is_pro || false;
}