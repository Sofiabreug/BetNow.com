import express from "express";
import { Request, Response, Router } from "express";
import { AccountsHandler } from "./accounts/accounts";
import { EventsHandler } from "./events/events";

const port = 3000; 
const server = express();
const routes = Router();

routes.get('/', (req: Request, res: Response) => {
    res.status(403).send('Acesso não permitido.'); 
});


routes.post('/signUp', AccountsHandler.createAccountRoute); 


routes.post('/login', AccountsHandler.loginHandler); 


routes.post('/AddNewEvent', EventsHandler.AddNewEvent); 


routes.put('/evaluateEvent', EventsHandler.evaluateEvent);


routes.put('/withdraw', EventsHandler.withdrawFunds); 


routes.delete('/deleteEvent', EventsHandler.deleteEvent);


routes.post('/addFunds', EventsHandler.addFunds);


routes.get('/searchEvent', EventsHandler.searchEvent);


routes.put('/finishEvent', EventsHandler.finishEvent);


server.use(express.json()); 
server.use(routes);


server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
});