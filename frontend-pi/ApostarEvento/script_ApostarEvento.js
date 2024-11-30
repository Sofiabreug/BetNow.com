// Obtém o ID do evento da URL
const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId');

if (!eventId) {
  showConfirmationPopup('Erro', 'Nenhum evento especificado.');
  setTimeout(() => {
    window.location.href = '../HomeLogon/HomeLogon.html';
  }, 2000);
}

let selectedChoice = null;

// Carrega detalhes do evento
async function loadEventDetails() {
  try {
    const response = await fetch(`http://localhost:3000/getEventDetails?eventId=${eventId}`);
    if (!response.ok) throw new Error(await response.text());

    const event = await response.json();
    document.getElementById('eventTitle').textContent = `Evento: ${event.title}`;
    document.getElementById('eventQuestion').textContent = event.description;
    document.getElementById('ticketValue').textContent = `Valor da aposta: R$ ${parseFloat(event.ticketValue).toFixed(2)}`;
  } catch (error) {
    showConfirmationPopup('Erro', 'Não foi possível carregar o evento.');
    setTimeout(() => {
      window.location.href = '../HomeLogon/HomeLogon.html';
    }, 2000);
  }
}

// Configura botões de escolha
function setupChoiceButtons() {
  document.querySelectorAll('.btn-choice').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.btn-choice').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      selectedChoice = button.dataset.choice;
    });
  });
}

// Realiza aposta
async function placeBet() {
  const token = localStorage.getItem('authToken');
  const betValue = parseFloat(document.getElementById('betValue').value);

  if (!selectedChoice) {
    showConfirmationPopup('Erro', 'Escolha SIM ou NÃO antes de apostar.');
    return;
  }

  if (isNaN(betValue) || betValue <= 0) {
    showConfirmationPopup('Erro', 'Insira um valor válido.');
    return;
  }

  const payload = { eventId, betChoice: selectedChoice, betValue, token };

  try {
    const response = await fetch('http://localhost:3000/BetOnEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      showConfirmationPopup('Sucesso!', 'Aposta realizada com sucesso!');
      setTimeout(() => {
        window.location.href = '../HomeLogon/HomeLogon.html';
      }, 2000);
    } else {
      const error = await response.text();
      showConfirmationPopup('Erro', `Erro: ${error}`);
    }
  } catch (error) {
    showConfirmationPopup('Erro', 'Erro ao se conectar ao servidor.');
  }
}

// Exibe popup de confirmação
function showConfirmationPopup(title, message) {
  const popup = document.getElementById('confirmationPopup');
  document.getElementById('popupTitle').textContent = title;
  document.getElementById('popupMessage').textContent = message;
  popup.classList.remove('d-none');
}

// Fecha popup
function closeConfirmationPopup() {
  document.getElementById('confirmationPopup').classList.add('d-none');
}

// Configurações iniciais
window.onload = () => {
  loadEventDetails();
  setupChoiceButtons();
  document.getElementById('btnApostar').addEventListener('click', placeBet);
  document.getElementById('btnDeletar').addEventListener('click', deleteEvent);
};




