src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
crossorigin="anonymous"

// Esconder card 'Nenhum evento ainda...'
function displayNoneEvent() {
    const ef = document.getElementById("eventsFinishin");
    const mbe = document.getElementById("mostBetEvents");

    if(!ef || !mbe){
        showNone();
    }
    else{
        hideNone();
    }
}

function hideNone(){
    const nn = document.getElementById("none");
    nn.style.display = "none";
}

function showNone() {
    const ef = document.getElementById("eventsFinishing");
    const mbe = document.getElementById("mostBetEvents");
    ef.style.display = "block";
    mbe.style.display = "block";
}

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
    card.style.width = "15rem"; // Card ainda menor

    // Adicionar o evento de clique para abrir o modal
    card.addEventListener('click', () => {
        // Aqui você deve abrir seu modal de login. Exemplo:
        $('#entarModal').modal('show'); // Supondo que o ID do seu modal seja 'loginModal'
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

// Estilo CSS para corrigir o hover, clique e a borda em tudo



// Buscar eventos pela barra de pesquisa
async function searchEvent() {
    const keyword = document.getElementById('search').value.trim();
    if (!keyword) return;

    const events = await fetchEvents(`http://localhost/searchEvent/${keyword}`, "Erro ao buscar eventos.");
    const container = document.querySelector('.cards');
    container.innerHTML = ''; // Limpa os resultados anteriores.

    if (events.length === 0) {
        showAlert("Nenhum evento encontrado.");
        return;
    }

    events.forEach(event => container.appendChild(createEventCard(event)));
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


function isValid(email, password) {
    var valid = false;

    email = email.trim();
    password = password.trim();

    if(email && password){
        valid = true;
    }

    else if (!email && !password) {
        showErrorMessage("Preencha os campos.");
    }

    else if (!email) {
        showErrorMessage("Informe o seu e-mail.");
    }

    else {
        showErrorMessage("Informe a sua senha.");
    }

    return valid;
}

function showErrorMessage(message) {
    const messageBox = document.getElementById("messageBox");
    document.getElementById("message").textContent = message;
    messageBox.style.display = "block"; // Exibe a mensagem
}

async function performSignIn() {
    const email = document.getElementById("fieldEmail").value.trim();
    const password = document.getElementById("fieldPassword").value.trim();

    if (isValid(email, password)) {
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "email": email,
                    "password": password,
                },
            });

            if (response.ok) {
                const token = await response.text();
                localStorage.setItem("authToken", token);
                console.log("Token armazenado:", localStorage.getItem("authToken"));
              
                window.location.href = "/frontend-pi/HomeLogon/HomeLogon.html"; // Redirecionar após login
            } else if (response.status === 401) {
                showErrorMessage("E-mail ou senha incorretos.");
            } else {
                showErrorMessage("Erro ao autenticar. Tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao tentar fazer login:", error);
            showErrorMessage("Erro ao se conectar ao servidor.");
        }
    }
}

function hideErrorMessage() {
    const messageBox = document.getElementById("messageBox");
    messageBox.style.display = "none"; // Oculta a mensagem
}

