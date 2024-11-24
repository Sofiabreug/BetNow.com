
function redirectToCategory(category) {
    window.location.href = `categories.html?category=${encodeURIComponent(category)}`;
}

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
        const response = await fetch('http://localhost:3000/getEventsFinishing');
        const events = await response.json();
        console.log("Eventos próximos de finalizar:", events);
        return events; // Retorna os eventos aqui
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        return []; // Retorna um array vazio em caso de erro
    }
}

async function displayEventsFinishing() {
    const eventList = document.getElementById("eventsFinishing");
    const events = await getEventsFinishing();

    // Limita os eventos a no máximo 5
    const limitedEvents = events.slice(0, 5);

    eventList.innerHTML = "";

    // Use o limitedEvents para iterar
    limitedEvents.forEach(evento => {
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

window.onload = function() {
    displayEventsFinishing();
};

// Eventos mais apostados
async function getMostBetEvents() {
    try {
        const response = await fetch('http://localhost:3000/getMostBetEvents');
        const events = await response.json();
        console.log("Eventos próximos de finalizar:", events);
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
    }
}

async function displayMostBetEvents() { 
    const eventList = document.getElementById("mostBetEvents");
    const events = await getMostBetEvents();

    // Limita os eventos a no máximo 5
    const limitedEvents = events.slice(0, 5);

    eventList.innerHTML = "";

    limitedEvents.forEach(evento => {
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

window.onload = function() {
        displayMostBetEvents();
};

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
        window.location.href = "categories.html";
    }
}

// Buscar
async function searchEvent(keyword) {
    try {
        // Faz a requisição com a palavra-chave no cabeçalho
        const response = await fetch("http://localhost:3000/searchEvent", {
            method: "GET",
            headers: {
                "keyword": keyword // Envia a palavra-chave
            }
        });

        // Verifica o status da resposta
        if (response.ok) {
            const events = await response.json();
            console.info("Eventos encontrados:", events);
            // Aqui você pode implementar lógica para exibir os eventos
        } else if (response.status === 404) {
            console.info("Nenhum evento encontrado com essa palavra-chave.");
        } else {
            console.error("Erro ao buscar eventos:", response.statusText);
        }
    } catch (error) {
        console.error("Erro ao fazer a requisição:", error);
    }
}

src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
crossorigin="anonymous"
