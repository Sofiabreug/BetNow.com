// Função para obter parâmetros da URL
function getUrlParameter(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// Função para carregar eventos com base na palavra-chave
async function loadSearchResults() {
    const keyword = getUrlParameter('keyword'); // Obtém a palavra-chave da URL

    if (!keyword) {
        showConfirmationPopup('Erro', 'Nenhuma palavra-chave foi fornecida.');
        window.location.href = 'HomeLogon.html'; // Redireciona para a página inicial
        return;
    }

    // Atualiza o título com a palavra-chave
    document.getElementById('searchKeyword').textContent = keyword;

    try {
        // Faz a requisição ao backend para buscar eventos
        const response = await fetch(`http://localhost:3000/searchEvent?keyword=${encodeURIComponent(keyword)}`);

        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na resposta: ${errorText}`);
        }

        // Recebe os eventos em formato JSON
        const events = await response.json();
        console.log('Eventos retornados:', events);

        const eventsContainer = document.getElementById('eventsContainer');
        eventsContainer.innerHTML = ''; // Limpa os resultados anteriores

        if (events.length === 0) {
            eventsContainer.innerHTML = '<p class="text-muted">Nenhum evento encontrado para essa palavra-chave.</p>';
            return;
        }

        // Cria os cards dinamicamente para cada evento encontrado
        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';

            card.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${event.title || 'Título não informado'}</h5>
                        <p class="card-text">${event.description || 'Descrição não disponível'}</p>
                        <p class="card-text"><strong>Categoria:</strong> ${event.category || 'Categoria não especificada'}</p>
                        <p class="card-text"><strong>Preço da Aposta:</strong> R$ ${parseFloat(event.ticketValue).toFixed(2)}</p>
                        <div class="mt-auto">
                            <button class="btn btn-primary w-100" onclick="redirectToBet('${event.eventId}')">Apostar</button>
                        </div>
                    </div>
                </div>
            `;
            eventsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showConfirmationPopup('Erro', 'Erro ao carregar eventos. Por favor, tente novamente.');
    }
}

// Função para redirecionar para a página de aposta
function redirectToBet(eventId) {
    window.location.href = `../ApostarEvento/ApostarEvento.html?eventId=${eventId}`;
}

// Função para exibir o popup de confirmação
function showConfirmationPopup(title, message) {
    const popup = document.getElementById("confirmationPopup");
    const popupTitle = document.getElementById("popupTitle");
    const popupMessage = document.getElementById("popupMessage");

    popupTitle.innerText = title;
    popupMessage.innerText = message;

    popup.classList.remove("d-none"); // Mostra o popup
}

// Função para fechar o popup de confirmação
function closeConfirmationPopup() {
    const popup = document.getElementById("confirmationPopup");
    popup.classList.add("d-none"); // Esconde o popup
}

// Adiciona evento de submissão no formulário de busca da nova página
document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita o recarregamento da página

    const keyword = document.getElementById('searchInput').value.trim();

    if (!keyword) {
        showConfirmationPopup('Erro', 'Por favor, insira uma palavra-chave para buscar.');
        return;
    }

    // Redireciona para a página de resultados com a nova palavra-chave
    window.location.href = `BuscarEventos.html?keyword=${encodeURIComponent(keyword)}`;
});

// Chama a função ao carregar a página
window.onload = loadSearchResults;
