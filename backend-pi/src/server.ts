import express from "express";
import { Request, Response, Router } from "express";
import { AccountsHandler } from "./accounts/accounts";

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
routes.post('/AddNewEvent', AccountsHandler.AddNewEvent); 
//Rota de Avaliar evento
routes.put('/evaluateEvent', AccountsHandler.evaluateEvent);
//Rota de Sacar fundos
routes.put('/withdraw', AccountsHandler.withdrawFounds); 

server.use(express.json()); 
server.use(routes);


server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});
