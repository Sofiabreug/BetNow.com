import express from "express";
import { Request, Response, Router } from "express";
import { AccountsHandler } from "./accounts/accounts";
import { EventsHandler } from "./events/events";
import { WalletHandler } from "./wallet/wallet";

const port = 3000; 
const server = express();
const routes = Router();

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

server.use(express.json()); 
server.use(routes);


server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});