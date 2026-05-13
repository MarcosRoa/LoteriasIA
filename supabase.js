// ============================================
// SUPABASE - Operações de banco de dados (COM FUNÇÕES PRO)
// ============================================

import { mostrarToast } from './utils.js';
import { isAdminUser } from './auth.js';

// ============================================
// FUNÇÕES EXISTENTES (mantidas)
// ============================================

export async function salvarTransacaoSupabase(uid, transacao) {
    if (!window.supabaseClient || isAdminUser()) return;
    try {
        await window.supabaseClient.from('transacoes').insert({
            usuario_uid: uid, tipo: transacao.tipo, quantidade: transacao.quantidade,
            saldo_apos: transacao.saldo, data: new Date()
        });
        console.log('✅ Transação salva');
    } catch (error) { console.error('Erro transação:', error); }
}

export async function carregarCreditosSupabase(uid, usuarioAtual) {
    if (!window.supabaseClient || isAdminUser()) return 5;
    try {
        const { data, error } = await window.supabaseClient
            .from('usuarios')
            .select('creditos')
            .eq('uid', uid)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!data) {
            await window.supabaseClient
                .from('usuarios')
                .insert({ uid: uid, nome: usuarioAtual?.nome || '', email: usuarioAtual?.email || '', creditos: 5, created_at: new Date(), updated_at: new Date() });
            console.log('✅ Usuário criado com saldo 5');
            return 5;
        }
        
        return data.creditos || 5;
    } catch (error) { 
        console.log('Erro ao carregar créditos:', error); 
        return 5; 
    }
}

export async function salvarCreditoSupabase(uid, novoSaldo) {
    if (!window.supabaseClient || isAdminUser()) return;
    try {
        const { data: existe, error: buscaError } = await window.supabaseClient
            .from('usuarios')
            .select('uid')
            .eq('uid', uid)
            .maybeSingle();
        
        if (buscaError) throw buscaError;
        
        if (existe) {
            const { error: updateError } = await window.supabaseClient
                .from('usuarios')
                .update({ creditos: novoSaldo, updated_at: new Date() })
                .eq('uid', uid);
            if (updateError) throw updateError;
            console.log('✅ Créditos ATUALIZADOS:', novoSaldo);
        } else {
            const { error: insertError } = await window.supabaseClient
                .from('usuarios')
                .insert({ uid: uid, creditos: novoSaldo, created_at: new Date(), updated_at: new Date() });
            if (insertError) throw insertError;
            console.log('✅ Usuário CRIADO com créditos:', novoSaldo);
        }
    } catch (error) { 
        console.error('❌ Erro ao salvar créditos:', error); 
        mostrarToast('Erro ao salvar no banco. Tente novamente.', 'error');
    }
}

export async function salvarHistoricoSupabase(uid, loteria, jogos, filtros, extras, meses = null) {
    if (!window.supabaseClient || isAdminUser()) return;
    try {
        const insertData = { 
            usuario_uid: uid, 
            loteria: loteria, 
            jogos: jogos, 
            filtros: filtros, 
            extras: extras, 
            data: new Date()
        };
        
        if (meses && Array.isArray(meses) && meses.length > 0) {
            insertData.meses = meses;
        }
        
        const { data, error } = await window.supabaseClient
            .from('historico_palpites')
            .insert(insertData);
        if (error) throw error;
        console.log('✅ Histórico salvo!', data);
    } catch (error) { 
        console.error('❌ Erro ao salvar histórico:', error); 
    }
}

export async function carregarHistoricoSupabase(uid) {
    if (!window.supabaseClient || isAdminUser()) return [];
    try {
        const { data, error } = await window.supabaseClient
            .from('historico_palpites')
            .select('*')
            .eq('usuario_uid', uid)
            .order('data', { ascending: false })
            .limit(50);
        if (error) throw error;
        return data || [];
    } catch (error) { 
        console.error('Erro ao carregar histórico:', error); 
        return []; 
    }
}

// ============================================
// 🆕 FUNÇÕES DO SISTEMA PRO
// ============================================

// Verificar se usuário é PRO (e se ainda está válido)
export async function isUserPro(uid) {
    if (!window.supabaseClient) return false;
    try {
        // Usar a função SQL que criamos no banco
        const { data, error } = await window.supabaseClient
            .rpc('is_user_pro', { user_uid: uid });
        
        if (error) throw error;
        return data || false;
    } catch (error) {
        console.error('Erro ao verificar PRO:', error);
        return false;
    }
}

// Obter status completo do PRO (dias restantes, expiração)
export async function getProStatus(uid) {
    if (!window.supabaseClient) return { is_pro: false, expira_em: null, dias_restantes: 0 };
    try {
        const { data, error } = await window.supabaseClient
            .rpc('get_pro_status', { user_uid: uid });
        
        if (error) throw error;
        if (data && data.length > 0) {
            return data[0];
        }
        return { is_pro: false, expira_em: null, dias_restantes: 0, ativado_em: null };
    } catch (error) {
        console.error('Erro ao buscar status PRO:', error);
        return { is_pro: false, expira_em: null, dias_restantes: 0 };
    }
}

// Ativar PRO para um usuário
export async function ativarPro(uid, valorPagamento = 19.90, diasValidade = 15) {
    if (!window.supabaseClient) return false;
    try {
        const { data, error } = await window.supabaseClient
            .rpc('ativar_pro', { 
                user_uid: uid, 
                valor_pagamento: valorPagamento, 
                dias_validade: diasValidade 
            });
        
        if (error) throw error;
        console.log(`✅ PRO ativado para ${uid}`);
        return true;
    } catch (error) {
        console.error('Erro ao ativar PRO:', error);
        return false;
    }
}

// Obter dias restantes do PRO
export async function getDiasProRestantes(uid) {
    if (!window.supabaseClient) return 0;
    try {
        const { data, error } = await window.supabaseClient
            .rpc('dias_pro_restantes', { user_uid: uid });
        
        if (error) throw error;
        return data || 0;
    } catch (error) {
        console.error('Erro ao buscar dias restantes:', error);
        return 0;
    }
}

// Limpar dados antigos (chamado no login)
export async function limparDadosAntigos(uid = null) {
    if (!window.supabaseClient) return 0;
    try {
        let result;
        if (uid) {
            const { data, error } = await window.supabaseClient
                .rpc('limpar_historico_usuario', { user_uid: uid });
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await window.supabaseClient
                .rpc('limpar_historico_antigo');
            if (error) throw error;
            result = data;
        }
        console.log(`🗑️ Limpeza concluída: ${result} registros removidos`);
        return result;
    } catch (error) {
        console.error('Erro ao limpar dados antigos:', error);
        return 0;
    }
}