// Função para obter os parâmetros da URL
function getUrlParameter(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// Função para carregar os eventos de uma categoria
async function loadEvents() {
    const category = getUrlParameter('category'); // Obtem a categoria da URL
    document.querySelector('.category span').textContent = category; // Atualiza o título da categoria

    try {
        const response = await fetch(`http://localhost:3000/getEventsByCategory?category=${category}`);
        if (!response.ok) throw new Error(await response.text());

        const events = await response.json();

        const cardsContainer = document.querySelector('.cards');
        cardsContainer.innerHTML = ''; // Limpa os eventos existentes

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="default.jpg" alt="${event.title}">
                <div class="card-content">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                </div>
                <button onclick="redirectToEvent(${event.eventId}, '${event.title}')">Apostar</button>
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
    window.location.href = `betEvent.html?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`;
}

// Chama a função ao carregar a página
window.onload = loadEvents;