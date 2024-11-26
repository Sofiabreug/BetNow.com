// Função para alternar os campos do cartão de crédito
function toggleCardFields() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const cardFields = document.getElementById('cardFields');
  
    if (paymentMethod === 'credit-card') {
      cardFields.classList.remove('d-none');
    } else {
      cardFields.classList.add('d-none');
    }
  }
  // Função para alternar os campos do saque entre banco e Pix
  function toggleWithdrawFields() {
    const accountType = document.getElementById('accountType').value;
    const bankFields = document.getElementById('bankFields');
   
  
    
      bankFields.classList.remove('d-none'); // Mostra os campos bancários
      
    
  }
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
  
  function formatCreditCard(input) {
    // Remove qualquer caractere que não seja número
    let value = input.value.replace(/\D/g, '');
  
    // Adiciona o hífen a cada 4 números
    if (value.length > 12) {
      value = value.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
    } else if (value.length > 8) {
      value = value.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (value.length > 4) {
      value = value.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
  
    // Atribui o valor formatado ao campo
    input.value = value;
  }
  // Validação do cartão de crédito
  // Função para adicionar créditos
  async function mandarPBackend() {
    const valor = parseFloat(document.getElementById('addCreditsAmount').value); 
    const cartao = document.getElementById('cardNumber').value.trim();
  
    // Referências para os campos de erro
    const valorError = document.getElementById('addCreditsError');
    const metodoError = document.getElementById('paymentMethodError');
    const cartaoError = document.getElementById('cardNumberError');
  
    // Limpando mensagens antigas
    valorError.classList.add('d-none');
    metodoError.classList.add('d-none');
    cartaoError.classList.add('d-none');
  
    // Validações
    let valid = true;
  
    if (isNaN(valor) || valor <= 0) {
      valorError.textContent = 'Por favor, insira um valor válido.';
      valorError.classList.remove('d-none');
      valid = false;
    }
  
    const paymentMethod = document.getElementById('paymentMethod').value;
    if (!paymentMethod) {
      metodoError.textContent = 'Selecione um método de pagamento.';
      metodoError.classList.remove('d-none');
      valid = false;
    }
  
    if (paymentMethod === 'credit-card' && (!cartao || cartao.length > 19)) {
      cartaoError.textContent = 'O número do cartão deve ter 16 números.';
      cartaoError.classList.remove('d-none');
      valid = false;
    }
    
  
    if (!valid) {
      return; // Sai da função se houver erros
    }
  
    const token = localStorage.getItem("authToken");
    const body = {
      amount: valor.toFixed(2),
      creditCardNumber: cartao,
    };
  
    try {
      const response = await fetch('http://localhost:3000/addFunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
        },
        body: JSON.stringify(body),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro desconhecido.');
      }
  
      // Tente obter a resposta JSON
      const data = await response.json();
      console.log("Resposta do servidor:", data);  // Verifique a estrutura da resposta
  
      if (data.newBalance !== undefined) {
        showConfirmationPopup(
          "Fundos adicionados",
          `Você depositou R$${valor.toFixed(2)} ao saldo. Novo saldo: R$${data.newBalance.toFixed(2)}`
        );
      } else {
        throw new Error("Saldo não retornado corretamente.");
      }
  
    } catch (error) {
      console.error("Erro capturado:", error.message);
      showConfirmationPopup("Erro", "Houve um erro ao adicionar os fundos. Tente novamente.");
    }
  }
  
  
  // Função para validar e realizar o saque
  async function mandarProBackend() {
    const valor = parseFloat(document.getElementById('withdrawAmount').value); // Garante que o valor seja numérico.
    const banco = document.getElementById('bankName').value.trim();
    const agencia = document.getElementById('agencyNumber').value.trim();
    const conta = document.getElementById('accountNumber').value.trim();

    // Validações básicas
    const valorError = document.getElementById('withdrawAmountError');
    const bancoError = document.getElementById('bankNameError');
    const agenciaError = document.getElementById('agencyNumberError');
    const contaError = document.getElementById('accountNumberError');

    // Limpando mensagens antigas
    valorError.classList.add('d-none');
    bancoError.classList.add('d-none');
    agenciaError.classList.add('d-none');
    contaError.classList.add('d-none');

    // Validações
    let valid = true;

    // Validação de valor
    if (isNaN(valor) || valor <= 0) {
        valorError.textContent = 'Por favor, insira um valor válido para o saque.';
        valorError.classList.remove('d-none');
        valid = false;
    }

    // Validação de nome do banco
    if (!banco) {
        bancoError.textContent = 'O nome do banco é obrigatório.';
        bancoError.classList.remove('d-none');
        valid = false;
    }

    // Validação de número da agência
    if (!agencia || agencia.length !== 4) {
        agenciaError.textContent = 'Número da agência deve ter exatamente 4 dígitos.';
        agenciaError.classList.remove('d-none');
        valid = false;
    }

    // Validação de número da conta
    if (!conta || conta.length < 6 || conta.length > 7) {
        contaError.textContent = 'Número da conta deve ter entre 6 e 7 dígitos.';
        contaError.classList.remove('d-none');
        valid = false;
    }

    // Se houver algum erro, retorna para não continuar
    if (!valid) {
        return;
    }

    const token = LocalStorage.getItem("authToken"); // Substitua pelo valor real do token.

    const body = {
        amount: valor.toFixed(2), // Garante o envio como string no formato correto.
        banco: banco,
        agencia: agencia,
        conta: conta
    };

    try {
        const response = await fetch('http://localhost:3000/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                token: token
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro desconhecido.");
        }

        const data = await response.json();

        // Exibir a popup de confirmação com as informações do saque
        showConfirmationPopup(
            "Saque Realizado",
            `Você sacou R$${valor} com uma taxa de R$${data.fee} Saldo atual: R$${data.newBalance}`
        );
    } catch (error) {
        console.error("Erro capturado:", error.message);
        showConfirmationPopup("Erro", error.message || "Houve um erro ao realizar o saque. Tente novamente.");
    }
}

  
  
  const historyBoxPurchase = document.getElementById('creditPurchaseHistory');
  const historyBoxUsage = document.getElementById('creditUsageHistory');
  
  // Função de rolagem para carregar mais itens
  function loadMoreItems(historyBox, data, startIndex) {
    const maxScrollHeight = historyBox.scrollHeight;
    const scrollPosition = historyBox.scrollTop + historyBox.clientHeight;
  
    if (scrollPosition >= maxScrollHeight) {
      const nextItems = data.slice(startIndex, startIndex + itemsPerPage);
      historyBox.innerHTML += nextItems.map(item => `<p>${item}</p>`).join('');
      startIndex += nextItems.length;
    }
  }
  
  // Adicionar evento de rolagem no histórico de compras
  historyBoxPurchase.addEventListener('scroll', () => {
    loadMoreItems(historyBoxPurchase, creditPurchaseData, currentPagePurchase * itemsPerPage);
  });
  
  // Adicionar evento de rolagem no histórico de uso de créditos
  historyBoxUsage.addEventListener('scroll', () => {
    loadMoreItems(historyBoxUsage, creditUsageData, currentPageUsage * itemsPerPage);
  });
  // Função para buscar o saldo e alternar a exibição
  async function toggleBalance() {
    const token = localStorage.getItem("authToken"); // Substitua pelo token real
    const balanceElement = document.querySelector('.valor');
    const eyeIcon = document.querySelector('.eye-button i');
  
    if (eyeIcon.classList.contains('fa-eye-slash')) {
      try {
        const response = await fetch('http://localhost:3000/checkBalance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            token: token,
          },
        });
  
        if (!response.ok) {
          throw new Error('Erro na resposta do servidor.');
        }
  
        const result = await response.json();
  
        if (result.balance === undefined) {
          throw new Error('Campo "balance" ausente na resposta.');
        }
  
        // Atualiza o saldo
        balanceElement.textContent = result.balance.toFixed(2).replace('.', ',');
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
      } catch (error) {
        console.error('Erro ao buscar saldo:', error);
        alert('Erro ao buscar saldo. Tente novamente mais tarde.');
      }
    } else {
      // Oculta o saldo
      balanceElement.textContent = '••••••••';
      eyeIcon.classList.remove('fa-eye');
      eyeIcon.classList.add('fa-eye-slash');
    }
  }
  
    // Função para buscar o histórico de compras de crédito
  
  async function getCreditPurchasesHistory() {
    const token = localStorage.getItem("authToken"); // Token de exemplo
  
    if (!token) {
        alert('Token não encontrado.');
        return;
    }
  
    try {
        const response = await fetch('http://localhost:3000/getCreditPurchasesHistory', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            }
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || 'Erro ao buscar histórico de compras.');
            return;
        }
  
        const data = await response.json();
        const purchases = data.purchases;
  
        const purchaseHistoryContainer = document.getElementById('creditPurchaseHistory');
        purchaseHistoryContainer.innerHTML = ''; // Limpa a área de exibição
  
        if (!purchases || purchases.length === 0) {
            purchaseHistoryContainer.innerHTML = '• Nenhuma compra efetuada no momento.';
            return;
        }
  
        purchases.forEach(purchase => {
            const purchaseElement = document.createElement('div');
            purchaseElement.innerHTML = `
                <p><strong>Transaction ID:</strong> ${purchase.TRANSACTIONID}</p>
                <p><strong>Amount:</strong> R$ ${purchase.AMOUNT}</p>
                <p><strong>Date:</strong> ${new Date(purchase.TRANSACTION_DATE).toLocaleDateString()}</p>
            `;
            purchaseHistoryContainer.appendChild(purchaseElement);
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de compras de crédito:', error);
        alert('Erro ao buscar histórico de compras: ' + error.message);
    }
  }
  
  // Função para buscar o histórico de apostas
  async function getBettingHistory() {
    const token = localStorage.getItem("authToken"); 
  
    if (!token) {
        alert('Token não encontrado.');
        return;
    }
  
    try {
        const response = await fetch('http://localhost:3000/getBettingHistory', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            }
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || 'Erro ao buscar histórico de apostas.');
            return;
        }
  
        const data = await response.json();
        const bets = data.bets;
  
        const bettingHistoryContainer = document.getElementById('creditUsageHistory');
        bettingHistoryContainer.innerHTML = ''; // Limpa a área de exibição
  
        if (!bets || bets.length === 0) {
            bettingHistoryContainer.innerHTML = '• Nenhuma aposta feita no momento.';
            return;
        }
  
        bets.forEach(bet => {
            const betElement = document.createElement('div');
            betElement.innerHTML = `
                <p><strong>Transaction ID:</strong> ${bet.TRANSACTIONID}</p>
                <p><strong>Amount:</strong> R$ ${bet.AMOUNT}</p>
                <p><strong>Date:</strong> ${new Date(bet.TRANSACTION_DATE).toLocaleDateString()}</p>
            `;
            bettingHistoryContainer.appendChild(betElement);
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de apostas:', error);
        alert('Erro ao buscar histórico de apostas: ' + error.message);
    }
  }
  
  // Vincular as funções aos botões
  window.onload = function () {
    document.getElementById('verComprasBtn').addEventListener('click', getCreditPurchasesHistory);
    document.getElementById('verApostasBtn').addEventListener('click', getBettingHistory);
  };
  