import c from 'chalk';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import log from './log.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

class Storage {
    constructor() {
        this.settings = this.loadSettings();
    }

    load(uri) {
        let result = false;
        try {
            uri = `${_dirname}/../${uri}`;
            
            if(!fs.existsSync(uri)) {
                fs.writeFileSync(uri, '');
                return '';
            }
    
            const rawdata = fs.readFileSync(uri);
            result = JSON.parse(rawdata);
        } catch (err) {
            console.log(`Ошибка при загрузке файла: ${err}`);
        }
        return result;
    }

    loadSettings() {
        const uri = `${_dirname}/../settings.json`;
        let data = null;

        if(!fs.existsSync(uri)) {
            data = {
                accountsFile: "accounts.txt",
                registeredAccountsFile: "registeredAccounts.txt"
            };

            fs.writeFileSync(uri, JSON.stringify(data, null, 4));
            return data;
        }

        data = fs.readFileSync(uri);
        const result = JSON.parse(data);

        return result;
    }

    parseAccountsFile(path) {
        const accountsFile = fs.readFileSync(path);
        let accountsData = accountsFile.toString().split('\r\n');
        let accounts = [];

        for(let i = 0; i < accountsData.length; i++) {
            if(!accountsData[i] || accountsData[i] == '') continue;

            let account = accountsData[i].split(':');
            const login = account[0];
            const pass = account[1];
            const mail = account[2];
            let error = false;

            if(!login || login == '') {
                log(c.red(`Failed to parse account: login cant be empty.`));
                error = true;
            }

            if(!mail.includes('@')) {
                log(c.red(`Failed to parse account: mail must contain "@" symbol.`));
                error = true;
            }

            if(pass.length < 9) {
                log(c.red(`Failed to parse account: pass must contain at least 9 characters.`));
                error = true;
            }

            account = {
                login: login,
                pass: pass,
                mail: mail
            }

            if(error) {
                log(account);
                return;
            }

            accounts.push(account);
            log(`Parsing ${login}... ${c.green('OK')}`);
        }

        return accounts;
    }

    async moveAccountToRegisteredFile(login) {
        if(!fs.existsSync(this.settings.accountsFile)) {
            log(c.red(`Cant find ${this.settings.accountsFile}`));
            return;
        }

        if(!fs.existsSync(this.settings.registeredAccountsFile)) {
            fs.writeFileSync(this.settings.registeredAccountsFile, '');
            log(c.green(`File ${this.settings.registeredAccountsFile} created`));
        }

        const accountsFile = fs.readFileSync(this.settings.accountsFile);
        let accountsData = accountsFile.toString().split('\r\n');
        const registeredAccountsFile = fs.readFileSync(this.settings.registeredAccountsFile);
        
        let accountString = '';

        for(let i = 0; i < accountsData.length; i++) {
            if(accountsData[i].includes(login)) {
                accountString = accountsData[i];
                accountsData.splice(i, 1);
                break;
            }
        }

        const newRegisteredMailsFile = registeredAccountsFile.toString() + accountString + '\r\n';
        fs.writeFileSync(this.settings.registeredAccountsFile, newRegisteredMailsFile);

        accountsData = accountsData.join('\r\n');
        fs.writeFileSync(this.settings.accountsFile, accountsData);
    }
}

export default Storage;