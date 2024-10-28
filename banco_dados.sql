-- Tabela ACCOUNTS
CREATE TABLE ACCOUNTS (
    id NUMBER PRIMARY KEY,
    completeName VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL UNIQUE,
    password VARCHAR2(100) NOT NULL,
    birthDate DATE NOT NULL,
    token VARCHAR2(32) NOT NULL
  
);

COMMIT;
SELECT * FROM ACCOUNTS;
DROP TABLE ACCOUNTS;
DESCRIBE ACCOUNTS;

-- Tabela EVENTS
CREATE TABLE EVENTS (
    EVENTID INTEGER ,
    TITLE VARCHAR2(50) NOT NULL,
    DESCRIPTION VARCHAR2(150) NOT NULL,
    TICKETVALUE NUMBER(10, 2) NOT NULL,
    STARTDATE DATE NOT NULL,
    STARTTIME VARCHAR2(8) NOT NULL,        -- 'HH24:MI:SS' formato de hora
    ENDDATE DATE NOT NULL,
    ENDTIME VARCHAR2(8) NOT NULL,
    EVENTDATE DATE NOT NULL,
    EVENTTIME VARCHAR2(8) NOT NULL,
    CREATORTOKEN VARCHAR2(32) NOT NULL,
    EVENT_STATUS VARCHAR2(20) DEFAULT 'não iniciado',
    VALIDATION_STATUS VARCHAR2(20) DEFAULT 'pendente', -- Pendência inicial até avaliação
    VERDICT VARCHAR2(3)                               -- Sim ou Não, após avaliação
);
--- Tabela Wallet
CREATE TABLE WALLET (
    walletId VARCHAR(50) PRIMARY KEY,
    accountId integer not null,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    creditCardNumber VARCHAR(20) NOT NULL,  
    FOREIGN KEY (accountId) REFERENCES ACCOUNTS(id)
);

-- Tabela BETS
CREATE TABLE BETS (
    id INTEGER PRIMARY KEY,
    accountId INTEGER NOT NULL, -- Referência ao token do apostador
    eventId INTEGER NOT NULL, -- Referência ao ID do evento
    amountBet NUMBER NOT NULL,
    betChoice VARCHAR2(10) CHECK (betChoice IN ('sim', 'não')), -- Limita as escolhas possíveis
    FOREIGN KEY (accountId) REFERENCES ACCOUNTS(accountId), -- Assumindo que 'ACCOUNTS' tem um campo 'token'
   FOREIGN KEY (eventId) REFERENCES EVENTS(eventId) -- Assumindo que a tabela 'EVENTS' existe
);

-- Tabela MODERATORS
CREATE TABLE MODERATORS (
    moderatorId INTEGER PRIMARY KEY, 
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    password VARCHAR2(100)  NOT NULL
  
);
CREATE TABLE TRANSACTIONS (
    transactionId NUMBER PRIMARY KEY,
    accountId NUMBER NOT NULL,
    eventId NUMBER NOT NULL,
    amount NUMBER NOT NULL,
    transaction_type VARCHAR2(10) CHECK (transaction_type IN ('ganho', 'perda')),
    transaction_date DATE DEFAULT SYSDATE,
    FOREIGN KEY (accountId) REFERENCES WALLET(accountId),
    FOREIGN KEY (eventId) REFERENCES EVENTS(eventId)
);

-- Sequ�ncia para IDs
CREATE SEQUENCE SEQ_TRANSICTIONS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_ACCOUNTS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_EVENTS START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_BETS START WITH 1 INCREMENT BY 1;