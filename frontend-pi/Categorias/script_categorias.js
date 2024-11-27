// Função para obter os parâmetros da URL
function getUrlParameter(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// Função para carregar eventos de uma categoria
async function loadEvents() {
    const category = getUrlParameter('category'); // Obtém a categoria da URL
    document.getElementById('categoryName').textContent = category; // Atualiza o título da categoria

    try {
        const response = await fetch(`http://localhost:3000/getEventsByCategory?category=${category}`);
        if (!response.ok) throw new Error(await response.text());

        const events = await response.json();

        const eventsContainer = document.getElementById('eventsContainer');
        eventsContainer.innerHTML = ''; // Limpa os eventos existentes

        // Cria os cards dinamicamente
        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card';

            card.innerHTML = `
                <div class="card-content">
                    <h3>${event.title || 'Título não informado'}</h3>
                    <p>${event.description || 'Descrição não disponível'}</p>
                </div>
                <button onclick="redirectToBet(${event.eventId})">Apostar</button>
            `;
            eventsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showConfirmationPopup('Erro ao carregar eventos', 'Por favor, tente novamente.');
    }
}

// Função para redirecionar para a página de aposta
function redirectToBet(eventId) {
    window.location.href = `../ApostarEvento/ApostarEvento.html?eventId=${eventId}`;
}

// Função para exibir o pop-up de confirmação
function showConfirmationPopup(title, message) {
    const popup = document.getElementById("confirmationPopup");
    const popupTitle = document.getElementById("popupTitle");
    const popupMessage = document.getElementById("popupMessage");

    popupTitle.innerText = title;
    popupMessage.innerText = message;

    popup.classList.remove("d-none"); // Exibe o pop-up
}

// Função para fechar o pop-up de confirmação
function closeConfirmationPopup() {
    const popup = document.getElementById("confirmationPopup");
    popup.classList.add("d-none"); // Esconde o pop-up
}

// Chama a função ao carregar a página
window.onload = loadEvents;
