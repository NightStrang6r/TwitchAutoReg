import inquirer from 'inquirer';

class Ask {
    async askToStartRegistration() {
        const questions = 
        [{
            name: 'continue',
            type: 'confirm',
            message: 'Are you sure you want to start registration?'
        }];

        const answers = await inquirer.prompt(questions);
        return answers.continue;
    }

    async askToContinue() {
        const questions = 
        [{
            name: 'continue',
            type: 'confirm',
            message: 'Are you sure you want to continue?'
        }];

        const answers = await inquirer.prompt(questions);
        return answers.continue;
    }

    async askWorkMode() {
        const questions = 
        [{
            name: 'regMode',
            type: 'list',
            message: 'Select work mode:',
            choices: ['Register accounts from file', 'Get tokens form registered accounts']
        }];

        const answers = await inquirer.prompt(questions);
        return answers.regMode;
    }

    async askMailStartValue(login) {
        const questions = 
        [{
            name: 'startValue',
            type: 'number',
            message: `Enter the initial value in the login name (default is 1, i.e. ${login}1@rambler.ru, ${login}2@rambler.ru...):`,
            default() {
                return 1;
            }
        }];

        const answers = await inquirer.prompt(questions);
        return answers.startValue;
    }

    async ask() {
        const questions = 
        [{
            name: 'mailLogin',
            type: 'input',
            message: 'Enter mail login (before @):'
        }, {
            name: 'domain',
            type: 'list',
            message: 'Choice mail domain (after @):',
            choices: [
                'rambler.ru', 
                'lenta.ru',
                'autorambler.ru',
                'myrambler.ru',
                'ro.ru',
                'rambler.ua'
            ]
        }, {
            name: 'passLength',
            type: 'number',
            message: 'Enter pass length (15 by default):',
            default() {
                return 15;
            }
        }, {
            name: 'emailsCount',
            type: 'number',
            message: 'Enter count of mails to register (1 by default):',
            default() {
                return 1;
            }
        }, {
            name: 'code',
            type: 'input',
            message: 'Enter security code (123456 by default):',
            default() {
                return '123456';
            }
        }];

        const answers = await inquirer.prompt(questions);
        return answers;
    }
}

export default Ask;