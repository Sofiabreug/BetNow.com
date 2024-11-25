src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
crossorigin="anonymous"

// Esconder card 'Nenhum evento ainda...'
function hideNoneEvent() {
    const ef = document.getElementById("eventsFinishin");
    const mbe = document.getElementById("mostBetEvents");

    if(ef.length > 0 || mbe.length > 0){
        hideNone();
    }
}

function hideNone(){
    var nn = document.getElementById("none");
    nn.style.display = "none";
}

// Eventos em destaque (finalizando)
async function getEventsFinishing() {
    try {
        const response = await fetch('http://localhost:3000/getEventsFinishing', {
            method: 'GET',
        });
        const events = await response.json();
        console.log("Eventos próximos de finalizar:", events);
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
    }
}

async function displayEventsFinishing() {
    const eventList = document.getElementById("eventsFinishing");
    const events = await getFinishingEvents();

    eventList.innerHTML = "";

    events.forEach(evento => {
        const card = document.createElement("div");
        card.classList.add("card", "text-center");
        card.style.width = "17rem";

        card.innerHTML = `
            <div class="card-body" type="button" data-bs-toggle="modal" data-bs-target="#entrarModal">
                <img src="${updateImage()}" class="img" id="eventImage" style="opacity: 20%;">
                <div class="card-img-overlay">
                    <h5 class="card-title">${evento.title}</h5>
                </div>
            </div>
        `;

        eventList.appendChild(card);
    });
}

// Eventos mais apostados
async function getMostBetEvents() {
    try {
        const response = await fetch('http://localhost:3000/getMostBetEvents', {
            method: 'GET',
        });
        const events = await response.json();
        console.log("Eventos próximos de finalizar:", events);
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
    }
}

async function displayMostBetEvents() { 
    const eventList = document.getElementById("mostBetEvents");
    const events = await getFinishingEvents();

    eventList.innerHTML = "";

    events.forEach(evento => {
        const card = document.createElement("div");
        card.classList.add("card", "text-center");
        card.style.width = "17rem";

        card.innerHTML = `
            <div class="card-body" type="button" data-bs-toggle="modal" data-bs-target="#entrarModal">
                <img src="${updateImage()}" class="img" id="eventImage" style="opacity: 20%;">
                <div class="card-img-overlay">
                    <h5 class="card-title">${evento.title}</h5>
                </div>
            </div>
        `;

        eventList.appendChild(card);
    });
}

// Função para atualizar a imagem com base na categoria selecionada
function updateImage() {
    const categoryImages = {
        sport: "https://www.institutoclaro.org.br/educacao/wp-content/uploads/sites/2/2013/11/planodeaulaesporte_1840.jpg",
        culture: "https://www.jornaldotrabalhador.com.br/wp-content/uploads/2019/01/cultura-696x338.png",
        technology: "https://anbc.org.br/wp-content/uploads/2024/02/tecnologia.webp",
        economy: "https://static.portaldaindustria.com.br/portaldaindustria/noticias/media/imagem_plugin/shutterstock_rLcCBI9.jpg",
        eSport: "https://img.odcdn.com.br/wp-content/uploads/2022/11/esports_competicao.jpg"
    };
    
    const category = document.getElementById("categorySelect").value;
    const imageSrc = categoryImages[category];
    document.getElementById("eventImage").src = imageSrc;
}

// Filtrar por categoria
function filterCategory(){
    const categ = document.getElementById("categorySelect").value;

    if(categ === 'sport' || categ === 'technology' || categ === 'culture' || categ === 'economy' || categ === 'esport'){
        window.location.href = "Categorias.html";
    }
}

// Buscar os eventos da search bar e mostrar
async function searchEvent() {

    const keyword = document.getElementById('search').value;
    if(!keyword){
        return;
    }
    
    const response = await fetch(`http://localhost/searchEvent/${keyword}`, {
        method: 'GET',
    });
    
    const eventosCards = document.querySelector('.cards');
    eventosCards.innerHTML = '';

    if (!response.ok) {
        function showAlert() {
            const alertContainer = document.getElementById('alert-container');
            alertContainer.innerHTML = `
                <div class="alert alert-custom alert-dismissible fade show" role="alert" style="position: fixed; top: 10px; right: 10px; z-index: 1050;">
                    Nenhum evento encontrado.
                </div>
            `;

            setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) alert.remove();
            }, 5000);
        }
        showAlert();
    }

    const eventos = await response.json();
    displaySearchEvents(eventosCards, eventos);
}

function displaySearchEvents(eventList, events){
    const eventList = document.getElementById("search");
    const events = searchEvent();

    eventList.innerHTML = "";

    events.forEach(evento => {
        const card = document.createElement("div");
        card.classList.add("card", "text-center");
        card.style.width = "17rem";

        const imageSrc = updateImage(evento.category);

        card.innerHTML = `
            <div class="card-body">
                <img src="${imageSrc}" class="img" id="eventImage" style="opacity: 20%;">
                <div class="card-img-overlay">
                    <h5 class="card-title">${evento.title}</h5>
                </div>
            </div>
        `;

        eventList.appendChild(card);
    });
}

// Login
function isValid(email, password) {
    email = email.trim();
    password = password.trim();

    if (!email && !password) {
        showErrorMessage("Preencha os campos.");
        return false;
    }

    if (!email) {
        showErrorMessage("Informe o seu e-mail.");
        return false;
    }

    if (!password) {
        showErrorMessage("Informe a sua senha.");
        return false;
    }

    return true;
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
                localStorage.setItem("authToken", token); // Salvar o token
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

window.addEventListener("load", () => {
    hideNoneEvent();
    displayEventsFinishing();
    displayMostBetEvents();
});