export const LOTERIAS = {
    megasena: { nome: 'Mega-Sena', icone: '💰', numeros: 6, maxNumero: 60, cor: '#8b5cf6', temDispersao: true, dispersaoPadrao: 15, dispersaoMin: 5, dispersaoMax: 25 },
    quina: { nome: 'Quina', icone: '🎯', numeros: 5, maxNumero: 80, cor: '#f59e0b', temDispersao: false },
    lotofacil: { nome: 'Lotofácil', icone: '🍀', numeros: 15, maxNumero: 25, cor: '#10b981', temDispersao: false },
    lotomania: { nome: 'Lotomania', icone: '🎪', numeros: 50, maxNumero: 99, cor: '#ef4444', incluirZero: true },
    duplasena: { nome: 'Dupla Sena', icone: '🎲', numeros: 6, maxNumero: 50, cor: '#06b6d4', temDispersao: true, dispersaoPadrao: 10 },
    timemania: { nome: 'Timemania', icone: '⚽', numeros: 10, maxNumero: 80, cor: '#ec4899', temTime: true },
    milionaria: { nome: '+Milionária', icone: '💎', numeros: 6, maxNumero: 50, cor: '#a855f7', temDispersao: true, dispersaoPadrao: 12, temTrevos: true, numTrevos: 2, maxTrevo: 6 },
    loteca: { nome: 'Loteca', icone: '⚽', numeros: 14, maxNumero: 3, cor: '#84cc16' },
    diadesorte: { nome: 'Dia de Sorte', icone: '📅', numeros: 7, maxNumero: 31, cor: '#f97316', temDispersao: true, dispersaoPadrao: 8, temMes: true, maxMes: 12 },
    supersete: { nome: 'Super Sete', icone: '🌟', numeros: 7, maxNumero: 9, cor: '#fbbf24', incluirZero: true }
};

export const REGRAS_OFICIAIS = {
    megasena: `<strong>Mega-Sena</strong> - 6 números (1 a 60). Valor: R$ 3,00 por jogo`,
    quina: `<strong>Quina</strong> - 5 números (1 a 80).`,
    lotofacil: `<strong>Lotofácil</strong> - 15 números (1 a 25).`,
    lotomania: `<strong>Lotomania</strong> - 50 números (00 a 99). ✅ Inclui zero`,
    duplasena: `<strong>Dupla Sena</strong> - 6 números (1 a 50).`,
    timemania: `<strong>Timemania</strong> - 10 números (1 a 80) + 1 Time do Coração (1 a 80). ✅ COMPLETO`,
    milionaria: `<strong>+Milionária</strong> - 6 números (1 a 50) + 2 Trevos (1 a 6). ✅ COMPLETO`,
    loteca: `<strong>Loteca</strong> - 14 palpites (1=Time1, 2=Time2, 0=Empate).`,
    diadesorte: `<strong>Dia de Sorte</strong> - 7 números (1 a 31) + 1 Mês da Sorte (1 a 12). ✅ COMPLETO`,
    supersete: `<strong>Super Sete</strong> - 7 colunas (0 a 9). ✅ Inclui zero`
};

export const VALORES_PIX = [12, 24, 36, 48, 60, 120, 180, 240];
export const CONCURSOS_POR_ANO = { megasena: 52, quina: 52, lotofacil: 52, lotomania: 52, duplasena: 52, timemania: 52, milionaria: 52, loteca: 26, diadesorte: 52, supersete: 52 };

export const cacheDados = {};
export const cacheDatas = {};

Object.keys(LOTERIAS).forEach(key => { 
    cacheDados[key] = { dados: [], carregado: false, nomeArquivo: null }; 
    cacheDatas[key] = { datas: [] }; 
});

export let loteriaAtual = 'megasena';
export let dadosAtuais = [];
export let periodoSelecionado = 'all';
export let dispersaoAtual = 15;
export let isTraining = false;
export let iaTreinada = false;
export let aiModel = null;
export let filtrosTreinamento = null;
export let usuarioAtual = null;
export let creditosUsuario = 0;

export function setLoteriaAtual(loteria) { loteriaAtual = loteria; }
export function setDadosAtuais(dados) { dadosAtuais = dados; }
export function setPeriodoSelecionado(periodo) { periodoSelecionado = periodo; }
export function setDispersaoAtual(valor) { dispersaoAtual = valor; }
export function setIaTreinada(valor) { iaTreinada = valor; }
export function setAiModel(modelo) { aiModel = modelo; }
export function setIsTraining(valor) { isTraining = valor; }
export function setFiltrosTreinamento(filtros) { filtrosTreinamento = filtros; }
export function setUsuarioAtual(usuario) { usuarioAtual = usuario; }
export function setCreditosUsuario(creditos) { creditosUsuario = creditos; }