-- Tabela ACCOUNTS
CREATE TABLE ACCOUNTS (
    accountId NUMBER PRIMARY KEY,
    completeName VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL UNIQUE,
    password VARCHAR2(100) NOT NULL,
    birthDate DATE NOT NULL,
    token VARCHAR2(32) NOT NULL
);

-- Tabela EVENTS
CREATE TABLE EVENTS (
    eventId NUMBER PRIMARY KEY,
    title VARCHAR2(50) NOT NULL,
    description VARCHAR2(150) NOT NULL,
    ticketValue NUMBER(10, 2) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    eventDate DATE NOT NULL,
    creatorToken VARCHAR2(32) NOT NULL,
    event_status VARCHAR2(20) 
    validation_status VARCHAR2(20) DEFAULT 'pendente',
    verdict VARCHAR2(3) 
);

-- Tabela WALLET
CREATE TABLE WALLET (
    walletId NUMBER PRIMARY KEY,
    accountId NUMBER NOT NULL,
    balance NUMBER(10, 2) DEFAULT 0.00,
    creditCardNumber VARCHAR2(20) NOT NULL,
    FOREIGN KEY (accountId) REFERENCES ACCOUNTS(accountId)
);

-- Tabela BETS
CREATE TABLE BETS (
    id NUMBER PRIMARY KEY,
    accountId NUMBER NOT NULL,
    eventId NUMBER NOT NULL,
    amountBet NUMBER NOT NULL,
    betChoice VARCHAR2(10) CHECK (betChoice IN ('sim', 'não', 'nao')), -- Limita as escolhas para 'sim' ou 'não'
    FOREIGN KEY (accountId) REFERENCES ACCOUNTS(accountId),
    FOREIGN KEY (eventId) REFERENCES EVENTS(eventId)
);

-- Tabela MODERATORS
CREATE TABLE MODERATORS (
    moderatorId NUMBER PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    password VARCHAR2(100) NOT NULL
);

-- Tabela TRANSACTIONS
CREATE TABLE TRANSACTIONS (
    transactionId NUMBER PRIMARY KEY,
    walletId NUMBER NOT NULL,
    amount NUMBER NOT NULL,
    transaction_type VARCHAR2(10) CHECK (transaction_type IN ('ganho', 'perda', 'deposito','pagamento de aposta')), 
    transaction_date DATE DEFAULT SYSDATE,
    FOREIGN KEY (walletId) REFERENCES WALLET(walletId)
);

-- Criação das sequências para IDs automáticos
CREATE SEQUENCE SEQ_TRANSACTIONS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_ACCOUNTS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_EVENTS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_BETS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_WALLET START WITH 1 INCREMENT BY 1;

-- Consultas para verificar criação das tabelas e sequências


INSERT INTO MODERATORS (moderatorId, name, email, password)
VALUES (5, 'João', 'joao.silva1@exemplo.com', 'senha1234');