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
<<<<<<< HEAD
routes.post('/AddNewEvent', AccountsHandler.AddNewEvent); // Adicionando a rota de evento

=======
routes.post('/AddNewEvent', AccountsHandler.AddNewEvent); 
>>>>>>> c70fa5bda2f6835bec1f8ee5e509dd2660d56f64
//Rota de Avaliar evento
routes.put('/evaluateEvent', AccountsHandler.evaluateEvent);
//Rota de Sacar fundos
routes.put('/withdraw', AccountsHandler.withdrawFounds); 

<<<<<<< HEAD
//Rota para deletar evento
routes.delete('/deleteEvent', AccountsHandler.deleteEvent);

//Rota para adicionar fundos à carteira do usuário 
routes.post('/addFunds', AccountsHandler.addFunds);

server.use(express.json()); // Para lidar com JSON no corpo da requisição
=======
server.use(express.json()); 
>>>>>>> c70fa5bda2f6835bec1f8ee5e509dd2660d56f64
server.use(routes);


server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});
