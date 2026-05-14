// ============================================
// APP.JS - Ponto de entrada único do sistema
// ============================================

// Importar módulos
import { loginGoogle, loginFacebook, logout } from './auth.js';
import { carregarGridLoterias, atualizarInterfaceUsuario } from './ui.js';
import { processarLogin } from './main.js';
import { checkMaintenance, mostrarToast, aguardarSupabase } from './utils.js';

// Aguardar tudo carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando sistema...');
    
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase não carregou!');
        mostrarToast('Erro: Firebase não carregou. Recarregue a página.', 'error');
        return;
    }
    
    // Verificar se Supabase está disponível
    await aguardarSupabase();
    
    if (!window.supabaseClient) {
        console.error('❌ Supabase não carregou!');
        mostrarToast('Erro: Supabase não carregou. Recarregue a página.', 'error');
        return;
    }
    
    // Verificar manutenção
    checkMaintenance();
    
    // Carregar tema salvo
    const tema = localStorage.getItem('tema');
    if (tema === 'light') document.body.classList.add('light-mode');
    
    // Carregar grid de loterias
    carregarGridLoterias();
    
    // Configurar botões de login
    const btnGoogle = document.getElementById('btnGoogleLogin');
    const btnFacebook = document.getElementById('btnFacebookLogin');
    
    if (btnGoogle) {
        btnGoogle.onclick = () => {
            console.log('🔐 Botão Google clicado');
            loginGoogle();
        };
    }
    
    if (btnFacebook) {
        btnFacebook.onclick = () => {
            console.log('🔐 Botão Facebook clicado');
            loginFacebook();
        };
    }
    
    // Aguardar Firebase Auth estar pronto
    const auth = firebase.auth();
    
    // Configurar listener de autenticação
    auth.onAuthStateChanged(async (user) => {
        console.log('📢 Auth state changed:', user ? `✅ ${user.email}` : '❌ Deslogado');
        if (user) {
            await processarLogin(user);
        } else {
            atualizarInterfaceUsuario();
        }
    });
    
    // Expor funções globais
    window.loginGoogle = loginGoogle;
    window.loginFacebook = loginFacebook;
    window.logout = logout;
    window.abrirPerfil = () => { window.location.href = 'perfil.html'; };
    window.toggleTema = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('tema', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };
    window.selecionarLoteria = (loteria) => import('./ui.js').then(m => m.selecionarLoteria(loteria));
    window.gerarJogos = () => import('./ui.js').then(m => m.gerarJogos());
    window.treinarIAComFiltrosAtuais = () => import('./ui.js').then(m => m.treinarIAComFiltrosAtuais());
    window.executarBacktesting = () => import('./ui.js').then(m => m.executarBacktesting());
    window.mostrarRelatorioPadroes = () => import('./ui.js').then(m => m.mostrarRelatorioPadroes());
    window.setPeriodo = (p) => import('./ui.js').then(m => m.setPeriodo(p));
    window.atualizarDispersao = (v) => import('./ui.js').then(m => m.atualizarDispersao(v));
    window.atualizarQuantidadePorRange = (v) => {
        const qtdJogos = document.getElementById('qtdJogos');
        const qtdRange = document.getElementById('qtdRange');
        if (qtdJogos) qtdJogos.value = v;
        if (qtdRange) qtdRange.value = v;
    };
    window.atualizarQuantidadePorInput = (v) => {
        const qtdRange = document.getElementById('qtdRange');
        if (qtdRange) qtdRange.value = v;
    };
    window.abrirModalComprar = () => import('./pagamentos.js').then(m => m.abrirModalComprar());
    window.comprarPro = () => import('./pagamentos.js').then(m => m.comprarPro());
    
    mostrarToast('✅ Sistema pronto! Faça login para começar.', 'info');
    console.log('✅ App.js inicializado com sucesso');
});