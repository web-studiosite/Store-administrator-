
formulas_content = '''// formulas.js - Cálculos de Margens, Lucros e Relatórios
// Emola Agent Controller

const Formulas = {
    // Formatação de moeda
    formatarMoeda: (valor, moeda = 'MZN') => {
        const simbolos = {
            'MZN': 'MZN',
            'USD': '$',
            'EUR': '€',
            'BRL': 'R$',
            'AOA': 'Kz'
        };
        const simbolo = simbolos[moeda] || moeda;
        return `${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${simbolo}`;
    },

    // Cálculo de margem de lucro (%)
    calcularMargem: (precoAquisicao, precoVenda) => {
        if (!precoAquisicao || precoAquisicao <= 0) return 0;
        return ((precoVenda - precoAquisicao) / precoAquisicao) * 100;
    },

    // Cálculo de lucro unitário
    lucroUnitario: (precoAquisicao, precoVenda) => {
        return parseFloat(precoVenda) - parseFloat(precoAquisicao);
    },

    // Cálculo de lucro total de uma venda
    lucroTotalVenda: (precoAquisicao, precoVenda, quantidade) => {
        return (parseFloat(precoVenda) - parseFloat(precoAquisicao)) * parseInt(quantidade);
    },

    // Valor total de uma movimentação
    valorTotalMovimentacao: (preco, quantidade) => {
        return parseFloat(preco) * parseInt(quantidade);
    },

    // Cálculo de lucro diário
    calcularLucroDiario: (movimentacoes, produtos, data = null) => {
        const dataRef = data ? new Date(data) : new Date();
        const inicioDia = new Date(dataRef.getFullYear(), dataRef.getMonth(), dataRef.getDate());
        const fimDia = new Date(dataRef.getFullYear(), dataRef.getMonth(), dataRef.getDate() + 1);

        let lucroTotal = 0;
        let vendasTotal = 0;
        let custoTotal = 0;

        const vendasDoDia = movimentacoes.filter(m => {
            const dataMov = new Date(m.data);
            return m.tipo === 'saida' && dataMov >= inicioDia && dataMov < fimDia;
        });

        vendasDoDia.forEach(venda => {
            const produto = produtos.find(p => p.id === venda.produto_id);
            if (produto) {
                const lucro = Formulas.lucroTotalVenda(produto.preco_aquisicao, produto.preco_venda, venda.quantidade);
                lucroTotal += lucro;
                vendasTotal += Formulas.valorTotalMovimentacao(produto.preco_venda, venda.quantidade);
                custoTotal += Formulas.valorTotalMovimentacao(produto.preco_aquisicao, venda.quantidade);
            }
        });

        return {
            lucro: lucroTotal,
            vendas: vendasTotal,
            custo: custoTotal,
            quantidadeVendas: vendasDoDia.length,
            margem: vendasTotal > 0 ? ((lucroTotal / vendasTotal) * 100) : 0
        };
    },

    // Relatório por período
    calcularRelatorioPeriodo: (movimentacoes, produtos, dataInicio, dataFim) => {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);

        let totalVendas = 0;
        let totalCusto = 0;
        let totalLucro = 0;
        const porCategoria = {};

        const vendasPeriodo = movimentacoes.filter(m => {
            const dataMov = new Date(m.data);
            return m.tipo === 'saida' && dataMov >= inicio && dataMov <= fim;
        });

        vendasPeriodo.forEach(venda => {
            const produto = produtos.find(p => p.id === venda.produto_id);
            if (produto) {
                const valorVenda = Formulas.valorTotalMovimentacao(produto.preco_venda, venda.quantidade);
                const valorCusto = Formulas.valorTotalMovimentacao(produto.preco_aquisicao, venda.quantidade);
                const lucro = valorVenda - valorCusto;

                totalVendas += valorVenda;
                totalCusto += valorCusto;
                totalLucro += lucro;

                const cat = produto.categoria || 'Sem Categoria';
                if (!porCategoria[cat]) {
                    porCategoria[cat] = {
                        categoria: cat,
                        quantidade: 0,
                        receita: 0,
                        custo: 0,
                        lucro: 0
                    };
                }
                porCategoria[cat].quantidade += parseInt(venda.quantidade);
                porCategoria[cat].receita += valorVenda;
                porCategoria[cat].custo += valorCusto;
                porCategoria[cat].lucro += lucro;
            }
        });

        // Calcular margens por categoria
        Object.values(porCategoria).forEach(cat => {
            cat.margem = cat.receita > 0 ? ((cat.lucro / cat.receita) * 100) : 0;
        });

        return {
            totalVendas,
            totalCusto,
            totalLucro,
            margemMedia: totalVendas > 0 ? ((totalLucro / totalVendas) * 100) : 0,
            porCategoria: Object.values(porCategoria).sort((a, b) => b.lucro - a.lucro)
        };
    },

    // Verificar estoque baixo
    verificarEstoqueBaixo: (produtos, limite = 10) => {
        return produtos.filter(p => parseInt(p.quantidade) <= limite);
    },

    // Calcular quantidade disponível na loja (estoque total - reservas)
    // Por padrão, consideramos que todo estoque está disponível na loja
    // A menos que haja uma lógica específica de armazém vs loja
    quantidadeLoja: (produto) => {
        return parseInt(produto.quantidade) || 0;
    },

    // Data helpers
    formatarData: (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatarDataCurta: (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    },

    // Obter datas de períodos predefinidos
    getPeriodoDatas: (periodo) => {
        const hoje = new Date();
        let inicio, fim;

        switch (periodo) {
            case 'hoje':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
                break;
            case 'semana':
                const diaSemana = hoje.getDay();
                inicio = new Date(hoje);
                inicio.setDate(hoje.getDate() - diaSemana);
                inicio.setHours(0, 0, 0, 0);
                fim = new Date(hoje);
                fim.setHours(23, 59, 59, 999);
                break;
            case 'mes':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
                break;
            default:
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
        }

        return { inicio: inicio.toISOString(), fim: fim.toISOString() };
    },

    // Exportar para CSV
    exportarCSV: (dados, nomeArquivo = 'dados') => {
        if (!dados || dados.length === 0) return;
        
        const headers = Object.keys(dados[0]);
        const csvContent = [
            headers.join(';'),
            ...dados.map(row => 
                headers.map(h => {
                    const val = row[h];
                    // Escapar valores com ponto-e-vírgula ou quebras de linha
                    if (typeof val === 'string' && (val.includes(';') || val.includes('\n'))) {
                        return `"${val.replace(/"/g, '""')}"`;
                    }
                    return val;
                }).join(';')
            )
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    // Exportar para JSON
    exportarJSON: (dados, nomeArquivo = 'dados') => {
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' };
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    },

    // Gerar ID único
    gerarId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validar formulário
    validarFormulario: (formData) => {
        const erros = [];
        for (const [campo, valor] of Object.entries(formData)) {
            if (valor === '' || valor === null || valor === undefined) {
                erros.push(`O campo ${campo} é obrigatório.`);
            }
        }
        return erros;
    }
};

// Disponibilizar globalmente
window.Formulas = Formulas;'''

with open('/mnt/agents/output/formulas.js', 'w', encoding='utf-8') as f:
    f.write(formulas_content)

print("formulas.js criado com sucesso!")
