import express from "express";
import { Request, Response, Router } from "express";
import { AccountsHandler } from "./accounts/accounts";
import { EventsHandler } from "./events/events";

const port = 3000; 
const server = express();
const routes = Router();

// Definir as rotas
// A rota tem um verbo/método HTTP (GET, POST, PUT, DELETE)
routes.get('/', (req: Request, res: Response) => {
    res.status(403).send('Acesso não permitido.'); 
});

routes.post('/signUp', AccountsHandler.createAccountRoute); 

// Rota de login
routes.post('/login', AccountsHandler.loginHandler); 

//Rota de Criação de evento
routes.post('/AddNewEvent', EventsHandler.AddNewEvent); 

//Rota de Avaliar evento
routes.put('/evaluateEvent', EventsHandler.evaluateEvent);

//Rota de Sacar fundos
routes.put('/withdraw', EventsHandler.withdrawFounds); 

//Rota para deletar evento
routes.delete('/deleteEvent', EventsHandler.deleteEvent);

//Rota para adicionar fundos à carteira do usuário 
routes.post('/addFunds', EventsHandler.addFunds);

//Rota para adicionar fundos à carteira do usuário 
routes.get('/searchEvent', EventsHandler.searchEvent);

//Rota para adicionar fundos à carteira do usuário 
routes.put('/finishEvent', EventsHandler.finishEvent);



server.use(express.json()); // Para lidar com JSON no corpo da requisição
server.use(express.json()); 
server.use(routes);


server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});
