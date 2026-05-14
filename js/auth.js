// ============================================
// AUTH.js - Autenticação Firebase (SEM DUPLICAÇÃO)
// ============================================

import { mostrarToast, mostrarModalLogin, fecharModalLogin } from './utils.js';

// Configuração do Firebase (usada apenas para inicialização)
const firebaseConfig = {
    apiKey: "AIzaSyCA_FoID7Ch8LkcwK5TbQSK23lU7BxQMuE",
    authDomain: "loteriasia.firebaseapp.com",
    projectId: "loteriasia",
    storageBucket: "loteriasia.firebasestorage.app",
    messagingSenderId: "124650527048",
    appId: "1:124650527048:web:bc335922cb9e1586c3fb7d",
    measurementId: "G-PQ8XZ46SSD"
};

// Inicializar Firebase (apenas se não foi inicializado)
export function initFirebase() {
    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase inicializado');
    } else {
        console.log('✅ Firebase já estava inicializado');
    }
}

// Obter instância do auth (usando o Firebase global)
export const auth = firebase.auth();

// Admin DESATIVADO
export let isAdminMode = false;
export function isAdminUser() { return false; }
export const isAdminConfigured = false;

export async function loginGoogle() {
    try { 
        const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
        const { processarLogin } = await import('./main.js');
        await processarLogin(result.user); 
        fecharModalLogin(); 
    } catch(e) { mostrarToast('Erro login Google', 'error'); }
}

export async function loginFacebook() {
    try { 
        const result = await auth.signInWithPopup(new firebase.auth.FacebookAuthProvider()); 
        const { processarLogin } = await import('./main.js');
        await processarLogin(result.user); 
        fecharModalLogin(); 
    } catch(e) { mostrarToast('Erro login Facebook', 'error'); }
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

export function onAuthStateChanged(callback) { 
    return auth.onAuthStateChanged(callback); 
}

export function getCurrentUser() { return auth.currentUser; }