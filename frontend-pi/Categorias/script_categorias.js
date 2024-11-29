// Função para obter os parâmetros da URL
function getUrlParameter(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

async function loadEvents() {
    const category = getUrlParameter('category'); 
    document.getElementById('categoryName').textContent = category; 

    try {
        const response = await fetch(`http://localhost:3000/getEventsByCategory?category=${category}`);

        
        if (response.status === 404) {
            const errorMessage = await response.text(); // Pega a mensagem de erro do servidor
            const eventsContainer = document.getElementById('eventsContainer');
            eventsContainer.innerHTML = `<p class="no-events-message">${errorMessage}</p>`;
            return; // Retorna para não continuar o processo
        }
        

        
        if (!response.ok) throw new Error(await response.text());

        const events = await response.json(); 

        const eventsContainer = document.getElementById('eventsContainer');
        eventsContainer.innerHTML = ''; 

 
        if (events.length === 0) {
            eventsContainer.innerHTML = `<p>Nenhum evento encontrado para esta categoria.</p>`;
        } else {
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
                    <button class="btn btn-danger" onclick="deletarEvento('${event.eventId}')">Deletar</button>
                `;
                eventsContainer.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showConfirmationPopup('Erro', 'Erro ao carregar eventos', 'Por favor, tente novamente.');
    }
}


async function deletarEvento(eventId) {
    const token = localStorage.getItem('authToken'); // Assumindo que o token é armazenado no localStorage.

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
            // Remove o evento do DOM
            
        } else {
            const errorMessage = await response.text();
            showConfirmationPopup('Erro',`Erro ao deletar evento: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Erro ao deletar evento:', error);
        showConfirmationPopup('Erro','Ocorreu um erro ao tentar deletar o evento. Tente novamente mais tarde.');
    }
}

// Função para redirecionar para a página de aposta



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
