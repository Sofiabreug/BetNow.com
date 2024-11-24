
document.getElementById('eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('eventTitle').value;
  const description = document.getElementById('eventDescription').value;
  const category = document.getElementById('category').value;
  const startDate = document.getElementById('eventStartDate').value;
  const endDate = document.getElementById('eventEndDate').value;
  const startTime = document.getElementById('eventStartTime').value;
  const endTime = document.getElementById('eventEndTime').value;
  const eventDate = document.getElementById('eventDate').value;
  const eventTime = document.getElementById('eventTime').value;
  const ticketValue = document.getElementById('quotaValue').value;

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
    creatorToken: "TOKEN_DO_CRIADOR"
  };

  try {
    const response = await fetch('http://localhost:3000/AddNewEvent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const message = await response.text();
      alert(`Sucesso: ${message}`);
    } else {
      const errorMessage = await response.text();
      alert(`Erro: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao criar o evento. Tente novamente mais tarde.');
  }
});
