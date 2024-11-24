
// Exemplo de como carregar os dados dinamicamente
const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId'); // Obtém o ID do evento da URL
const eventTitle = params.get('eventTitle');
const eventQuestion = params.get('eventQuestion');

// Define os dados no DOM
if (eventTitle) document.getElementById('eventTitle').textContent = eventTitle;
if (eventQuestion) document.getElementById('eventQuestion').textContent = eventQuestion;

async function placeBet(choice) {
  const betValue = document.getElementById('betValue').value;

  if (!betValue || betValue <= 0) {
    alert('Por favor, insira um valor válido para a aposta.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/BetOnEvents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'eventId': eventId,
        'betChoice': choice,
        'betValue': betValue,
        'email': 'user@example.com', // Substitua pelo email do usuário logado
      },
    });

    if (response.ok) {
      alert('Aposta realizada com sucesso!');
      window.location.href = 'HomeLogon.html'; // Redireciona de volta para a home
    } else {
      const error = await response.text();
      alert(`Erro ao realizar a aposta: ${error}`);
    }
  } catch (error) {
    console.error('Erro ao realizar aposta:', error);
    alert('Erro ao realizar a aposta. Tente novamente mais tarde.');
  }
}
