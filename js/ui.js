// ============================================
// UI.js - Renderização da interface (COMPLETO)
// ============================================

import { LOTERIAS, REGRAS_OFICIAIS, cacheDados, cacheDatas, setDadosAtuais, setIaTreinada, setAiModel, setIsTraining, setFiltrosTreinamento } from './loterias.js';
import { mostrarToast, getModoTexto } from './utils.js';
import { salvarCreditoSupabase, salvarTransacaoSupabase, salvarHistoricoSupabase } from './supabase.js';
import { salvarConfiguracoesUsuario } from './main.js';
import { AdvancedLotteryAI } from './ia.js';

// ============================================
// FUNÇÕES DE ANIMAÇÃO E UTILITÁRIOS
// ============================================

export function atualizarAnimacaoTreinamento(status) {
    const container = document.getElementById('iaTrainingAnimation');
    if (!container) return;
    if (status === 'training') {
        container.className = 'ia-training-animation';
        container.innerHTML = `<div class="ia-training-text">🧠 INTELIGÊNCIA ARTIFICIAL EM TREINAMENTO...</div><div class="ia-training-subtext">Analisando padrões e processando dados históricos</div>`;
        container.style.display = 'block';
    } else if (status === 'trained') {
        container.className = 'ia-training-animation treinado';
        container.innerHTML = `<div class="ia-training-text treinado">✅ INTELIGÊNCIA ARTIFICIAL TREINADA!</div><div class="ia-training-subtext">Pronto para gerar palpites com alta precisão</div>`;
        container.style.display = 'block';
    } else { 
        container.style.display = 'none'; 
    }
}

export function carregarGridLoterias() {
    const grid = document.getElementById('lotteryGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(LOTERIAS).map(([id, c]) => `<div class="lottery-card ${id==='megasena'?'active':''}" onclick="window.selecionarLoteria('${id}')" id="card-${id}"><div class="ia-status nao-treinado" id="status-${id}"></div><h3>${c.icone} ${c.nome}</h3><p class="rules">${c.numeros} números • 1 a ${c.maxNumero}${c.temMes ? ' + Mês' : ''}${c.temTime ? ' + Time' : ''}${c.temTrevos ? ' + Trevos' : ''}</p></div>`).join('');
}

export function atualizarInterfaceUsuario() {
    const loginArea = document.getElementById('loginArea');
    const userInfoArea = document.getElementById('userInfoArea');
    
    if (!loginArea || !userInfoArea) return;
    
    if (window.usuarioAtual) {
        loginArea.style.display = 'none';
        userInfoArea.style.display = 'flex';
        userInfoArea.style.justifyContent = 'center';
        userInfoArea.style.alignItems = 'center';
        userInfoArea.style.gap = '12px';
        userInfoArea.style.flexWrap = 'wrap';
        
        const avatarHtml = window.usuarioAtual.foto 
            ? `<img src="${window.usuarioAtual.foto}" class="user-avatar" alt="Avatar" style="object-fit: cover;">`
            : `<div class="user-avatar" style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); display: flex; align-items: center; justify-content: center;">👤</div>`;
        
        const proBadge = window.usuarioIsPro ? `<span class="pro-badge" title="Plano PRO ativo">⭐ PRO</span>` : '';
        const proExpiresMsg = window.usuarioIsPro && window.usuarioAtual?.proExpiresAt ? `<p class="pro-expires">✨ Válido até ${new Date(window.usuarioAtual.proExpiresAt).toLocaleDateString()}</p>` : '';
        
        userInfoArea.innerHTML = `
            <div class="user-info">
                ${avatarHtml}
                <div class="user-details"><h4>${window.usuarioAtual.nome} ${proBadge}</h4>${proExpiresMsg}<p>${window.usuarioAtual.email}</p></div>
            </div>
            <div class="credits-box" onclick="window.abrirPerfil()"><span>💰 MEUS CRÉDITOS</span><strong id="creditosDisplay">R$ ${window.creditosUsuario}</strong></div>
            <button class="btn-comprar" onclick="window.abrirModalComprar()">➕ Comprar Créditos</button>
            ${!window.usuarioIsPro ? `<button class="btn-pro" onclick="window.comprarPro()">⭐ ATIVAR PRO</button>` : ''}
            <button class="btn-perfil" onclick="window.abrirPerfil()">👤 Meu Perfil</button>
            <button class="btn-tema" onclick="window.toggleTema()">🌓 Tema</button>
            <span class="status-online">🟢 Online</span>
            <button class="btn-logout" onclick="window.logout()">🚪 Sair</button>
        `;
    } else {
        loginArea.style.display = 'block';
        userInfoArea.style.display = 'none';
        userInfoArea.innerHTML = '';
    }
}

export function atualizarQuantidadePorRange(valor) { 
    const qtdJogos = document.getElementById('qtdJogos');
    const qtdRange = document.getElementById('qtdRange');
    if (qtdJogos) qtdJogos.value = valor;
    if (qtdRange) qtdRange.value = valor;
}

export function atualizarQuantidadePorInput(valor) { 
    const qtdRange = document.getElementById('qtdRange');
    if (qtdRange) qtdRange.value = valor;
}

export function setPeriodo(p) { 
    window.periodoSelecionado = p; 
    window.iaTreinada = false; 
    window.aiModel = null; 
    renderizarConteudo(window.loteriaAtual); 
    if (window.dadosAtuais && window.dadosAtuais.length >= 10) setTimeout(() => treinarIAComFiltrosAtuais(), 500); 
}

export function atualizarDispersao(v) { 
    window.dispersaoAtual = parseInt(v); 
    const dispersaoValor = document.getElementById('dispersaoValor');
    if (dispersaoValor) dispersaoValor.textContent = `${v} concursos`; 
    window.iaTreinada = false; 
    window.aiModel = null; 
}

// ============================================
// FUNÇÕES DE FILTRO E DATA
// ============================================

function getDataCortePorAnos(anos) {
    const dataAtual = new Date();
    return new Date(dataAtual.getFullYear() - anos, dataAtual.getMonth(), dataAtual.getDate());
}

function filtrarDadosPorData(anos) {
    if (!cacheDatas[window.loteriaAtual]?.datas?.length) return window.dadosAtuais;
    const dataCorte = getDataCortePorAnos(anos);
    const dadosFiltrados = [];
    for (let i = 0; i < window.dadosAtuais.length; i++) {
        const dataConcursoStr = cacheDatas[window.loteriaAtual].datas[i];
        if (dataConcursoStr) {
            const partes = dataConcursoStr.split('/');
            if (partes.length === 3) {
                const dataConcurso = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
                if (dataConcurso >= dataCorte) dadosFiltrados.push(window.dadosAtuais[i]);
            } else { dadosFiltrados.push(window.dadosAtuais[i]); }
        } else { dadosFiltrados.push(window.dadosAtuais[i]); }
    }
    return dadosFiltrados;
}

function filtrarDados() {
    if (window.periodoSelecionado === 'all') return [...window.dadosAtuais];
    return filtrarDadosPorData(window.periodoSelecionado);
}

function getPeriodoTexto() {
    if (window.periodoSelecionado === 'all') {
        return `Todos os concursos (${window.dadosAtuais?.length || 0} concursos)`;
    }
    const dadosFiltrados = filtrarDados();
    return `${window.periodoSelecionado} ano(s) (${dadosFiltrados.length} concursos)`;
}

function getDatasPeriodo() {
    const dadosFiltrados = filtrarDados();
    const datasFiltradas = cacheDatas[window.loteriaAtual]?.datas || [];
    if (datasFiltradas.length === 0 || dadosFiltrados.length === 0) return { inicio: 'N/A', fim: 'N/A' };
    if (window.periodoSelecionado === 'all') {
        return { inicio: datasFiltradas[0] || 'N/A', fim: datasFiltradas[datasFiltradas.length-1] || 'N/A' };
    }
    const indicesFiltrados = [];
    const dataCorte = getDataCortePorAnos(window.periodoSelecionado);
    for (let i = 0; i < datasFiltradas.length; i++) {
        const dataConcursoStr = datasFiltradas[i];
        if (dataConcursoStr) {
            const partes = dataConcursoStr.split('/');
            if (partes.length === 3) {
                const dataConcurso = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
                if (dataConcurso >= dataCorte) indicesFiltrados.push(i);
            }
        }
    }
    if (indicesFiltrados.length === 0) return { inicio: 'N/A', fim: 'N/A' };
    return {
        inicio: datasFiltradas[indicesFiltrados[0]] || 'N/A',
        fim: datasFiltradas[indicesFiltrados[indicesFiltrados.length-1]] || 'N/A'
    };
}

// ============================================
// CARREGAR E PROCESSAR CSV
// ============================================

async function carregarCSV(loteria) {
    try {
        const response = await fetch(`csv/${loteria}.csv`);
        if (response.ok) {
            const texto = await response.text();
            processarCSV(loteria, texto, `csv/${loteria}.csv`);
            return true;
        }
        console.log(`Arquivo csv/${loteria}.csv não encontrado`);
        return false;
    } catch(e) {
        console.log(`Erro ao carregar csv/${loteria}.csv`);
        return false;
    }
}

function processarCSV(loteria, texto, nome) {
    const config = LOTERIAS[loteria];
    if (!config) return;
    
    const linhas = texto.split('\n').filter(l => l.trim());
    if (linhas.length < 2) return;
    
    const sep = linhas[0].includes(';') ? ';' : ',';
    const dados = [];
    const datas = [];
    
    for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(sep);
        let data = null;
        
        // Procurar data na linha
        for (let j = 0; j < cols.length; j++) {
            const v = cols[j].trim();
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) { 
                data = v; 
                break; 
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { 
                const [a,m,d] = v.split('-'); 
                data = `${d}/${m}/${a}`; 
                break; 
            }
        }
        datas.push(data);
        
        // Extrair números
        const numeros = cols.map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (numeros.length >= config.numeros) {
            dados.push(numeros.slice(0, config.numeros).sort((a,b) => a - b));
        }
    }
    
    if (dados.length > 0) {
        cacheDados[loteria] = { dados: [...dados], carregado: true, nomeArquivo: nome };
        cacheDatas[loteria] = { datas: [...datas] };
        
        if (window.loteriaAtual === loteria) { 
            window.dadosAtuais = [...dados]; 
            renderizarConteudo(loteria); 
            if (dados.length >= 10) setTimeout(() => treinarIAComFiltrosAtuais(), 500); 
        }
        mostrarToast(`${config.nome}: ${dados.length} concursos carregados!`, 'success');
    }
}

// ============================================
// RENDERIZAR CONTEÚDO DA LOTERIA
// ============================================

export function renderizarConteudo(loteria) {
    const config = LOTERIAS[loteria];
    if (!config) return;
    
    const div = document.getElementById('conteudoLoteria');
    if (!div) return;
    
    const cache = cacheDados[loteria];
    const dadosCount = window.dadosAtuais?.length || 0;
    const dadosFiltradosCount = filtrarDados().length;
    const datasPeriodo = getDatasPeriodo();
    
    let controlesExtras = '';
    if (config.temDispersao) {
        controlesExtras = `<div class="dispersao-slider">
            <label class="config-label">🎯 Dispersão</label>
            <input type="range" id="dispersaoSlider" min="${config.dispersaoMin || 5}" max="${config.dispersaoMax || 25}" value="${window.dispersaoAtual || config.dispersaoPadrao}" oninput="window.atualizarDispersao(this.value)">
            <div class="dispersao-valor">Bloquear números recentes: <strong id="dispersaoValor">${window.dispersaoAtual || config.dispersaoPadrao} concursos</strong></div>
        </div>`;
    }
    
    let html = `<div class="card"><h3 style="color:${config.cor};">${config.icone} ${config.nome} - IA V.6.1</h3>`;
    
    if (!cache?.carregado) {
        html += `<div class="mensagem-erro"><strong>⚠️ Nenhum dado!</strong><br>📁 Upload do CSV (pasta /csv/)</div>`;
    }
    
    html += `<div style="display:flex;gap:15px;flex-wrap:wrap;margin:15px 0;">
        <h4>📁 ${dadosCount} concursos</h4>
        <span id="trainingStatus" class="status-badge ${window.iaTreinada ? 'status-ready' : 'status-error'}">${window.iaTreinada ? '✓ Treinada' : 'Pendente'}</span>
        <button class="btn btn-upload" onclick="document.getElementById('uploadManual').click()">📁 Upload CSV</button>
        <input type="file" id="uploadManual" accept=".csv" onchange="window.importarArquivo(this,'${loteria}')" style="display:none;">
    </div>`;
    
    html += `<div class="stats-grid"><div class="stat-card">Concursos: ${dadosCount}</div><div class="stat-card">Período: ${dadosFiltradosCount}</div><div class="stat-card">Engine: 🧠 V.6.1</div></div></div>`;
    
    html += `<div class="card"><h4>📅 Período (Baseado em data real)</h4>
        <div class="filtros">
            <button class="filtro-btn ${window.periodoSelecionado === 'all' ? 'ativo' : ''}" onclick="window.setPeriodo('all')">Todos</button>
            <button class="filtro-btn ${window.periodoSelecionado === 1 ? 'ativo' : ''}" onclick="window.setPeriodo(1)">1 Ano</button>
            <button class="filtro-btn ${window.periodoSelecionado === 3 ? 'ativo' : ''}" onclick="window.setPeriodo(3)">3 Anos</button>
            <button class="filtro-btn ${window.periodoSelecionado === 5 ? 'ativo' : ''}" onclick="window.setPeriodo(5)">5 Anos</button>
            <button class="filtro-btn ${window.periodoSelecionado === 7 ? 'ativo' : ''}" onclick="window.setPeriodo(7)">7 Anos</button>
            <button class="filtro-btn ${window.periodoSelecionado === 9 ? 'ativo' : ''}" onclick="window.setPeriodo(9)">9 Anos</button>
        </div>
        <p>📊 ${getPeriodoTexto()}</p>
        <div class="info-periodo">
            <div class="info-periodo-item"><div class="info-periodo-label">📅 DATA INÍCIO</div><div class="info-periodo-valor">${datasPeriodo.inicio}</div></div>
            <div class="info-periodo-item"><div class="info-periodo-label">📅 DATA FIM</div><div class="info-periodo-valor">${datasPeriodo.fim}</div></div>
        </div>
    </div>`;
    
    const animacaoStatus = window.iaTreinada ? 'trained' : (window.isTraining ? 'training' : 'none');
    let animacaoHtml = '';
    if (animacaoStatus === 'training') {
        animacaoHtml = `<div id="iaTrainingAnimation" class="ia-training-animation">
            <div class="ia-training-text">🧠 INTELIGÊNCIA ARTIFICIAL EM TREINAMENTO...</div>
            <div class="ia-training-subtext">Analisando padrões e processando dados históricos</div>
        </div>`;
    } else if (animacaoStatus === 'trained') {
        animacaoHtml = `<div id="iaTrainingAnimation" class="ia-training-animation treinado">
            <div class="ia-training-text treinado">✅ INTELIGÊNCIA ARTIFICIAL TREINADA!</div>
            <div class="ia-training-subtext">Pronto para gerar palpites com alta precisão</div>
        </div>`;
    } else {
        animacaoHtml = `<div id="iaTrainingAnimation" style="display: none;"></div>`;
    }
    
    html += `<div class="training-section"><h4>🧠 Treinamento da IA</h4>
        <div style="display:flex;gap:15px;flex-wrap:wrap;">
            <span id="trainingStatus2" class="status-badge ${window.iaTreinada ? 'status-ready' : 'status-error'}">${window.iaTreinada ? 'Treinado ✓' : 'Não Treinado'}</span>
            <button class="btn btn-treinar" onclick="window.treinarIAComFiltrosAtuais()">🚀 Treinar IA</button>
            <button class="btn btn-backtest" onclick="window.executarBacktesting()">🔬 Backtest</button>
            <button class="btn btn-relatorio" onclick="window.mostrarRelatorioPadroes()">📋 Relatório</button>
        </div>
        <div class="training-progress"><div class="training-progress-bar" id="trainingProgressBar" style="width:${window.iaTreinada ? '100%' : '0%'};"></div></div>
        <div class="training-log" id="trainingLog">${window.iaTreinada ? '✅ IA pronta!' : '⏳ Clique em Treinar'}</div>
        ${animacaoHtml}
    </div>`;
    
    html += `<div class="card"><h4>🎲 Configurar e Gerar Jogos</h4>
        <div class="config-grid">
            <div class="quantidade-container">
                <label class="config-label">📊 Quantidade de Jogos</label>
                <input type="range" id="qtdRange" class="quantidade-range" min="1" max="20" value="1" oninput="window.atualizarQuantidadePorRange(this.value)">
                <input type="number" id="qtdJogos" class="quantidade-input" value="1" min="1" max="20" oninput="window.atualizarQuantidadePorInput(this.value)">
            </div>
            <div>
                <label class="config-label">🎓 Modo de IA</label>
                <select id="modoGeracao" class="modo-select">
                    <option value="ia_especialista">🎓 IA Especialista</option>
                    <option value="aleatorio_inteligente">🎲 Aleatório Inteligente</option>
                    <option value="probabilistico">📊 Probabilístico</option>
                    <option value="aleatorio_puro">🎯 Aleatório Puro (RNG)</option>
                </select>
            </div>
            ${controlesExtras}
        </div>
        <button class="btn btn-primary" onclick="window.gerarJogos()" style="background:${config.cor};">${config.icone} GERAR JOGOS (R$ 3,00/jogo)</button>
        <div id="resultados" style="margin-top:20px;"></div>
    </div>`;
    
    html += `<div class="regras-oficiais"><h4>📜 Regras</h4><p>${REGRAS_OFICIAIS[loteria]}</p></div>`;
    div.innerHTML = html;
}

// ============================================
// SELECIONAR LOTERIA
// ============================================

export async function selecionarLoteria(loteria) {
    window.loteriaAtual = loteria;
    window.iaTreinada = false;
    window.aiModel = null;
    
    const config = LOTERIAS[loteria];
    if (config.temDispersao) window.dispersaoAtual = config.dispersaoPadrao;
    
    document.querySelectorAll('.lottery-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`card-${loteria}`)?.classList.add('active');
    
    if (cacheDados[loteria]?.carregado) {
        window.dadosAtuais = [...cacheDados[loteria].dados];
    } else {
        window.dadosAtuais = [];
        await carregarCSV(loteria);
    }
    
    renderizarConteudo(loteria);
    
    if (window.dadosAtuais && window.dadosAtuais.length >= 10 && !window.iaTreinada && !window.isTraining) {
        setTimeout(() => treinarIAComFiltrosAtuais(), 500);
    }
}

// ============================================
// TREINAR IA
// ============================================

export async function treinarIAComFiltrosAtuais() {
    if (!window.dadosAtuais || window.dadosAtuais.length === 0) {
        mostrarToast('❌ Nenhum dado para treinar! Faça upload do CSV.', 'error');
        return;
    }
    
    if (window.isTraining) {
        mostrarToast('⏳ Treinamento já em andamento...', 'info');
        return;
    }
    
    window.isTraining = true;
    setIsTraining(true);
    atualizarAnimacaoTreinamento('training');
    
    const trainingLog = document.getElementById('trainingLog');
    if (trainingLog) trainingLog.innerHTML = '🧠 Iniciando treinamento da IA...';
    
    const trainingProgressBar = document.getElementById('trainingProgressBar');
    if (trainingProgressBar) trainingProgressBar.style.width = '30%';
    
    await new Promise(r => setTimeout(r, 500));
    
    if (trainingLog) trainingLog.innerHTML += '\n📊 Analisando frequência dos números...';
    if (trainingProgressBar) trainingProgressBar.style.width = '60%';
    
    await new Promise(r => setTimeout(r, 500));
    
    const config = LOTERIAS[window.loteriaAtual];
    const dadosFiltrados = filtrarDados();
    
    const ia = new AdvancedLotteryAI(dadosFiltrados, config.maxNumero, config.nome);
    const treinou = ia.treinar();
    
    if (treinou) {
        window.aiModel = ia;
        window.iaTreinada = true;
        setAiModel(ia);
        setIaTreinada(true);
        
        if (trainingLog) trainingLog.innerHTML += `\n✅ Treinamento concluído!\n📈 Confiança: ${ia.confianca}%\n📊 Base: ${dadosFiltrados.length} concursos`;
        if (trainingProgressBar) trainingProgressBar.style.width = '100%';
        
        atualizarAnimacaoTreinamento('trained');
        
        const filtros = [
            { label: 'Período', valor: window.periodoSelecionado === 'all' ? 'Todos' : `${window.periodoSelecionado} anos` },
            { label: 'Quantidade', valor: document.getElementById('qtdJogos')?.value || '1' },
            { label: 'Modo', valor: getModoTexto(document.getElementById('modoGeracao')?.value) }
        ];
        if (config.temDispersao) filtros.push({ label: 'Dispersão', valor: `${window.dispersaoAtual} concursos` });
        setFiltrosTreinamento(filtros);
        
        mostrarToast(`✅ IA treinada com ${dadosFiltrados.length} concursos!`, 'success');
    } else {
        if (trainingLog) trainingLog.innerHTML = '❌ Dados insuficientes para treinar (mínimo 10 concursos)';
        mostrarToast('❌ Dados insuficientes para treinar (mínimo 10 concursos)', 'error');
    }
    
    window.isTraining = false;
    setIsTraining(false);
    
    const trainingStatus = document.getElementById('trainingStatus');
    const trainingStatus2 = document.getElementById('trainingStatus2');
    if (trainingStatus) {
        trainingStatus.className = `status-badge ${window.iaTreinada ? 'status-ready' : 'status-error'}`;
        trainingStatus.textContent = window.iaTreinada ? '✓ Treinada' : 'Pendente';
    }
    if (trainingStatus2) {
        trainingStatus2.className = `status-badge ${window.iaTreinada ? 'status-ready' : 'status-error'}`;
        trainingStatus2.textContent = window.iaTreinada ? 'Treinado ✓' : 'Não Treinado';
    }
}

// ============================================
// GERAR JOGOS
// ============================================

export async function gerarJogos() {
    if (!window.usuarioAtual) {
        const { mostrarModalLogin } = await import('./utils.js');
        mostrarModalLogin();
        return;
    }
    
    if (window.creditosUsuario < 3) {
        mostrarToast(`❌ Saldo insuficiente! Você tem R$ ${window.creditosUsuario}. Cada jogo custa R$ 3,00.`, 'error');
        window.abrirModalComprar();
        return;
    }
    
    if (!window.iaTreinada || !window.aiModel) {
        mostrarToast('⚠️ Treine a IA primeiro!', 'warning');
        return;
    }
    
    const qtdJogos = parseInt(document.getElementById('qtdJogos')?.value || '1');
    const modoGeracao = document.getElementById('modoGeracao')?.value || 'ia_especialista';
    const config = LOTERIAS[window.loteriaAtual];
    
    const custoTotal = qtdJogos * 3;
    if (window.creditosUsuario < custoTotal) {
        mostrarToast(`❌ Saldo insuficiente! Necessário R$ ${custoTotal}, você tem R$ ${window.creditosUsuario}.`, 'error');
        return;
    }
    
    // Gerar jogos
    const jogosGerados = [];
    for (let i = 0; i < qtdJogos; i++) {
        let jogo;
        const seed = Date.now() + i;
        
        if (modoGeracao === 'ia_especialista') {
            jogo = window.aiModel.predizerIAEspecialista(config.numeros, config.temDispersao, window.dispersaoAtual, seed);
        } else if (modoGeracao === 'aleatorio_inteligente') {
            const scores = window.aiModel.calcularScoreCompleto();
            const numerosOrdenados = scores.sort((a,b) => b.score - a.score).map(s => s.numero);
            jogo = [];
            const disponiveis = [...numerosOrdenados];
            while (jogo.length < config.numeros && disponiveis.length > 0) {
                const idx = Math.floor(Math.random() * disponiveis.length);
                jogo.push(disponiveis[idx]);
                disponiveis.splice(idx, 1);
            }
            jogo.sort((a,b) => a - b);
        } else if (modoGeracao === 'probabilistico') {
            const freq = window.aiModel.calcularFrequenciaPonderada();
            const numeros = Array.from({ length: config.maxNumero + 1 }, (_, i) => i);
            const pesos = numeros.map(n => freq[n]?.probabilidade || 1);
            const somaPesos = pesos.reduce((a,b) => a + b, 0);
            jogo = [];
            const selecionados = new Set();
            while (jogo.length < config.numeros) {
                let random = Math.random() * somaPesos;
                let acumulado = 0;
                for (let n = 0; n < numeros.length; n++) {
                    acumulado += pesos[n];
                    if (random <= acumulado && !selecionados.has(numeros[n]) && numeros[n] !== 0) {
                        jogo.push(numeros[n]);
                        selecionados.add(numeros[n]);
                        break;
                    }
                }
            }
            jogo.sort((a,b) => a - b);
        } else {
            jogo = window.aiModel.predizerAleatorio(config.numeros);
        }
        
        jogosGerados.push(jogo);
    }
    
    // Debitar créditos
    const novoSaldo = window.creditosUsuario - custoTotal;
    window.creditosUsuario = novoSaldo;
    await salvarCreditoSupabase(window.usuarioAtual.uid, novoSaldo);
    await salvarTransacaoSupabase(window.usuarioAtual.uid, { tipo: 'uso', quantidade: custoTotal, saldo: novoSaldo, data: new Date() });
    
    // Atualizar display
    const creditsDisplay = document.getElementById('creditosDisplay');
    if (creditsDisplay) creditsDisplay.textContent = `R$ ${novoSaldo}`;
    
    // Salvar histórico
    const filtrosTexto = `Período: ${window.periodoSelecionado === 'all' ? 'Todos' : `${window.periodoSelecionado} anos`}, Modo: ${getModoTexto(modoGeracao)}${config.temDispersao ? `, Dispersão: ${window.dispersaoAtual}` : ''}`;
    await salvarHistoricoSupabase(window.usuarioAtual.uid, config.nome, jogosGerados, filtrosTexto, {});
    
    // Exibir resultados
    const resultadosDiv = document.getElementById('resultados');
    if (resultadosDiv) {
        resultadosDiv.innerHTML = `<h4>🎲 ${jogosGerados.length} JOGOS GERADOS</h4>`;
        
        for (let i = 0; i < jogosGerados.length; i++) {
            const jogo = jogosGerados[i];
            const confianca = window.aiModel.calcularConfiancaJogo(jogo);
            let confiancaClass = 'confianca-baixa';
            if (confianca >= 70) confiancaClass = 'confianca-alta';
            else if (confianca >= 40) confiancaClass = 'confianca-media';
            
            resultadosDiv.innerHTML += `
                <div class="resultado-jogo">
                    <div><strong>Jogo ${i+1}</strong> - Confiança: ${confianca}%</div>
                    <div class="bolas">${jogo.map(n => `<div class="bola" style="background: ${config.cor}; color: white;">${n}</div>`).join('')}</div>
                    <div class="confianca-bar ${confiancaClass}" style="width: ${confianca}%;"></div>
                </div>
            `;
        }
    }
    
    mostrarToast(`✅ ${jogosGerados.length} jogos gerados! Saldo: R$ ${novoSaldo}`, 'success');
    salvarConfiguracoesUsuario();
}

// ============================================
// BACKTESTING E RELATÓRIO
// ============================================

export async function executarBacktesting() {
    if (!window.iaTreinada || !window.aiModel) {
        mostrarToast('⚠️ Treine a IA primeiro!', 'warning');
        return;
    }
    
    mostrarToast('🔬 Executando backtesting...', 'info');
    const dados = window.dadosAtuais;
    const config = LOTERIAS[window.loteriaAtual];
    let acertos = 0;
    const resultados = [];
    
    for (let i = 0; i < Math.min(20, dados.length - 1); i++) {
        const treino = dados.slice(0, dados.length - 1 - i);
        const teste = dados[dados.length - 1 - i];
        
        const iaTeste = new AdvancedLotteryAI(treino, config.maxNumero, config.nome);
        iaTeste.treinar();
        const predicao = iaTeste.predizerIAEspecialista(config.numeros, false, 0, i);
        
        const acertosJogo = predicao.filter(n => teste.includes(n)).length;
        if (acertosJogo >= 4) acertos++;
        resultados.push({ concurso: dados.length - i, acertos: acertosJogo, numerosSorteados: teste, numerosPreditos: predicao });
    }
    
    const resultadosDiv = document.getElementById('resultados');
    if (resultadosDiv) {
        resultadosDiv.innerHTML = `
            <h4>🔬 RESULTADO DO BACKTESTING</h4>
            <p>✅ Taxa de acerto (4+ números): ${acertos}/${resultados.length} (${Math.round(acertos/resultados.length*100)}%)</p>
            <div style="max-height: 300px; overflow-y: auto;">
                ${resultados.map(r => `<div class="resultado-jogo"><strong>Concurso ${r.concurso}</strong> | Acertos: ${r.acertos}<br>Sorteado: ${r.numerosSorteados.join(', ')}<br>Previsto: ${r.numerosPreditos.join(', ')}</div>`).join('')}
            </div>
        `;
    }
}

export function mostrarRelatorioPadroes() {
    if (!window.iaTreinada || !window.aiModel) {
        mostrarToast('⚠️ Treine a IA primeiro!', 'warning');
        return;
    }
    
    const relatorio = window.aiModel.gerarRelatorio();
    const resultadosDiv = document.getElementById('resultados');
    if (resultadosDiv) {
        resultadosDiv.innerHTML = `
            <h4>📋 RELATÓRIO DA IA</h4>
            <p><strong>Loteria:</strong> ${relatorio.loteria}</p>
            <p><strong>Confiança Geral:</strong> ${relatorio.confiancaGeral}%</p>
            <p><strong>Total de Concursos:</strong> ${relatorio.totalDados}</p>
            <p><strong>Top 10 Números com maior pontuação:</strong></p>
            <div class="bolas">${relatorio.melhoresNumerosAtuais.map(n => `<div class="bola" style="background: #8b5cf6;">${n.numero}</div>`).join('')}</div>
        `;
    }
}

// ============================================
// IMPORTAR ARQUIVO
// ============================================

window.importarArquivo = (input, loteria) => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => processarCSV(loteria, e.target.result, file.name);
    reader.readAsText(file);
    input.value = '';
};