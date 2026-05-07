
app_content = '''// app.js - Lógica Principal da Interface
// Emola Agent Controller

const App = {
    produtos: [],
    movimentacoes: [],
    config: {},

    init() {
        this.config = SupabaseAPI.carregarConfig();
        this.setupEventListeners();
        this.carregarDados().then(() => {
            this.renderizarTudo();
        });
        
        // Definir data atual nos campos de data
        const agora = new Date();
        const dataLocal = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('mov-data').value = dataLocal;
    },

    async carregarDados() {
        this.produtos = await SupabaseAPI.listarProdutos();
        this.movimentacoes = await SupabaseAPI.listarMovimentacoes();
    },

    setupEventListeners() {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.mudarTab(e.target.dataset.tab));
        });

        // Form Produto
        document.getElementById('form-produto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.cadastrarProduto();
        });

        // Form Movimentação
        document.getElementById('form-movimentacao').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarMovimentacao();
        });

        // Form Configurações
        document.getElementById('form-config').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarConfiguracoes();
        });

        // Modo Offline
        document.getElementById('btn-modo-offline').addEventListener('click', () => {
            SupabaseAPI.ativarModoOffline();
            alert('✅ Modo Offline ativado! Dados serão salvos localmente.');
            this.carregarDados().then(() => this.renderizarTudo());
        });

        // Filtros
        document.getElementById('filtro-produto').addEventListener('input', () => this.renderizarEstoque());
        document.getElementById('filtro-categoria').addEventListener('change', () => this.renderizarEstoque());
        
        document.getElementById('filtro-data-inicio').addEventListener('change', () => this.renderizarMovimentacoes());
        document.getElementById('filtro-data-fim').addEventListener('change', () => this.renderizarMovimentacoes());
        document.getElementById('filtro-tipo-mov').addEventListener('change', () => this.renderizarMovimentacoes());

        // Relatório
        document.getElementById('relatorio-periodo').addEventListener('change', (e) => {
            document.getElementById('datas-personalizado').style.display = 
                e.target.value === 'personalizado' ? 'flex' : 'none';
        });
        document.getElementById('btn-gerar-relatorio').addEventListener('click', () => this.gerarRelatorio());

        // Exportação
        document.getElementById('btn-exportar-json').addEventListener('click', () => this.exportarJSON());
        document.getElementById('btn-exportar-csv').addEventListener('click', () => this.exportarCSV());

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('modal-editar').style.display = 'none';
        });
        document.getElementById('form-editar').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEdicao();
        });

        // Preencher campos de config
        document.getElementById('supabase-url').value = this.config.url;
        document.getElementById('supabase-key').value = this.config.key;
        document.getElementById('config-moeda').value = this.config.moeda;
        document.getElementById('config-estoque-minimo').value = this.config.estoqueMinimo;
    },

    mudarTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        if (tabId === 'estoque') this.renderizarEstoque();
        if (tabId === 'movimentacoes') this.renderizarMovimentacoes();
        if (tabId === 'dashboard') this.renderizarDashboard();
    },

    renderizarTudo() {
        this.renderizarDashboard();
        this.renderizarEstoque();
        this.renderizarMovimentacoes();
        this.atualizarSelectProdutos();
        this.atualizarFiltroCategorias();
    },

    // ===== DASHBOARD =====
    renderizarDashboard() {
        const lucroHoje = Formulas.calcularLucroDiario(this.movimentacoes, this.produtos);
        document.getElementById('lucro-hoje').textContent = Formulas.formatarMoeda(lucroHoje.lucro, this.config.moeda);
        document.getElementById('total-estoque').textContent = this.produtos.reduce((acc, p) => acc + parseInt(p.quantidade || 0), 0);
        document.getElementById('vendas-hoje').textContent = lucroHoje.quantidadeVendas;
        
        const estoqueBaixo = Formulas.verificarEstoqueBaixo(this.produtos, this.config.estoqueMinimo);
        const elEstoqueBaixo = document.getElementById('estoque-baixo');
        elEstoqueBaixo.textContent = estoqueBaixo.length;
        elEstoqueBaixo.style.color = estoqueBaixo.length > 0 ? 'var(--danger)' : 'var(--secondary)';

        // Últimas movimentações
        const tbody = document.querySelector('#ultimas-movimentacoes tbody');
        const ultimas = [...this.movimentacoes].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 10);
        
        tbody.innerHTML = ultimas.map(m => {
            const prod = this.produtos.find(p => p.id === m.produto_id);
            const valor = m.tipo === 'saida' && prod 
                ? Formulas.valorTotalMovimentacao(prod.preco_venda, m.quantidade)
                : (prod ? Formulas.valorTotalMovimentacao(prod.preco_aquisicao, m.quantidade) : 0);
            return `
                <tr>
                    <td>${Formulas.formatarDataCurta(m.data)}</td>
                    <td>${prod ? prod.nome : 'Desconhecido'}</td>
                    <td><span class="badge badge-${m.tipo}">${m.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}</span></td>
                    <td>${m.quantidade}</td>
                    <td>${Formulas.formatarMoeda(valor, this.config.moeda)}</td>
                </tr>
            `;
        }).join('');
    },

    // ===== ESTOQUE =====
    async cadastrarProduto() {
        const categoriaSelect = document.getElementById('prod-categoria').value;
        const novaCategoria = document.getElementById('nova-categoria').value.trim();
        const categoria = novaCategoria || categoriaSelect;

        const produto = {
            nome: document.getElementById('prod-nome').value.trim(),
            categoria: categoria,
            quantidade: parseInt(document.getElementById('prod-quantidade').value),
            preco_aquisicao: parseFloat(document.getElementById('prod-preco-aquisicao').value),
            preco_venda: parseFloat(document.getElementById('prod-preco-venda').value)
        };

        const erros = Formulas.validarFormulario(produto);
        if (erros.length > 0) {
            alert('Erros:\n' + erros.join('\n'));
            return;
        }

        await SupabaseAPI.criarProduto(produto);
        await this.carregarDados();
        this.renderizarTudo();
        document.getElementById('form-produto').reset();
        document.getElementById('nova-categoria').value = '';
        alert('✅ Produto cadastrado com sucesso!');
    },

    renderizarEstoque() {
        const filtroNome = document.getElementById('filtro-produto').value.toLowerCase();
        const filtroCat = document.getElementById('filtro-categoria').value;

        let filtrados = this.produtos.filter(p => {
            const matchNome = p.nome.toLowerCase().includes(filtroNome);
            const matchCat = !filtroCat || p.categoria === filtroCat;
            return matchNome && matchCat;
        });

        const tbody = document.querySelector('#tabela-estoque tbody');
        tbody.innerHTML = filtrados.map(p => {
            const margem = Formulas.calcularMargem(p.preco_aquisicao, p.preco_venda);
            const qtdLoja = Formulas.quantidadeLoja(p);
            const alerta = parseInt(p.quantidade) <= this.config.estoqueMinimo ? 'style="color:var(--danger);font-weight:bold;"' : '';
            
            return `
                <tr>
                    <td>${p.nome}</td>
                    <td><span class="badge">${p.categoria}</span></td>
                    <td ${alerta}>${p.quantidade}</td>
                    <td>${qtdLoja}</td>
                    <td>${Formulas.formatarMoeda(p.preco_aquisicao, this.config.moeda)}</td>
                    <td>${Formulas.formatarMoeda(p.preco_venda, this.config.moeda)}</td>
                    <td style="color:${margem > 0 ? 'var(--secondary)' : 'var(--danger)'}">${margem.toFixed(1)}%</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="App.abrirEdicao('${p.id}')">✏️</button>
                        <button class="btn-action btn-delete" onclick="App.deletarProduto('${p.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    atualizarSelectProdutos() {
        const select = document.getElementById('mov-produto');
        select.innerHTML = '<option value="">Selecione...</option>' + 
            this.produtos.map(p => `<option value="${p.id}">${p.nome} (${p.quantidade} disp.)</option>`).join('');
    },

    atualizarFiltroCategorias() {
        const cats = [...new Set(this.produtos.map(p => p.categoria))].sort();
        const select = document.getElementById('filtro-categoria');
        select.innerHTML = '<option value="">Todas Categorias</option>' + 
            cats.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    abrirEdicao(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) return;
        
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-nome').value = produto.nome;
        document.getElementById('edit-categoria').value = produto.categoria;
        document.getElementById('edit-preco-aquisicao').value = produto.preco_aquisicao;
        document.getElementById('edit-preco-venda').value = produto.preco_venda;
        document.getElementById('modal-editar').style.display = 'block';
    },

    async salvarEdicao() {
        const id = document.getElementById('edit-id').value;
        const dados = {
            nome: document.getElementById('edit-nome').value,
            categoria: document.getElementById('edit-categoria').value,
            preco_aquisicao: parseFloat(document.getElementById('edit-preco-aquisicao').value),
            preco_venda: parseFloat(document.getElementById('edit-preco-venda').value)
        };
        
        await SupabaseAPI.atualizarProduto(id, dados);
        await this.carregarDados();
        this.renderizarTudo();
        document.getElementById('modal-editar').style.display = 'none';
        alert('✅ Produto atualizado!');
    },

    async deletarProduto(id) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        await SupabaseAPI.deletarProduto(id);
        await this.carregarDados();
        this.renderizarTudo();
    },

    // ===== MOVIMENTAÇÕES =====
    async registrarMovimentacao() {
        const produtoId = document.getElementById('mov-produto').value;
        const tipo = document.getElementById('mov-tipo').value;
        const quantidade = parseInt(document.getElementById('mov-quantidade').value);
        const data = document.getElementById('mov-data').value;

        if (!produtoId) { alert('Selecione um produto!'); return; }

        const produto = this.produtos.find(p => p.id === produtoId);
        if (!produto) { alert('Produto não encontrado!'); return; }

        if (tipo === 'saida' && parseInt(produto.quantidade) < quantidade) {
            alert(`Estoque insuficiente! Disponível: ${produto.quantidade}`);
            return;
        }

        const movimentacao = {
            produto_id: produtoId,
            tipo: tipo,
            quantidade: quantidade,
            data: new Date(data).toISOString()
        };

        await SupabaseAPI.criarMovimentacao(movimentacao);

        // Atualizar estoque
        const novaQtd = tipo === 'entrada' 
            ? parseInt(produto.quantidade) + quantidade 
            : parseInt(produto.quantidade) - quantidade;
        
        await SupabaseAPI.atualizarProduto(produtoId, { quantidade: novaQtd });

        await this.carregarDados();
        this.renderizarTudo();
        document.getElementById('form-movimentacao').reset();
        
        // Resetar data para agora
        const agora = new Date();
        const dataLocal = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('mov-data').value = dataLocal;
        
        alert(`✅ ${tipo === 'entrada' ? 'Entrada' : 'Venda'} registrada com sucesso!`);
    },

    renderizarMovimentacoes() {
        const filtroInicio = document.getElementById('filtro-data-inicio').value;
        const filtroFim = document.getElementById('filtro-data-fim').value;
        const filtroTipo = document.getElementById('filtro-tipo-mov').value;

        let filtradas = [...this.movimentacoes];

        if (filtroInicio) {
            const inicio = new Date(filtroInicio);
            filtradas = filtradas.filter(m => new Date(m.data) >= inicio);
        }
        if (filtroFim) {
            const fim = new Date(filtroFim);
            fim.setHours(23, 59, 59);
            filtradas = filtradas.filter(m => new Date(m.data) <= fim);
        }
        if (filtroTipo) {
            filtradas = filtradas.filter(m => m.tipo === filtroTipo);
        }

        filtradas.sort((a, b) => new Date(b.data) - new Date(a.data));

        const tbody = document.querySelector('#tabela-movimentacoes tbody');
        tbody.innerHTML = filtradas.map(m => {
            const prod = this.produtos.find(p => p.id === m.produto_id);
            const valor = prod 
                ? (m.tipo === 'saida' 
                    ? Formulas.valorTotalMovimentacao(prod.preco_venda, m.quantidade)
                    : Formulas.valorTotalMovimentacao(prod.preco_aquisicao, m.quantidade))
                : 0;
            const lucro = (m.tipo === 'saida' && prod) 
                ? Formulas.lucroTotalVenda(prod.preco_aquisicao, prod.preco_venda, m.quantidade)
                : '-';

            return `
                <tr>
                    <td>${Formulas.formatarData(m.data)}</td>
                    <td>${prod ? prod.nome : 'Desconhecido'}</td>
                    <td>${prod ? prod.categoria : '-'}</td>
                    <td><span class="badge badge-${m.tipo}">${m.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}</span></td>
                    <td>${m.quantidade}</td>
                    <td>${Formulas.formatarMoeda(valor, this.config.moeda)}</td>
                    <td style="color:var(--secondary)">${typeof lucro === 'number' ? Formulas.formatarMoeda(lucro, this.config.moeda) : lucro}</td>
                    <td>
                        <button class="btn-action btn-delete" onclick="App.deletarMovimentacao('${m.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async deletarMovimentacao(id) {
        if (!confirm('Deseja excluir esta movimentação? O estoque será ajustado.')) return;
        
        const mov = this.movimentacoes.find(m => m.id === id);
        if (mov) {
            const prod = this.produtos.find(p => p.id === mov.produto_id);
            if (prod) {
                const novaQtd = mov.tipo === 'entrada' 
                    ? parseInt(prod.quantidade) - parseInt(mov.quantidade)
                    : parseInt(prod.quantidade) + parseInt(mov.quantidade);
                await SupabaseAPI.atualizarProduto(prod.id, { quantidade: novaQtd });
            }
        }
        
        await SupabaseAPI.deletarMovimentacao(id);
        await this.carregarDados();
        this.renderizarTudo();
    },

    // ===== RELATÓRIOS =====
    gerarRelatorio() {
        const periodo = document.getElementById('relatorio-periodo').value;
        let inicio, fim;

        if (periodo === 'personalizado') {
            inicio = document.getElementById('rel-data-inicio').value;
            fim = document.getElementById('rel-data-fim').value;
            if (!inicio || !fim) { alert('Selecione as datas!'); return; }
        } else {
            const datas = Formulas.getPeriodoDatas(periodo);
            inicio = datas.inicio;
            fim = datas.fim;
        }

        const relatorio = Formulas.calcularRelatorioPeriodo(this.movimentacoes, this.produtos, inicio, fim);

        document.getElementById('rel-total-vendas').textContent = Formulas.formatarMoeda(relatorio.totalVendas, this.config.moeda);
        document.getElementById('rel-custo-total').textContent = Formulas.formatarMoeda(relatorio.totalCusto, this.config.moeda);
        document.getElementById('rel-lucro-total').textContent = Formulas.formatarMoeda(relatorio.totalLucro, this.config.moeda);
        document.getElementById('rel-margem').textContent = relatorio.margemMedia.toFixed(1) + '%';

        const tbody = document.querySelector('#tabela-categorias tbody');
        tbody.innerHTML = relatorio.porCategoria.map(cat => `
            <tr>
                <td><strong>${cat.categoria}</strong></td>
                <td>${cat.quantidade}</td>
                <td>${Formulas.formatarMoeda(cat.receita, this.config.moeda)}</td>
                <td>${Formulas.formatarMoeda(cat.custo, this.config.moeda)}</td>
                <td style="color:var(--secondary)">${Formulas.formatarMoeda(cat.lucro, this.config.moeda)}</td>
                <td>${cat.margem.toFixed(1)}%</td>
            </tr>
        `).join('');

        // Armazenar para exportação
        this.ultimoRelatorio = relatorio;
    },

    // ===== EXPORTAÇÃO =====
    async exportarJSON() {
        const dados = await SupabaseAPI.exportarTodosDados();
        Formulas.exportarJSON(dados, 'emola_dados_completos');
    },

    async exportarCSV() {
        // Exportar estoque
        const estoqueCSV = this.produtos.map(p => ({
            id: p.id,
            nome: p.nome,
            categoria: p.categoria,
            quantidade: p.quantidade,
            preco_aquisicao: p.preco_aquisicao,
            preco_venda: p.preco_venda,
            margem_percentual: Formulas.calcularMargem(p.preco_aquisicao, p.preco_venda).toFixed(2)
        }));
        Formulas.exportarCSV(estoqueCSV, 'emola_estoque');

        // Exportar movimentações
        const movCSV = this.movimentacoes.map(m => {
            const prod = this.produtos.find(p => p.id === m.produto_id);
            return {
                id: m.id,
                data: m.data,
                produto: prod ? prod.nome : 'Desconhecido',
                categoria: prod ? prod.categoria : '-',
                tipo: m.tipo,
                quantidade: m.quantidade,
                valor_unitario: prod ? (m.tipo === 'saida' ? prod.preco_venda : prod.preco_aquisicao) : 0,
                valor_total: prod ? Formulas.valorTotalMovimentacao(m.tipo === 'saida' ? prod.preco_venda : prod.preco_aquisicao, m.quantidade) : 0,
                lucro: (m.tipo === 'saida' && prod) ? Formulas.lucroTotalVenda(prod.preco_aquisicao, prod.preco_venda, m.quantidade) : 0
            };
        });
        
        setTimeout(() => {
            Formulas.exportarCSV(movCSV, 'emola_movimentacoes');
        }, 500);
    },

    // ===== CONFIGURAÇÕES =====
    salvarConfiguracoes() {
        const url = document.getElementById('supabase-url').value.trim();
        const key = document.getElementById('supabase-key').value.trim();
        const moeda = document.getElementById('config-moeda').value;
        const estoqueMinimo = parseInt(document.getElementById('config-estoque-minimo').value);

        SupabaseAPI.salvarConfig(url, key, moeda, estoqueMinimo);
        this.config = SupabaseAPI.carregarConfig();
        
        alert('✅ Configurações salvas! Recarregando dados...');
        this.carregarDados().then(() => this.renderizarTudo());
    }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => App.init());'''

with open('/mnt/agents/output/app.js', 'w', encoding='utf-8') as f:
    f.write(app_content)

print("app.js criado com sucesso!")
