import c from 'chalk';
import fs from 'fs';
import Storage from './storage.js';
import Ask from './ask.js';
import Chrome from './chrome.js';
import log from './log.js';

class Registration {
    constructor(chromePath) {
        this.chromePath = chromePath;

        this.ask = new Ask();
        this.chrome = new Chrome(this.chromePath);
        this.storage = new Storage();

        this.settings = this.storage.loadSettings();
        this.links = this.storage.load('./src/links.json');

        this.selectors = {
            regButton: `li[role="presentation"][data-index="1"] > button`,
            loginInput: `div[data-a-target="signup-username-input"] input`,
            passInput: `div[data-a-target="signup-password-input"] input`,
            passConfirmInput: `div[data-a-target="signup-password-confirmation-input"] input`,
            birthdayDayInput: `div[data-a-target="birthday-date-input"] input`,
            birthdayMonthSelect: `select[data-a-target="birthday-month-select"]`,
            birthdayMonthOption: `select[data-a-target="birthday-month-select"] option[value="1"]`,
            birthdayYearSelect: `div[data-a-target="birthday-year-input"] input`,
            phoneEmailToggle: `button[data-a-target="signup-phone-email-toggle"]`,
            emailInput: `div[data-a-target="signup-email-input"] input`,
            signUpButton: `button[data-a-target="passport-signup-button"]`,
            skipEmailButton: `button[data-a-target="email-verification-modal-component-secondary-button"]`,
            skipNumberButton: `button[data-a-target="enter-phone-number-secondary-button"]`,
            channelButton: `figure[data-a-target="top-nav-avatar"]`,
            authLoginInput: `div[data-a-target="login-username-input"] input`,
            authPassInput: `div[data-a-target="login-password-input"] input`,
            loginButton: `button[data-a-target="passport-login-button"]`
        };
    }

    async byFile() {
        if(!fs.existsSync(this.settings.accountsFile)) {
            fs.writeFileSync(this.settings.accountsFile, 'login:password:mail@example.com');
            log(`${c.cyan(`File ${this.settings.accountsFile} created. Fill it with account data in the format:`)} ${c.green('login:password:mail@example.com')} ${c.cyan('Each account on a new line. Then restart the program.')}`);
            return;
        }

        log(c.green(`File ${this.settings.accountsFile} found`));

        const accounts = this.storage.parseAccountsFile(this.settings.accountsFile);
        if(!accounts || ! accounts.length) return;
        log(`Loaded ${accounts.length} accounts`);

        const toStart = await this.ask.askToStartRegistration();
        if(!toStart) return;

        this.regAccounts(accounts, 'move');
    }

    async regAccounts(accounts, toFile) {
        await this.chrome.launch();

        for(let i = 0; i < accounts.length; i++) {
            const account = accounts[i];

            log(c.cyan(`[${(i + 1)}] Registering ${account.login}...`));
            const res = await this.reg(account.login, account.pass, account.mail);
        
            if(res) {
                log(`${c.green(`[${(i + 1)}] Account`)} ${c.magenta(account.login)} ${c.green(`successfully registered:`)}`);
                log(account.login);
                log(account.pass);

                if(toFile == 'move') {
                    await this.storage.moveAccountToRegisteredFile(account.login);
                }
            } else {
                log(c.red(`Failed to register account ${account.login}`));
                const toContinue = await this.ask.askToContinue();

                if(!toContinue) break;
            }
        }
        
        await this.chrome.close();
    }

    async reg(login, pass, mail) {
        let result = false;
    
        try {
            const browser = this.chrome.getBrowser();
            const pages = await browser.pages();
            const page = pages[0];
            await page.goto(this.links.url);

            const typeOptions = {delay: 20};
            await page.setDefaultTimeout(3000000);
    
            await page.waitForSelector(this.selectors.regButton);
            await page.click(this.selectors.regButton);

            await page.waitForSelector(this.selectors.loginInput);
            await page.type(this.selectors.loginInput, login, typeOptions);
            await page.type(this.selectors.passInput, pass, typeOptions);
            await page.type(this.selectors.passConfirmInput, pass, typeOptions);

            await page.type(this.selectors.birthdayDayInput, '11', typeOptions);
            await page.select(this.selectors.birthdayMonthSelect, '1');
            await page.type(this.selectors.birthdayYearSelect, '1990', typeOptions);

            await page.click(this.selectors.phoneEmailToggle);
            await page.type(this.selectors.emailInput, mail, typeOptions);

            await page.evaluate((buttonSelector) => {
                return new Promise((resolve, reject) => {
                    setInterval(() => {
                        const button = document.querySelector(buttonSelector);
                        console.log(`>TwitchAutoReg: Waiting for button...`);
                        if(!button || button.disabled) return;
                        resolve();
                    }, 200);
                });
            }, this.selectors.signUpButton);

            await page.click(this.selectors.signUpButton);

            await page.waitForSelector(this.selectors.skipEmailButton);
            await page.click(this.selectors.skipEmailButton);

            await page.waitForSelector(this.selectors.skipNumberButton);
            await page.click(this.selectors.skipNumberButton);

            await page.waitForSelector(this.selectors.channelButton);
            await this.chrome.deleteCookies(page);
            result = true;
        } catch (err) {
            log(c.red(`Error while registering twitch: ${err}`));
        }
    
        return result;
    }

    async getTokensByFile() {
        if(!fs.existsSync(this.settings.registeredAccountsFile)) {
            fs.writeFileSync(this.settings.registeredAccountsFile, '');
            log(`${c.cyan(`File ${this.settings.registeredAccountsFile} created. Fill it with account data in the format:`)} ${c.green('login:password:mail@example.com')} ${c.cyan('Each account on a new line. Then restart the program.')}`);
            return;
        }

        log(c.green(`File ${this.settings.registeredAccountsFile} found`));

        const accounts = this.storage.parseAccountsFile(this.settings.registeredAccountsFile);
        if(!accounts || ! accounts.length) return;
        log(`Loaded ${accounts.length} accounts`);

        this.authAccounts(accounts);
    }

    async authAccounts(accounts) {
        await this.chrome.launch();

        for(let i = 0; i < accounts.length; i++) {
            const account = accounts[i];

            log(c.cyan(`[${(i + 1)}] Authorize ${account.login}...`));
            const res = await this.auth(account.login, account.pass);
        
            if(res) {
                log(`${c.green(`[${(i + 1)}] Account`)} ${c.magenta(account.login)} ${c.green(`successfully authorized:`)} ${c.magenta(res)}`);
            } else {
                log(c.red(`Failed to auth account ${account.login}`));
                const toContinue = await this.ask.askToContinue();

                if(!toContinue) break;
            }
        }
        
        await this.chrome.close();
    }

    async auth(login, pass) {
        let result = false;
    
        try {
            const browser = this.chrome.getBrowser();
            const pages = await browser.pages();
            const page = pages[0];
            await page.goto(this.links.url);

            const typeOptions = {delay: 20};
            await page.setDefaultTimeout(3000000);
    
            await page.waitForSelector(this.selectors.authLoginInput);
            await page.type(this.selectors.authLoginInput, login, typeOptions);
            await page.type(this.selectors.authPassInput, pass, typeOptions);

            await page.evaluate((buttonSelector) => {
                return new Promise((resolve, reject) => {
                    setInterval(() => {
                        const button = document.querySelector(buttonSelector);
                        console.log(`>TwitchAutoReg: Waiting for button...`);
                        if(!button || button.disabled) return;
                        resolve();
                    }, 200);
                });
            }, this.selectors.loginButton);

            await page.click(this.selectors.loginButton);
            
            await page.waitForSelector(this.selectors.channelButton);
            const cookies = await page.cookies();
            let token = null;

            for(let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                if(cookie.name == 'auth-token') {
                    token = cookie.value;
                }
            }

            await this.chrome.deleteCookies(page);

            result = token;
        } catch (err) {
            log(c.red(`Error while autorize twitch: ${err}`));
        }
    
        return result;
    }

    async sleep(timeout) {
        return new Promise((resolve) => {
            setTimeout(resolve, timeout);
        });
    }
}

export default Registration;