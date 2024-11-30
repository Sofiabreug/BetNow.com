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
  const token = localStorage.getItem("authToken");

  // Elementos de erro
  const errors = {
    titleError: document.getElementById('eventTitleError'),
    descriptionError: document.getElementById('eventDescriptionError'),
    categoryError: document.getElementById('categoryError'),
    startDateError: document.getElementById('eventStartDateError'),
    endDateError: document.getElementById('eventEndDateError'),
    eventDateError: document.getElementById('eventDateError'),
    quotaValueError: document.getElementById('quotaValueError'),
    timeError: document.getElementById('eventTimeError'),
  };

  // Limpa mensagens de erro antigas
  Object.values(errors).forEach((errorField) => {
    errorField.textContent = '';
    errorField.classList.add('d-none');
  });

  // Validação dos campos
  let valid = true;

  if (!title || title.length > 50) {
    errors.titleError.textContent = 'O título deve conter no máximo 50 caracteres.';
    errors.titleError.classList.remove('d-none');
    valid = false;
  }

  if (!description || description.length > 150) {
    errors.descriptionError.textContent = 'A descrição deve conter no máximo 150 caracteres.';
    errors.descriptionError.classList.remove('d-none');
    valid = false;
  }

  if (!category) {
    errors.categoryError.textContent = 'Por favor, selecione uma categoria.';
    errors.categoryError.classList.remove('d-none');
    valid = false;
  }

  if (!startDate || !endDate || !startTime || !endTime) {
    errors.timeError.textContent = 'Por favor, preencha todas as informações de data e horário.';
    errors.timeError.classList.remove('d-none');
    valid = false;
  }

  if (!eventDate || !eventTime) {
    errors.eventDateError.textContent = 'Por favor, preencha a data e hora do evento.';
    errors.eventDateError.classList.remove('d-none');
    valid = false;
  }

  if (isNaN(ticketValue) || ticketValue <= 0) {
    errors.quotaValueError.textContent = 'O valor do ticket deve ser maior que zero.';
    errors.quotaValueError.classList.remove('d-none');
    valid = false;
  }

  if (!valid) return; // Se algum erro for encontrado, interrompe o envio do formulário

  const fullStartDate = `${startDate}T${startTime}`;
  const fullEndDate = `${endDate}T${endTime}`;
  const fullEventDate = `${eventDate}T${eventTime}`;

  
  const requestBody = {
    title,
    description,
    category,
    startDate: fullStartDate,
    endDate: fullEndDate,
    eventDate: fullEventDate,
    ticketValue,
    creatorToken: token, 
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
      showConfirmationPopup('Sucesso', `Evento criado com sucesso: ${message}`);
      document.getElementById('eventForm').reset(); // Limpa o formulário após sucesso
    } else {
      const errorMessage = await response.text();
      showConfirmationPopup('Erro', `Erro ao criar o evento: ${errorMessage}`);
    }
  } catch (error) {
    // Tratamento de erros de conexão ou execução
    console.error('Erro ao criar o evento:', error);
    showConfirmationPopup('Erro', 'Erro ao criar o evento. Verifique sua conexão com o servidor e tente novamente.');
  }
});
