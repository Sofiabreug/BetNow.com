import express from "express";
import { Request, Response, Router } from "express";
import cors from 'cors';
import { AccountsHandler } from "./accounts/accounts";
import { EventsHandler } from "./events/events";
import { WalletHandler } from "./wallet/wallet";

const port = 3000; 
const server = express();

// Configuração do middleware global
server.use(express.json()); // Middleware para tratar JSON
server.use(cors({
    origin: 'http://127.0.0.1:8080', // URL do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization', 'email', 'password'] // Cabeçalhos permitidos
})); // Middleware global para CORS

const routes = Router();

// Rotas
routes.get('/', (req: Request, res: Response) => {
    res.status(403).send('Acesso não permitido.'); 
});

routes.post('/signUp', AccountsHandler.createAccount); 
routes.post('/login', AccountsHandler.loginHandler);
routes.post('/AddNewEvent', EventsHandler.AddNewEvent); 
routes.post('/BetOnEvents', EventsHandler.betOnEvent); 
routes.put('/evaluateEvent', EventsHandler.evaluateEvent);
routes.put('/deleteEvent', EventsHandler.deleteEvent);
routes.put('/finishEvent', EventsHandler.finishEvent);
routes.get('/searchEvent', EventsHandler.searchEvent);
routes.get('/getEvents', EventsHandler.getEvents);
routes.put('/withdraw', WalletHandler.withdrawFunds); 
routes.get('/checkBalance', WalletHandler.checkBalance);
routes.post('/addFunds', WalletHandler.addFunds);
routes.get('/getEventsByCategory', EventsHandler.getEventsByCategory);


// Uso das rotas
server.use(routes);

// Inicia o servidor
server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});
