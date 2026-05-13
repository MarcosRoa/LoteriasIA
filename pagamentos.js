// ============================================
// PAGAMENTOS - PIX, compras e ATIVAÇÃO PRO
// ============================================

import { mostrarToast } from './utils.js';
import { VALORES_PIX } from './loterias.js';
import { salvarCreditoSupabase, salvarTransacaoSupabase, ativarPro } from './supabase.js';
import { atualizarStatusPro } from './auth.js';

export const MP_SANDBOX = true;

// ============================================
// COMPRA DE CRÉDITOS (existente)
// ============================================

export async function iniciarPagamentoPix(valor, usuarioAtual, creditosUsuario, setCreditosUsuario, salvarCreditoSupabaseFn, salvarTransacaoSupabaseFn) {
    if (MP_SANDBOX) { 
        mostrarModalPixSimulado(valor, usuarioAtual, creditosUsuario, setCreditosUsuario, salvarCreditoSupabaseFn, salvarTransacaoSupabaseFn); 
    } else { 
        await criarPagamentoPixReal(valor); 
    }
}

function mostrarModalPixSimulado(valor, usuarioAtual, creditosUsuario, setCreditosUsuario, salvarCreditoSupabaseFn, salvarTransacaoSupabaseFn) {
    const existing = document.querySelector('.modal-pix-overlay');
    if (existing) existing.remove();
    const qrCodeSimulado = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=00020126580014br.gov.bcb.pix0136a7f8e9d0-1234-5678-9abc-def0123456785204000053039865404${valor}5802BR5913Loterias IA6009SAO PAULO62290525PIX${Date.now()}6304E2A8`;
    const pixCopiaCola = `00020126580014br.gov.bcb.pix0136a7f8e9d0-1234-5678-9abc-def0123456785204000053039865404${valor}5802BR5913Loterias IA6009SAO PAULO62290525PIX${Date.now()}6304E2A8`;
    const overlay = document.createElement('div');
    overlay.className = 'modal-pix-overlay';
    overlay.innerHTML = `
        <div class="modal-pix-container">
            <div style="font-size: 48px; margin-bottom: 10px;">💳🧪</div>
            <h3 style="color: #10b981;">MODO TESTE - PIX SIMULADO</h3>
            <p style="color: var(--text-secondary); margin: 10px 0;">Valor: <strong style="color: #fbbf24;">R$ ${valor.toFixed(2)}</strong></p>
            <p style="font-size: 12px; color: #f59e0b; margin: 5px 0;">⚠️ Ambiente de testes - Nenhum pagamento real será processado</p>
            <div class="qr-code-area"><img src="${qrCodeSimulado}" alt="QR Code PIX" style="width: 200px;"></div>
            <div class="pix-copy-area"><code>${pixCopiaCola.substring(0, 50)}...</code></div>
            <button class="btn-copiar" onclick="copiarPixSimulado('${pixCopiaCola}')">📋 Copiar código PIX</button>
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="simularPagamentoPix(${valor})" style="background: #10b981;">✅ Simular Pagamento (Teste)</button>
                <button class="btn" onclick="fecharModalPix()" style="background: #64748b;">Fechar</button>
            </div>
            <p style="font-size: 11px; margin-top: 15px;">💡 Modo Sandbox - Para testar, clique em "Simular Pagamento"</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    window.simularPagamentoPix = async function(valor) {
        fecharModalPix();
        mostrarToast('🔄 Processando pagamento simulado...', 'info');
        await new Promise(r => setTimeout(r, 1500));
        
        let novoSaldo = window.creditosUsuario + valor;
        window.creditosUsuario = novoSaldo;
        await salvarCreditoSupabaseFn(window.usuarioAtual.uid, novoSaldo);
        await salvarTransacaoSupabaseFn(window.usuarioAtual.uid, { tipo: 'pix_simulado', quantidade: valor, saldo: novoSaldo, data: new Date() });
        
        const creditsDisplay = document.getElementById('creditosDisplay');
        if (creditsDisplay) creditsDisplay.textContent = `R$ ${novoSaldo}`;
        mostrarToast(`✅ Pagamento simulado aprovado! R$ ${valor} adicionados. Saldo: R$ ${novoSaldo}`, 'success');
    };
}

// ============================================
// 🆕 ATIVAÇÃO DO PLANO PRO
// ============================================

export async function comprarPro() {
    if (!window.usuarioAtual) {
        const { mostrarModalLogin } = await import('./utils.js');
        mostrarModalLogin();
        return;
    }
    
    // Verificar se já é PRO
    if (window.usuarioIsPro) {
        const diasRestantes = window.usuarioAtual?.proDiasRestantes || 0;
        mostrarToast(`⭐ Você já é PRO! Válido por mais ${diasRestantes} dias.`, 'info');
        return;
    }
    
    const valor = 19.90;
    
    // Mostrar modal de confirmação
    const confirmacao = confirm(`⭐ ATIVAR PLANO PRO\n\nValor: R$ ${valor}\nDuração: 15 dias\n\nBenefícios:\n• Exportar PDF de palpites selecionados\n• Ver configurações detalhadas de cada palpite\n• Suporte prioritário\n\nDeseja continuar?`);
    
    if (!confirmacao) return;
    
    if (MP_SANDBOX) {
        mostrarModalPixSimuladoPro(valor);
    } else {
        await criarPagamentoPixRealPro(valor);
    }
}

function mostrarModalPixSimuladoPro(valor) {
    const existing = document.querySelector('.modal-pix-overlay');
    if (existing) existing.remove();
    
    const qrCodeSimulado = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=PRO_${Date.now()}`;
    const pixCopiaCola = `PRO_${Date.now()}`;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-pix-overlay';
    overlay.innerHTML = `
        <div class="modal-pix-container">
            <div style="font-size: 48px;">⭐🧪</div>
            <h3 style="color: #f59e0b;">MODO TESTE - ATIVAÇÃO PRO</h3>
            <p style="color: var(--text-secondary);">Valor: <strong style="color: #fbbf24;">R$ ${valor.toFixed(2)}</strong></p>
            <p style="font-size: 12px; color: #f59e0b;">⚠️ Modo teste - Nenhum pagamento real</p>
            <div class="qr-code-area"><img src="${qrCodeSimulado}" style="width: 200px;"></div>
            <div class="pix-copy-area"><code>${pixCopiaCola}</code></div>
            <button class="btn-copiar" onclick="copiarPixSimulado('${pixCopiaCola}')">📋 Copiar</button>
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="simularAtivacaoPro(${valor})" style="background: #f59e0b;">⭐ Simular Ativação PRO</button>
                <button class="btn" onclick="fecharModalPix()" style="background: #64748b;">Fechar</button>
            </div>
            <p style="font-size: 11px;">💡 Teste: clique em "Simular Ativação PRO"</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    window.simularAtivacaoPro = async function(valor) {
        fecharModalPix();
        mostrarToast('🔄 Ativando plano PRO...', 'info');
        await new Promise(r => setTimeout(r, 1500));
        
        // Ativar PRO no banco
        const sucesso = await ativarPro(window.usuarioAtual.uid, valor, 15);
        
        if (sucesso) {
            // Atualizar status PRO no frontend
            await atualizarStatusPro();
            
            // Atualizar interface
            const { atualizarInterfaceUsuario } = await import('./ui.js');
            atualizarInterfaceUsuario();
            
            mostrarToast(`⭐ PARABÉNS! Agora você é PRO! Válido por 15 dias.`, 'success');
        } else {
            mostrarToast('❌ Erro ao ativar PRO. Tente novamente.', 'error');
        }
    };
}

function copiarPixSimulado(codigo) { 
    navigator.clipboard.writeText(codigo); 
    mostrarToast('✅ Código PIX copiado!', 'success'); 
}

function fecharModalPix() { 
    const modal = document.querySelector('.modal-pix-overlay'); 
    if (modal) modal.remove(); 
}

function criarPagamentoPixReal(valor) { 
    mostrarToast('PIX real em desenvolvimento', 'info'); 
}

function criarPagamentoPixRealPro(valor) { 
    mostrarToast('PIX real em desenvolvimento', 'info'); 
}

export function abrirModalComprar(usuarioAtual, creditosUsuario, iniciarPagamentoPixFn) {
    if (!usuarioAtual) {
        const { mostrarModalLogin } = require('./utils.js');
        mostrarModalLogin();
        return;
    }
    let html = `<div class="modal-overlay" id="modalComprar"><div class="modal-container"><div class="modal-header"><h3>💰 Comprar Créditos</h3></div><div class="modal-body">`;
    html += `<p>💡 Cada jogo custa <strong>R$ 3,00</strong></p><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">`;
    VALORES_PIX.forEach(v => { 
        const q = v/3; 
        html += `<button onclick="iniciarPagamentoPixFn(${v})" style="background: linear-gradient(135deg,#10b981,#059669);border:none;border-radius:12px;padding:15px;color:white;cursor:pointer;"><strong>R$ ${v}</strong><br><small>${q} jogos</small></button>`; 
    });
    html += `</div><p style="font-size:11px;margin-top:20px;">💳 Pagamento via PIX (Modo Teste)</p>`;
    html += `<hr style="margin: 15px 0;"><div style="text-align: center;">`;
    html += `<button onclick="window.comprarPro()" style="background: linear-gradient(135deg,#f59e0b,#eab308);border:none;border-radius:12px;padding:15px;color:#1e293b;cursor:pointer;font-weight:bold;width:100%;">⭐ ATIVAR PLANO PRO (R$ 19,90)</button>`;
    html += `<p style="font-size: 10px; margin-top: 8px;">⚡ Benefícios: Exportar PDF selecionado, configurações detalhadas, suporte prioritário</p>`;
    html += `</div></div><div class="modal-footer"><button onclick="fecharModalComprar()">Fechar</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

export function fecharModalComprar() { 
    document.getElementById('modalComprar')?.remove(); 
}