// ============================================
// APP.JS - Ponto de entrada único do sistema
// ============================================

// Importar módulos
import { loginGoogle, loginFacebook, logout, onAuthStateChanged, initFirebase } from './auth.js';
import { carregarGridLoterias, atualizarInterfaceUsuario } from './ui.js';
import { processarLogin } from './main.js';
import { checkMaintenance, mostrarToast } from './utils.js';

// Inicializar Firebase (apenas uma vez)
initFirebase();

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar manutenção
    checkMaintenance();
    
    // Carregar tema salvo
    const tema = localStorage.getItem('tema');
    if (tema === 'light') document.body.classList.add('light-mode');
    
    // Carregar grid de loterias
    carregarGridLoterias();
    
    // Configurar listeners de autenticação
    onAuthStateChanged(async (user) => {
        if (user) {
            await processarLogin(user);
        } else {
            atualizarInterfaceUsuario();
        }
    });
    
    // Configurar botões de login (usando IDs para evitar conflitos)
    const btnGoogle = document.getElementById('btnGoogleLogin');
    const btnFacebook = document.getElementById('btnFacebookLogin');
    
    if (btnGoogle) btnGoogle.onclick = () => loginGoogle();
    if (btnFacebook) btnFacebook.onclick = () => loginFacebook();
    
    // Expor funções globais para onclick (para botões dinâmicos)
    window.logout = logout;
    window.abrirModalComprar = () => import('./pagamentos.js').then(m => m.abrirModalComprar());
    window.comprarPro = () => import('./pagamentos.js').then(m => m.comprarPro());
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
    window.atualizarQuantidadePorRange = (v) => { document.getElementById('qtdJogos').value = v; document.getElementById('qtdRange').value = v; };
    window.atualizarQuantidadePorInput = (v) => { document.getElementById('qtdRange').value = v; };
    window.setPeriodo = (p) => import('./ui.js').then(m => m.setPeriodo(p));
    window.atualizarDispersao = (v) => import('./ui.js').then(m => m.atualizarDispersao(v));
    
    mostrarToast(`Versão 6.1 - Sistema pronto!`, 'info');
});

// Exportar funções que podem ser usadas por outros módulos
export { atualizarInterfaceUsuario };