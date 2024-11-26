// Obtém o ID do evento da URL
const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId'); // Pega o eventId

if (!eventId) {
  alert('Nenhum evento especificado.');
  window.location.href = '../HomeLogon/HomeLogon.html'; // Redireciona para a home
}

let selectedChoice = null; // Variável para armazenar a escolha do usuário

// Função para carregar os detalhes do evento
async function loadEventDetails() {
  try {
    const response = await fetch(`http://localhost:3000/getEventDetails?eventId=${eventId}`);
    if (!response.ok) throw new Error(await response.text());

    const event = await response.json();

    // Atualiza os elementos da página com os dados do evento
    document.getElementById('eventTitle').textContent = `Evento: ${event.title}`;
    document.getElementById('eventQuestion').textContent = event.description;
  } catch (error) {
    console.error('Erro ao carregar evento:', error);
    alert('Erro ao carregar o evento. Tente novamente mais tarde.');
    window.location.href = '../HomeLogon/HomeLogon.html'; // Redireciona para a home
  }
}

// Função para alternar entre os botões "SIM" e "NÃO"
function setupChoiceButtons() {
  document.querySelectorAll('.btn-choice').forEach(button => {
    button.addEventListener('click', () => {
      // Remove a seleção de todos os botões
      document.querySelectorAll('.btn-choice').forEach(btn => btn.classList.remove('selected'));

      // Adiciona a seleção ao botão clicado
      button.classList.add('selected');

      // Atualiza a escolha selecionada
      selectedChoice = button.dataset.choice;
    });
  });
}

// Função para realizar a aposta
async function placeBet() {
  const betValue = document.getElementById('betValue').value;

  if (!selectedChoice) {
    alert('Por favor, escolha entre SIM ou NÃO.');
    return;
  }

  if (!betValue || betValue <= 0) {
    alert('Por favor, insira um valor válido para a aposta.');
    return;
  }

  const payload = {
    eventId,
    betChoice: selectedChoice,
    betValue,
    email: 'user@example.com', // Substitua pelo email correto do usuário logado
  };

  console.log('Payload enviado:', payload); // Adicione isso para verificar o que está sendo enviado

  try {
    const response = await fetch('http://localhost:3000/BetOnEvents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert('Aposta realizada com sucesso!');
      window.location.href = '../HomeLogon/HomeLogon.html'; // Redireciona para a home
    } else {
      const error = await response.text();
      alert(`Erro ao realizar a aposta: ${error}`);
    }
  } catch (error) {
    console.error('Erro ao realizar aposta:', error);
    alert('Erro ao realizar a aposta. Tente novamente mais tarde.');
  }
}


// Adiciona o evento de clique no botão "Apostar"
document.getElementById('btnApostar').addEventListener('click', placeBet);

// Chama a função ao carregar a página
window.onload = () => {
  loadEventDetails();
  setupChoiceButtons();
};
