
/*
import {Request, RequestHandler, Response} from "express";


export namespace AccountsHandler {
    
  
    export type UserAccount = {
        name:string;
        email:string;
        password:string; 
        birthdate:string; 
    };

    // Array que representa uma coleção de contas. 
    let accountsDatabase: UserAccount[] = [];

   

    export function saveNewAccount(ua: UserAccount) : number{
        accountsDatabase.push(ua);
        return accountsDatabase.length;
    }

 
  
    export const createAccountRoute: RequestHandler = (req: Request, res: Response) => {
       
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
        
        if(pName && pEmail && pPassword && pBirthdate){
         
            const newAccount: UserAccount = {
                name: pName,
                email: pEmail, 
                password: pPassword,
                birthdate: pBirthdate
            }
            const ID = saveNewAccount(newAccount);
            res.statusCode = 200; 
            res.send(`Nova conta adicionada. Código: ${ID}`);
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

}
*/