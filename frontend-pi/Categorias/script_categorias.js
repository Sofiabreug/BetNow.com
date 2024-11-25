// Função para obter os parâmetros da URL
function getUrlParameter(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// Função para carregar os eventos de uma categoria
async function loadEvents() {
    const category = getUrlParameter('category'); // Obtém a categoria da URL
    if (!category) {
        alert('Categoria não especificada!');
        return;
    }

    // Atualiza o título da categoria
    document.querySelector('.category span').textContent = category;

    try {
        // Faz a requisição para buscar eventos da categoria
        const response = await fetch(`http://localhost:3000/getEventsByCategory?category=${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error(await response.text());

        const events = await response.json();

        // Seleciona o contêiner dos cartões
        const cardsContainer = document.querySelector('.cards');
        cardsContainer.innerHTML = ''; // Limpa os eventos existentes

        // Verifica se existem eventos na categoria
        if (events.length === 0) {
            cardsContainer.innerHTML = `<p class="text-center text-muted">Nenhum evento encontrado para esta categoria.</p>`;
            return;
        }

        // Renderiza os eventos
        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="default.jpg" alt="${event.title}" class="card-img">
                <div class="card-content">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                </div>
                <button class="btn btn-primary" onclick="redirectToEvent(${event.eventId}, '${event.title}')">Apostar</button>
            `;
            cardsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        alert('Não foi possível carregar os eventos dessa categoria.');
    }
}

// Função para redirecionar para a página de aposta
function redirectToEvent(eventId, eventTitle) {
    window.location.href = `/frontend-pi/ApostarEvento/ApostarEvento.html?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`;
}

// Chama a função ao carregar a página
window.onload = loadEvents;
