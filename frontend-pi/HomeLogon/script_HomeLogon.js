
function redirectToCategory(category) {
    window.location.href = `categories.html?category=${encodeURIComponent(category)}`;
}

// Eventos em destaque (finalizando)
async function fetchEvents(url, errorMessage) {
    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) throw new Error(errorMessage);
        return await response.json();
    } catch (error) {
        console.error(errorMessage, error);
        return [];
    }
}

// Exibir eventos em um contêiner
async function displayEvents(url, containerId, emptyMessage, limit = 5) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Limpa o contêiner antes de adicionar novos itens.

    const events = await fetchEvents(url, `Erro ao carregar eventos para ${containerId}.`);
    if (events.length === 0) {
        container.innerHTML = `
            <div class="card text-center" style="width: 15rem;">
                <div class="card-body">
                    <h5 class="card-title">${emptyMessage}</h5>
                </div>
            </div>`;
        return;
    }

    const limitedEvents = events.slice(0, limit);
    limitedEvents.forEach(event => container.appendChild(createEventCard(event)));
}

// Criação de cards de eventos
function createEventCard(event) {
    const card = document.createElement("div");
    card.classList.add("card", "text-center");
    card.style.width = "17rem"; // Card ainda menor

    // Adicionar o evento de clique para abrir o modal
    card.addEventListener('click', () => {
        // Aqui a função `redirectAposta` será chamada com o ID do evento
        redirectAposta(event.eventId); // Supondo que `event.eventId` seja o identificador do evento
    });

    card.innerHTML = `
        <div class="card-img-container" style="position: relative;">
            <img src="${updateImage(event.category)}" class="card-img-top" style="opacity: 80%; height: 150px; object-fit: cover;">
            <div class="card-img-overlay d-flex align-items-center justify-content-center" 
                style="background-color: rgba(0, 0, 0, 0.5); color: white;">
                <h5 class="card-title text-center text-truncate" title="${event.title}">${event.title}</h5>
            </div>
        </div>`;
    return card;
}
// Função chamada ao enviar o formulário de pesquisa



// Atualizar a imagem com base na categoria do evento
function updateImage(category) {
    const categoryImages = {
        sport: "https://www.institutoclaro.org.br/educacao/wp-content/uploads/sites/2/2013/11/planodeaulaesporte_1840.jpg",
        culture: "https://www.jornaldotrabalhador.com.br/wp-content/uploads/2019/01/cultura-696x338.png",
        technology: "https://anbc.org.br/wp-content/uploads/2024/02/tecnologia.webp",
        economy: "https://static.portaldaindustria.com.br/portaldaindustria/noticias/media/imagem_plugin/shutterstock_rLcCBI9.jpg",
        eSport: "https://img.odcdn.com.br/wp-content/uploads/2022/11/esports_competicao.jpg"
    };
    // Imagem padrão caso a categoria não seja encontrada
    const defaultImage = "https://static.vecteezy.com/ti/vetor-gratis/t2/6868934-abstrato-roxo-fluido-onda-fundo-gratis-vetor.jpg";
    return categoryImages[category] || defaultImage; // Usa a imagem padrão se a categoria não for encontrada
}



// Exibir alerta
function showAlert(message) {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = `
        <div class="alert alert-custom alert-dismissible fade show" role="alert" style="position: fixed; top: 10px; right: 10px; z-index: 1050;">
            ${message}
        </div>`;
    setTimeout(() => alertContainer.innerHTML = '', 5000);
}

// Carregar eventos ao carregar a página
window.onload = function () {
    displayEvents('http://localhost:3000/getEventsFinishing', "eventsFinishing", "Nenhum evento próximo de finalizar.");
    displayEvents('http://localhost:3000/getMostBetEvents', "mostBetEvents", "Nenhum evento popular no momento.");
};


// Filtrar por categoria
function filterCategory(){
    const categ = document.getElementById("categorySelect").value;

    if(categ === 'sport' || categ === 'technology' || categ === 'culture' || categ === 'economy' || categ === 'esport'){
        window.location.href = "categories.html";
    }
}


function showConfirmationPopup(title, message) {
    const popup = document.getElementById("confirmationPopup");
    const popupTitle = document.getElementById("popupTitle");
    const popupMessage = document.getElementById("popupMessage");
  
    popupTitle.innerText = title;
    popupMessage.innerText = message;
  
    popup.classList.remove("d-none"); // Mostra o popup
  }
  
  function closeConfirmationPopup() {
    const popup = document.getElementById("confirmationPopup");
    popup.classList.add("d-none"); // Esconde o popup
  }
  function redirectAposta(eventId) {
   
    // Use o caminho relativo correto para o redirecionamento
    window.location.href = `/frontend-pi/ApostarEvento/ApostarEvento.html?eventId=${eventId}`;
}

document.getElementById('searchButton').addEventListener('click', async (event) => {
event.preventDefault(); // Impede o recarregamento da página

const keyword = document.getElementById('searchInput').value.trim();

if (!keyword) {
    alert('Por favor, insira uma palavra-chave para buscar.');
    return;
}

try {
    const response = await fetch(`http://localhost:3000/searchEvent?keyword=${encodeURIComponent(keyword)}`);

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na resposta: ${errorText}`);
    }

    const events = await response.json();
    console.log('Eventos retornados:', events);

    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = ''; // Limpa os resultados anteriores

    if (events.length === 0) {
        eventsContainer.innerHTML = '<p>Nenhum evento encontrado.</p>';
        return;
    }

    // Renderizando os eventos
    events.forEach((event) => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
            <div class="card-body">
                <h3>${event.title || 'Título não informado'}</h3>
                <p>${event.description || 'Descrição não disponível'}</p>
                <p>Categoria: ${event.category || 'Categoria não especificada'}</p>
            </div>
            <button onclick="redirectAposta(${event.eventId})">Apostar</button>
        `;
        eventsContainer.appendChild(card);
    });
} catch (error) {
    console.error('Erro ao carregar eventos:', error);
    alert('Erro ao carregar eventos. Por favor, tente novamente.');
}
});



// Função temporária para evitar erros



document.getElementById('searchButton').addEventListener('click', function(event) {
event.preventDefault(); // Impede o recarregamento imediato da página

const keyword = document.getElementById('searchInput').value.trim();

if (!keyword) {
    alert('Por favor, insira uma palavra-chave para buscar.');
    return;
}

// Redireciona para a página BuscarEventos.html passando a palavra-chave
window.location.href = `BuscarEventos.html?keyword=${encodeURIComponent(keyword)}`;
});

// Função temporária para evitar erros ao clicar em "Apostar"


window.addEventListener("load", () => {
hideNoneEvent();
displayEventsFinishing();
displayMostBetEvents();
});

src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
crossorigin="anonymous"
