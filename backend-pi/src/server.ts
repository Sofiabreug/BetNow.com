import express from "express";
import { Request, Response, Router } from "express";
import { AccountsHandler } from "./accounts/accounts";

const port = 3000; 
const server = express();
const routes = Router();

// Definir as rotas
// A rota tem um verbo/método HTTP (GET, POST, PUT, DELETE)
routes.get('/', (req: Request, res: Response) => {
    res.status(403).send('Acesso não permitido.'); // Mudei para res.status(403)
});

// Exemplo de rota para criação de conta
routes.post('/signUp', AccountsHandler.createAccountRoute); // Supondo que você tenha essa função

// Rota de login
routes.post('/login', AccountsHandler.loginHandler); // Adicionando a rota de login

//Rota de Criação de evento
routes.post('/AddNewEvent', AccountsHandler.AddNewEvent); // Adicionando a rota de evento

//Rota de Avaliar evento
routes.put('/evaluateEvent', AccountsHandler.evaluateEvent);

//Rota para deletar evento
routes.delete('/deleteEvent', AccountsHandler.deleteEvent);

//Rota para adicionar fundos à carteira do usuário 
routes.post('/addFunds', AccountsHandler.addFunds);

server.use(express.json()); // Para lidar com JSON no corpo da requisição
server.use(routes);

// Iniciar o servidor
server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});
