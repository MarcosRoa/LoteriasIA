import { mostrarToast, mostrarModalLogin, fecharModalLogin } from './utils.js';
import { getProStatus, limparDadosAntigos } from './supabase.js';

const firebaseConfig = {
    apiKey: "AIzaSyCA_FoID7Ch8LkcwK5TbQSK23lU7BxQMuE",
    authDomain: "loteriasia.firebaseapp.com",
    projectId: "loteriasia",
    storageBucket: "loteriasia.firebasestorage.app",
    messagingSenderId: "124650527048",
    appId: "1:124650527048:web:bc335922cb9e1586c3fb7d",
    measurementId: "G-PQ8XZ46SSD"
};

firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();

export let isAdminMode = false;
export function isAdminUser() { return false; }
export const isAdminConfigured = false;

export async function loginGoogle() {
    try { 
        const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
        await processarLogin(result.user); 
        fecharModalLogin(); 
    } catch(e) { mostrarToast('Erro login', 'error'); }
}

export async function loginFacebook() {
    try { 
        const result = await auth.signInWithPopup(new firebase.auth.FacebookAuthProvider()); 
        await processarLogin(result.user); 
        fecharModalLogin(); 
    } catch(e) { mostrarToast('Erro login', 'error'); }
}

export async function logout() {
    try { 
        await auth.signOut(); 
        if (window.usuarioAtual) window.usuarioAtual = null;
        window.creditosUsuario = 0;
        const { atualizarInterfaceUsuario } = await import('./ui.js');
        atualizarInterfaceUsuario();
        mostrarToast('Logout realizado!', 'success'); 
    } catch(e) { console.error(e); }
}

export function onAuthStateChanged(callback) { return auth.onAuthStateChanged(callback); }

async function carregarStatusPro(uid) {
    try {
        const proStatus = await getProStatus(uid);
        return { isPro: proStatus?.is_pro || false, proExpiresAt: proStatus?.expira_em || null, proDiasRestantes: proStatus?.dias_restantes || 0 };
    } catch (error) { return { isPro: false, proExpiresAt: null, proDiasRestantes: 0 }; }
}

export async function processarLogin(user) {
    if (isAdminUser()) return;
    const { carregarCreditosSupabase, salvarCreditoSupabase } = await import('./supabase.js');
    const { setUsuarioAtual, setCreditosUsuario } = await import('./main.js');
    
    let creditos = await carregarCreditosSupabase(user.uid, window.usuarioAtual);
    const oldCredits = localStorage.getItem(`creditos_${user.uid}`);
    if (oldCredits) { 
        const old = parseInt(oldCredits); 
        if (old > 0 && creditos === 5) { creditos = old; await salvarCreditoSupabase(user.uid, old); } 
        localStorage.removeItem(`creditos_${user.uid}`);
        localStorage.removeItem(`historico_${user.uid}`);
    }
    
    const proStatus = await carregarStatusPro(user.uid);
    const usuario = { uid: user.uid, nome: user.displayName || user.email?.split('@')[0] || 'Usuário', email: user.email, foto: user.photoURL, isAdmin: false, isPro: proStatus.isPro, proExpiresAt: proStatus.proExpiresAt, proDiasRestantes: proStatus.proDiasRestantes };
    
    setUsuarioAtual(usuario);
    setCreditosUsuario(creditos);
    window.usuarioAtual = usuario;
    window.creditosUsuario = creditos;
    window.usuarioIsPro = proStatus.isPro;
    
    const { carregarConfiguracoesUsuario } = await import('./main.js');
    carregarConfiguracoesUsuario();
    const { atualizarInterfaceUsuario } = await import('./ui.js');
    atualizarInterfaceUsuario();
    await limparDadosAntigos(user.uid);
    
    const proMsg = proStatus.isPro ? ` ⭐ PRO (válido até ${new Date(proStatus.proExpiresAt).toLocaleDateString()})` : '';
    mostrarToast(`Bem-vindo ${usuario.nome}! Saldo: R$ ${creditos}${proMsg}`, 'success');
}

export async function atualizarStatusPro() {
    if (!window.usuarioAtual) return;
    const proStatus = await carregarStatusPro(window.usuarioAtual.uid);
    window.usuarioAtual.isPro = proStatus.isPro;
    window.usuarioAtual.proExpiresAt = proStatus.proExpiresAt;
    window.usuarioAtual.proDiasRestantes = proStatus.proDiasRestantes;
    window.usuarioIsPro = proStatus.isPro;
    const { atualizarInterfaceUsuario } = await import('./ui.js');
    atualizarInterfaceUsuario();
    return proStatus.isPro;
}