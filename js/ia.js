export class AdvancedLotteryAI {
    constructor(dados, maxNumero, loteriaNome) { 
        this.dados = dados; 
        this.maxNumero = maxNumero; 
        this.loteriaNome = loteriaNome; 
        this.treinado = false; 
        this.confianca = 0; 
    }
    
    calcularFrequenciaPonderada() {
        const total = this.dados.length;
        const freq = new Array(this.maxNumero + 1).fill(0);
        for (let i = 0; i < this.dados.length; i++) { 
            const peso = Math.pow(1.2, i / total); 
            for (const n of this.dados[i]) if (n >= 0 && n <= this.maxNumero) freq[n] += peso; 
        }
        const maxFreq = Math.max(...freq.slice(1));
        const res = [];
        for (let n = 0; n <= this.maxNumero; n++) res.push({ numero: n, frequencia: maxFreq > 0 ? freq[n] / maxFreq : 0, probabilidade: (freq[n] / total) * 100 });
        return res;
    }
    
    calcularAtraso() {
        const atraso = new Array(this.maxNumero + 1).fill(this.dados.length);
        for (let n = 0; n <= this.maxNumero; n++) 
            for (let i = this.dados.length-1; i >= 0; i--) 
                if (this.dados[i].includes(n)) { atraso[n] = this.dados.length - 1 - i; break; }
        const maxAtraso = Math.max(...atraso);
        const res = [];
        for (let n = 0; n <= this.maxNumero; n++) res.push({ numero: n, atraso: atraso[n], fator: maxAtraso > 0 ? atraso[n] / maxAtraso : 0 });
        return res;
    }
    
    calcularScoreCompleto() {
        const freq = this.calcularFrequenciaPonderada();
        const atraso = this.calcularAtraso();
        const scores = [];
        for (let n = 0; n <= this.maxNumero; n++) { 
            let score = (1 - freq[n].frequencia) * 50 + atraso[n].fator * 50; 
            scores.push({ numero: n, score: score, atraso: atraso[n].atraso }); 
        }
        return scores.sort((a,b) => b.score - a.score);
    }
    
    treinar() { 
        if (this.dados.length < 10) return false; 
        this.treinado = true; 
        this.confianca = Math.min(95, Math.floor(this.dados.length / 10) + 50); 
        return true; 
    }
    
    predizerIAEspecialista(qtd, usarDispersao = true, windowDispersao = 10, seed = 0) {
        if (!this.treinado) return this.predizerAleatorio(qtd, seed);
        const scores = this.calcularScoreCompleto();
        const ruido = (seed % 100) / 100;
        let scoresRuido = scores.map(s => ({ ...s, score: s.score * (0.7 + ruido + Math.random() * 0.6) }));
        if (usarDispersao && this.dados.length >= windowDispersao) {
            const recentes = new Set();
            this.dados.slice(-windowDispersao).forEach(jogo => jogo.forEach(n => recentes.add(n)));
            scoresRuido = scoresRuido.map(s => ({ ...s, score: recentes.has(s.numero) ? s.score * 0.1 : s.score }));
        }
        scoresRuido.sort((a,b) => b.score - a.score);
        const candidatos = scoresRuido.slice(0, Math.max(qtd * 2, 20));
        const resultado = new Set();
        while (resultado.size < qtd && candidatos.length > 0) { 
            const idx = Math.floor(Math.random() * candidatos.length); 
            resultado.add(candidatos[idx].numero); 
            candidatos.splice(idx, 1); 
        }
        if (resultado.size < qtd) { 
            const todos = Array.from({ length: this.maxNumero + 1 }, (_, i) => i); 
            const disp = todos.filter(n => !resultado.has(n)); 
            while (resultado.size < qtd && disp.length > 0) { 
                const idx = Math.floor(Math.random() * disp.length); 
                resultado.add(disp[idx]); 
                disp.splice(idx, 1); 
            } 
        }
        return Array.from(resultado).sort((a,b) => a - b);
    }
    
    predizerAleatorio(qtd) { 
        const res = new Set(); 
        while (res.size < qtd) res.add(Math.floor(Math.random() * (this.maxNumero + 1))); 
        return Array.from(res).sort((a,b)=>a-b); 
    }
    
    calcularConfiancaJogo(jogo) {
        if (!this.treinado) return 50;
        const freq = this.calcularFrequenciaPonderada();
        const atraso = this.calcularAtraso();
        let conf = 0;
        for (const n of jogo) conf += (1 - freq[n].frequencia) * 40 + atraso[n].fator * 60;
        return Math.min(100, Math.max(0, Math.floor(conf / jogo.length)));
    }
    
    gerarRelatorio() { 
        return { 
            loteria: this.loteriaNome, 
            confiancaGeral: this.confianca, 
            totalDados: this.dados.length, 
            melhoresNumerosAtuais: this.calcularScoreCompleto().slice(0,10).map(s => ({ numero: s.numero, pontuacao: s.score.toFixed(0) })) 
        }; 
    }
    
    predizerMesSorte() { return Math.floor(Math.random() * 12) + 1; }
    predizerTimeSorte() { return Math.floor(Math.random() * 80) + 1; }
    predizerTrevos(qtd) { const t = new Set(); while (t.size < qtd) t.add(Math.floor(Math.random() * 6) + 1); return Array.from(t).sort((a,b)=>a-b); }
}