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
    try {
        // Faz a requisição ao backend para buscar eventos
        const response = await fetch(`http://localhost:3000/searchEvent?keyword=${encodeURIComponent(keyword)}`);

 
    if (response.status === 404) {
        const errorMessage = await response.text(); // Pega a mensagem de erro do servidor
        const eventsContainer = document.getElementById('eventsContainer');
        eventsContainer.innerHTML = `<p class="no-events-message">${errorMessage}</p>`;
        return; // Retorna para não continuar o processo
    }

    // Atualiza o título com a palavra-chave
    document.getElementById('searchKeyword').textContent = keyword;

   

    if (!response.ok) throw new Error(await response.text());

    const events = await response.json(); 

    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = ''; 



        if (events.length === 0) {
            eventsContainer.innerHTML = '<p class="text-muted">Nenhum evento encontrado para essa palavra-chave.</p>';
            return;
        } else{
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
                            <div class="mt-auto d-flex justify-content-between">
                                <button class="btn btn-primary" onclick="redirectToBet('${event.eventId}')">Apostar</button>
                                <button class="btn btn-danger" onclick="deletarEvento('${event.eventId}')">Deletar</button>
                            </div>
                        </div>
                    </div>
                `;
            
                document.getElementById('eventsContainer').appendChild(card);
            });
        } 
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showConfirmationPopup('Erro', 'Erro ao carregar eventos. Por favor, tente novamente.');
    }
}
async function deletarEvento(eventId) {
    const token = localStorage.getItem('authToken'); 

    if (!token) {
        showConfirmationPopup('Erro','Você precisa estar logado para deletar um evento.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/deleteEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'eventId': eventId,
                'token': token
            }
        });

        if (response.ok) {
            showConfirmationPopup('Sucesso!','Evento deletado com sucesso.');
           
            
        } else {
            const errorMessage = await response.text();
            showConfirmationPopup('Erro',`Erro ao deletar evento: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Erro ao deletar evento:', error);
        showConfirmationPopup('Erro','Ocorreu um erro ao tentar deletar o evento. Tente novamente mais tarde.');
    }
}


function redirectToBet(eventId) {
    window.location.href = `../ApostarEvento/ApostarEvento.html?eventId=${eventId}`;
}


function showConfirmationPopup(title, message) {
    const popup = document.getElementById("confirmationPopup");
    const popupTitle = document.getElementById("popupTitle");
    const popupMessage = document.getElementById("popupMessage");

    popupTitle.innerText = title;
    popupMessage.innerText = message;

    popup.classList.remove("d-none"); 
}


function closeConfirmationPopup() {
    const popup = document.getElementById("confirmationPopup");
    popup.classList.add("d-none"); // Esconde o popup
}


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
