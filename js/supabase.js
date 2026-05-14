// ============================================
// SUPABASE.js - Operações de banco (VERIFICA window)
// ============================================

import { mostrarToast } from './utils.js';
import { isAdminUser } from './auth.js';

// Função auxiliar para verificar se Supabase está disponível
function checkSupabase() {
    if (!window.supabaseClient) {
        console.error('❌ Supabase não inicializado');
        return false;
    }
    return true;
}

export async function salvarTransacaoSupabase(uid, transacao) {
    if (!checkSupabase() || isAdminUser()) return;
    try {
        await window.supabaseClient.from('transacoes').insert({ 
            usuario_uid: uid, 
            tipo: transacao.tipo, 
            quantidade: transacao.quantidade,
            saldo_apos: transacao.saldo, 
            data: new Date() 
        });
        console.log('✅ Transação salva');
    } catch (error) { console.error('Erro transação:', error); }
}

export async function carregarCreditosSupabase(uid, usuarioAtual) {
    if (!checkSupabase() || isAdminUser()) return 5;
    try {
        const { data, error } = await window.supabaseClient
            .from('usuarios')
            .select('creditos')
            .eq('uid', uid)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!data) {
            await window.supabaseClient.from('usuarios').insert({ 
                uid: uid, 
                nome: usuarioAtual?.nome || '', 
                email: usuarioAtual?.email || '', 
                creditos: 5, 
                created_at: new Date(), 
                updated_at: new Date() 
            });
            return 5;
        }
        return data.creditos || 5;
    } catch (error) { return 5; }
}

export async function salvarCreditoSupabase(uid, novoSaldo) {
    if (!checkSupabase() || isAdminUser()) return;
    try {
        const { data: existe } = await window.supabaseClient
            .from('usuarios')
            .select('uid')
            .eq('uid', uid)
            .maybeSingle();
        
        if (existe) {
            await window.supabaseClient
                .from('usuarios')
                .update({ creditos: novoSaldo, updated_at: new Date() })
                .eq('uid', uid);
        } else {
            await window.supabaseClient
                .from('usuarios')
                .insert({ uid: uid, creditos: novoSaldo, created_at: new Date(), updated_at: new Date() });
        }
        console.log('✅ Créditos salvos:', novoSaldo);
    } catch (error) { console.error('Erro:', error); mostrarToast('Erro ao salvar no banco.', 'error'); }
}

export async function salvarHistoricoSupabase(uid, loteria, jogos, filtros, extras, meses = null) {
    if (!checkSupabase() || isAdminUser()) return;
    try {
        const insertData = { 
            usuario_uid: uid, 
            loteria: loteria, 
            jogos: jogos, 
            filtros: filtros, 
            extras: extras, 
            data: new Date() 
        };
        if (meses && Array.isArray(meses) && meses.length > 0) insertData.meses = meses;
        await window.supabaseClient.from('historico_palpites').insert(insertData);
        console.log('✅ Histórico salvo!');
    } catch (error) { console.error('Erro ao salvar histórico:', error); }
}

export async function carregarHistoricoSupabase(uid) {
    if (!checkSupabase() || isAdminUser()) return [];
    try {
        const { data } = await window.supabaseClient
            .from('historico_palpites')
            .select('*')
            .eq('usuario_uid', uid)
            .order('data', { ascending: false })
            .limit(50);
        return data || [];
    } catch (error) { return []; }
}

// FUNÇÕES PRO
export async function isUserPro(uid) {
    if (!checkSupabase()) return false;
    try {
        const { data, error } = await window.supabaseClient.rpc('is_user_pro', { user_uid: uid });
        if (error) throw error;
        return data || false;
    } catch (error) { return false; }
}

export async function getProStatus(uid) {
    if (!checkSupabase()) return { is_pro: false, expira_em: null, dias_restantes: 0 };
    try {
        const { data, error } = await window.supabaseClient.rpc('get_pro_status', { user_uid: uid });
        if (error) throw error;
        if (data && data.length > 0) return data[0];
        return { is_pro: false, expira_em: null, dias_restantes: 0 };
    } catch (error) { return { is_pro: false, expira_em: null, dias_restantes: 0 }; }
}

export async function ativarPro(uid, valorPagamento = 19.90, diasValidade = 15) {
    if (!checkSupabase()) return false;
    try {
        const { data, error } = await window.supabaseClient.rpc('ativar_pro', { 
            user_uid: uid, 
            valor_pagamento: valorPagamento, 
            dias_validade: diasValidade 
        });
        if (error) throw error;
        console.log(`✅ PRO ativado para ${uid}`);
        return true;
    } catch (error) { console.error('Erro ao ativar PRO:', error); return false; }
}

export async function getDiasProRestantes(uid) {
    if (!checkSupabase()) return 0;
    try {
        const { data, error } = await window.supabaseClient.rpc('dias_pro_restantes', { user_uid: uid });
        if (error) throw error;
        return data || 0;
    } catch (error) { return 0; }
}

export async function limparDadosAntigos(uid = null) {
    if (!checkSupabase()) return 0;
    try {
        let result;
        if (uid) {
            const { data, error } = await window.supabaseClient.rpc('limpar_historico_usuario', { user_uid: uid });
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await window.supabaseClient.rpc('limpar_historico_antigo');
            if (error) throw error;
            result = data;
        }
        console.log(`🗑️ Limpeza: ${result} registros removidos`);
        return result;
    } catch (error) { console.error('Erro na limpeza:', error); return 0; }
}