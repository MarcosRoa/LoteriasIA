import { LOTERIAS, REGRAS_OFICIAIS, cacheDados, cacheDatas } from './loterias.js';
import { mostrarToast, getModoTexto } from './utils.js';
import { abrirModalComprar, iniciarPagamentoPix } from './pagamentos.js';
import { auth, logout, atualizarStatusPro } from './auth.js';
import { carregarHistoricoSupabase, salvarCreditoSupabase, salvarTransacaoSupabase, salvarHistoricoSupabase } from './supabase.js';

window.comprarPro = () => import('./pagamentos.js').then(m => m.comprarPro());

export function carregarGridLoterias() {
    const grid = document.getElementById('lotteryGrid');
    grid.innerHTML = Object.entries(LOTERIAS).map(([id, c]) => `<div class="lottery-card ${id==='megasena'?'active':''}" onclick="window.selecionarLoteria('${id}')" id="card-${id}"><div class="ia-status nao-treinado" id="status-${id}"></div><h3>${c.icone} ${c.nome}</h3><p class="rules">${c.numeros} números • 1 a ${c.maxNumero}${c.temMes ? ' + Mês' : ''}${c.temTime ? ' + Time' : ''}${c.temTrevos ? ' + Trevos' : ''}</p></div>`).join('');
}

export function atualizarInterfaceUsuario() {
    const loginArea = document.getElementById('loginArea');
    const userInfoArea = document.getElementById('userInfoArea');
    
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
    } else { container.style.display = 'none'; }
}

export function atualizarQuantidadePorRange(valor) { document.getElementById('qtdJogos').value = valor; document.getElementById('qtdRange').value = valor; }
export function atualizarQuantidadePorInput(valor) { document.getElementById('qtdRange').value = valor; }

async function carregarCSV(loteria) {
    try {
        const response = await fetch(`csv/${loteria}.csv`);
        if (response.ok) { processarCSV(loteria, await response.text(), `csv/${loteria}.csv`); return true; }
        return false;
    } catch(e) { return false; }
}

function processarCSV(loteria, texto, nome) {
    const config = LOTERIAS[loteria];
    const linhas = texto.split('\n').filter(l => l.trim());
    if (linhas.length < 2) return;
    const sep = linhas[0].includes(';') ? ';' : ',';
    const dados = [], datas = [];
    for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(sep);
        let data = null;
        for (let j = 0; j < cols.length; j++) {
            const v = cols[j].trim();
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) { data = v; break; }
            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [a,m,d] = v.split('-'); data = `${d}/${m}/${a}`; break; }
        }
        datas.push(data);
        const numeros = cols.map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (numeros.length >= config.numeros) dados.push(numeros.slice(0, config.numeros).sort((a,b)=>a-b));
    }
    if (dados.length > 0) {
        cacheDados[loteria] = { dados, carregado: true, nomeArquivo: nome };
        cacheDatas[loteria] = { datas };
        if (window.loteriaAtual === loteria) { window.dadosAtuais = [...dados]; renderizarConteudo(loteria); if (dados.length >= 10) setTimeout(() => window.treinarIAComFiltrosAtuais(), 500); }
        mostrarToast(`${config.nome}: ${dados.length} concursos carregados!`, 'success');
    }
}

function importarArquivo(input, loteria) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => processarCSV(loteria, e.target.result, file.name);
    reader.readAsText(file);
    input.value = '';
}

function getDataCortePorAnos(anos) { return new Date(new Date().getFullYear() - anos, new Date().getMonth(), new Date().getDate()); }

function filtrarDadosPorData(anos) {
    if (!cacheDatas[window.loteriaAtual]?.datas?.length) return window.dadosAtuais;
    const dataCorte = getDataCortePorAnos(anos);
    return window.dadosAtuais.filter((_, i) => {
        const dataStr = cacheDatas[window.loteriaAtual].datas[i];
        if (!dataStr) return true;
        const [d, m, a] = dataStr.split('/');
        return new Date(parseInt(a), parseInt(m)-1, parseInt(d)) >= dataCorte;
    });
}

function filtrarDados() {
    if (window.periodoSelecionado === 'all') return [...window.dadosAtuais];
    if (window.periodoSelecionado === 1) return filtrarDadosPorData(1);
    if (window.periodoSelecionado === 3) return filtrarDadosPorData(3);
    if (window.periodoSelecionado === 5) return filtrarDadosPorData(5);
    if (window.periodoSelecionado === 7) return filtrarDadosPorData(7);
    if (window.periodoSelecionado === 9) return filtrarDadosPorData(9);
    return [...window.dadosAtuais];
}

function getPeriodoTexto() {
    if (window.periodoSelecionado === 'all') return `Todos os concursos (${window.dadosAtuais.length} concursos)`;
    return `${window.periodoSelecionado} ano(s) (${filtrarDados().length} concursos)`;
}

function getDatasPeriodo() {
    const dadosFiltrados = filtrarDados();
    const datas = cacheDatas[window.loteriaAtual]?.datas || [];
    if (datas.length === 0 || dadosFiltrados.length === 0) return { inicio: 'N/A', fim: 'N/A' };
    if (window.periodoSelecionado === 'all') return { inicio: datas[0] || 'N/A', fim: datas[datas.length-1] || 'N/A' };
    const dataCorte = getDataCortePorAnos(window.periodoSelecionado);
    const indices = [];
    for (let i = 0; i < datas.length; i++) {
        const d = datas[i];
        if (d) { const [dia, mes, ano] = d.split('/'); if (new Date(parseInt(ano), parseInt(mes)-1, parseInt(dia)) >= dataCorte) indices.push(i); }
    }
    if (indices.length === 0) return { inicio: 'N/A', fim: 'N/A' };
    return { inicio: datas[indices[0]] || 'N/A', fim: datas[indices[indices.length-1]] || 'N/A' };
}

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
    if (window.dadosAtuais.length >= 10 && !window.iaTreinada && !window.isTraining) setTimeout(() => window.treinarIAComFiltrosAtuais(), 500);
}

export function renderizarConteudo(loteria) {
    const config = LOTERIAS[loteria];
    const div = document.getElementById('conteudoLoteria');
    const cache = cacheDados[loteria];
    const dadosCount = window.dadosAtuais.length;
    const dadosFiltradosCount = filtrarDados().length;
    const datasPeriodo = getDatasPeriodo();
    
    let controlesExtras = '';
    if (config.temDispersao) controlesExtras += `<div class="dispersao-slider"><label class="config-label">🎯 Dispersão</label><input type="range" id="dispersaoSlider" min="${config.dispersaoMin}" max="${config.dispersaoMax}" value="${window.dispersaoAtual}" oninput="window.atualizarDispersao(this.value)"><div class="dispersao-valor">Bloquear números recentes: <strong id="dispersaoValor">${window.dispersaoAtual} concursos</strong></div></div>`;
    
    let html = `<div class="card"><h3 style="color:${config.cor};">${config.icone} ${config.nome} - IA V.6.1</h3>`;
    if (!cache?.carregado) html += `<div class="mensagem-erro"><strong>⚠️ Nenhum dado!</strong><br>📁 Upload do CSV (pasta /csv/)</div>`;
    html += `<div style="display:flex;gap:15px;flex-wrap:wrap;margin:15px 0;"><h4>📁 ${dadosCount} concursos</h4><span id="trainingStatus" class="status-badge ${window.iaTreinada?'status-ready':'status-error'}">${window.iaTreinada?'✓ Treinada':'Pendente'}</span><button class="btn btn-upload" onclick="document.getElementById('uploadManual').click()">📁 Upload CSV</button><input type="file" id="uploadManual" accept=".csv" onchange="importarArquivo(this,'${loteria}')" style="display:none;"></div>`;
    html += `<div class="stats-grid"><div class="stat-card">Concursos: ${dadosCount}</div><div class="stat-card">Período: ${dadosFiltradosCount}</div><div class="stat-card">Engine: 🧠 V.6.1</div></div></div>`;
    
    html += `<div class="card"><h4>📅 Período (Baseado em data real)</h4><div class="filtros">
        <button class="filtro-btn ${window.periodoSelecionado === 'all' ? 'ativo' : ''}" onclick="window.setPeriodo('all')">Todos</button>
        <button class="filtro-btn ${window.periodoSelecionado === 1 ? 'ativo' : ''}" onclick="window.setPeriodo(1)">1 Ano</button>
        <button class="filtro-btn ${window.periodoSelecionado === 3 ? 'ativo' : ''}" onclick="window.setPeriodo(3)">3 Anos</button>
        <button class="filtro-btn ${window.periodoSelecionado === 5 ? 'ativo' : ''}" onclick="window.setPeriodo(5)">5 Anos</button>
        <button class="filtro-btn ${window.periodoSelecionado === 7 ? 'ativo' : ''}" onclick="window.setPeriodo(7)">7 Anos</button>
        <button class="filtro-btn ${window.periodoSelecionado === 9 ? 'ativo' : ''}" onclick="window.setPeriodo(9)">9 Anos</button>
    </div>
    <p>📊 ${getPeriodoTexto()}</p>
    <div class="info-periodo"><div class="info-periodo-item"><div class="info-periodo-label">📅 DATA INÍCIO</div><div class="info-periodo-valor">${datasPeriodo.inicio}</div></div><div class="info-periodo-item"><div class="info-periodo-label">📅 DATA FIM</div><div class="info-periodo-valor">${datasPeriodo.fim}</div></div></div>
    </div>`;
    
    const animacaoStatus = window.iaTreinada ? 'trained' : (window.isTraining ? 'training' : 'none');
    let animacaoHtml = '';
    if (animacaoStatus === 'training') animacaoHtml = `<div id="iaTrainingAnimation" class="ia-training-animation"><div class="ia-training-text">🧠 INTELIGÊNCIA ARTIFICIAL EM TREINAMENTO...</div><div class="ia-training-subtext">Analisando padrões e processando dados históricos</div></div>`;
    else if (animacaoStatus === 'trained') animacaoHtml = `<div id="iaTrainingAnimation" class="ia-training-animation treinado"><div class="ia-training-text treinado">✅ INTELIGÊNCIA ARTIFICIAL TREINADA!</div><div class="ia-training-subtext">Pronto para gerar palpites com alta precisão</div></div>`;
    else animacaoHtml = `<div id="iaTrainingAnimation" style="display: none;"></div>`;
    
    html += `<div class="training-section"><h4>🧠 Treinamento da IA</h4><div style="display:flex;gap:15px;flex-wrap:wrap;"><span id="trainingStatus2" class="status-badge ${window.iaTreinada?'status-ready':'status-error'}">${window.iaTreinada?'Treinado ✓':'Não Treinado'}</span><button class="btn btn-treinar" onclick="window.treinarIAComFiltrosAtuais()">🚀 Treinar IA</button><button class="btn btn-backtest" onclick="window.executarBacktesting()">🔬 Backtest</button><button class="btn btn-relatorio" onclick="window.mostrarRelatorioPadroes()">📋 Relatório</button></div><div class="training-progress"><div class="training-progress-bar" id="trainingProgressBar" style="width:${window.iaTreinada?'100%':'0%'};"></div></div><div class="training-log" id="trainingLog" style="min-height:80px; font-size:11px;">${window.iaTreinada?'✅ IA pronta!':'⏳ Clique em Treinar'}</div>${animacaoHtml}<div id="filtrosAplicadosContainer">${window.iaTreinada && window.filtrosTreinamento ? `<div class="filtros-aplicados"><h4>📋 Configuração</h4><div>${window.filtrosTreinamento.map(f => `<span class="filtro-item">${f.label}: <strong>${f.valor}</strong></span>`).join('')}</div></div>` : ''}</div></div>`;
    
    html += `<div class="card"><h4>🎲 Configurar e Gerar Jogos</h4><div class="config-grid">
        <div class="quantidade-container"><label class="config-label">📊 Quantidade de Jogos</label><input type="range" id="qtdRange" class="quantidade-range" min="1" max="20" value="1" oninput="window.atualizarQuantidadePorRange(this.value)"><input type="number" id="qtdJogos" class="quantidade-input" value="1" min="1" max="20" oninput="window.atualizarQuantidadePorInput(this.value)"></div>
        <div><label class="config-label">🎓 Modo de IA</label><select id="modoGeracao" class="modo-select"><option value="ia_especialista">🎓 IA Especialista</option><option value="aleatorio_inteligente">🎲 Aleatório Inteligente</option><option value="probabilistico">📊 Probabilístico</option><option value="aleatorio_puro">🎯 Aleatório Puro (RNG)</option></select></div>
        ${controlesExtras}
    </div>
    <button class="btn btn-primary" onclick="window.gerarJogos()" style="background:${config.cor};">${config.icone} GERAR JOGOS (R$ 3,00/jogo)</button>
    <div id="backtestResultados" style="margin-top:15px;"></div>
    <div id="resultados" style="margin-top:20px;"></div>
    </div>`;
    
    html += `<div class="regras-oficiais"><h4>📜 Regras</h4><p>${REGRAS_OFICIAIS[loteria]}</p></div>`;
    div.innerHTML = html;
}

window.atualizarQuantidadePorRange = atualizarQuantidadePorRange;
window.atualizarQuantidadePorInput = atualizarQuantidadePorInput;
window.selecionarLoteria = selecionarLoteria;
window.abrirModalComprar = () => abrirModalComprar(window.usuarioAtual, window.creditosUsuario, iniciarPagamentoPix);
window.abrirPerfil = () => { window.location.href = 'perfil.html'; };
window.logout = async () => { await logout(); };
window.toggleTema = () => { document.body.classList.toggle('light-mode'); localStorage.setItem('tema', document.body.classList.contains('light-mode') ? 'light' : 'dark'); };
window.setPeriodo = (p) => { window.periodoSelecionado = p; window.iaTreinada = false; window.aiModel = null; renderizarConteudo(window.loteriaAtual); if (window.dadosAtuais.length >= 10) setTimeout(() => window.treinarIAComFiltrosAtuais(), 500); };
window.atualizarDispersao = (v) => { window.dispersaoAtual = parseInt(v); document.getElementById('dispersaoValor') && (document.getElementById('dispersaoValor').textContent = `${v} concursos`); window.iaTreinada = false; window.aiModel = null; };