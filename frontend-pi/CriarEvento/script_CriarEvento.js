document.getElementById('eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Captura os valores dos campos
  const title = document.getElementById('eventTitle').value.trim();
  const description = document.getElementById('eventDescription').value.trim();
  const category = document.getElementById('category').value.trim();
  const startDate = document.getElementById('eventStartDate').value;
  const endDate = document.getElementById('eventEndDate').value;
  const startTime = document.getElementById('eventStartTime').value;
  const endTime = document.getElementById('eventEndTime').value;
  const eventDate = document.getElementById('eventDate').value;
  const eventTime = document.getElementById('eventTime').value;
  const ticketValue = parseFloat(document.getElementById('quotaValue').value);


  // Validação dos campos
  if (!title || !description || !category || !startDate || !endDate || !startTime || !endTime || !eventDate || !eventTime || !ticketValue) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  if (title.length > 50) {
    alert('O título deve conter no máximo 50 caracteres.');
    return;
  }

  if (description.length > 150) {
    alert('A descrição deve conter no máximo 150 caracteres.');
    return;
  }

  if (Number(ticketValue) <= 0) {
    alert('O valor do ticket deve ser maior que zero.');
    return;
  }

  const fullStartDate = `${startDate}T${startTime}`;
  const fullEndDate = `${endDate}T${endTime}`;
  const fullEventDate = `${eventDate}T${eventTime}`;

  // Preparação do corpo da requisição
  const requestBody = {
    title,
    description,
    category,
    startDate: fullStartDate,
    endDate: fullEndDate,
    eventDate: fullEventDate,
    ticketValue,
    creatorToken: "KGNT2VUL55403KHBITEUQVPB53EWCUM4" // Substitua por um token válido
  };

  try {
    // Faz a requisição ao backend
    const response = await fetch('http://localhost:3000/AddNewEvent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Tratamento da resposta do backend
    if (response.ok) {
      const message = await response.text();
      alert(`Evento criado com sucesso: ${message}`);
    } else {
      const errorMessage = await response.text();
      console.error(`Erro do backend: ${errorMessage}`);
      alert(`Erro ao criar o evento: ${errorMessage}`);
    }
  } catch (error) {
    // Tratamento de erros de conexão ou de execução
    console.error('Erro ao criar o evento:', error);
    alert('Erro ao criar o evento. Verifique sua conexão com o servidor e tente novamente.');
  }
});
