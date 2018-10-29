// require dotenv to get database credentials
require('dotenv').config()
// inquirer to run prompts to user
const inquirer = require('inquirer');
// possibly using validator for checking numbers...
const validator = require('validator');
// mysql module to help connect to database
const mysql = require('mysql');
// chalk to style command line
const chalk = require('chalk');
// creating connection with db credentials
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// global variables for username and pin... may not use
let userNameSave;
let pinSave;
let successfulLogin = false;

const separator = (color,length) => {console.log(color("\n" + "-".repeat(length) + "\n"))}

const mainText = (text) => {
    let repeater = text.length+20;
    console.log(repeater)
    separator(chalk.green,repeater)
    console.log(chalk.bgGreen.black(" ".repeat(10)+text.toUpperCase()+" ".repeat(10)))
    separator(chalk.green,repeater)
}
const errorText = (text) => {
    let repeater = text.length+20;
    separator(chalk.red,repeater)
    console.log(chalk.bgRed(" ".repeat(repeater)+text.toUpperCase()+" ".repeat(repeater)))
    separator(chalk.red,repeater)
}

//-------------------------------------------
//             USER FUNCTIONS
//-------------------------------------------
// start off prompting user for username:
const userNamePrompt = function () {
    inquirer.prompt([{
        message: "What is your accounts user name:",
        name: "name",
    }]).then(user => {
        // query database for user if they exist
        connection.query('SELECT * FROM users WHERE user_name = ?', [user.name.toLowerCase()], function (error, results, fields) {
            if (error) throw error;
            // if user doesnt exist then we will run create user function
            if (results[0] === undefined) {
                errorText("No user with that username exists.")
                createUserPrompt(user.name.toLowerCase());
            } else if (results[0].user_name.toLowerCase() === user.name.toLowerCase()) {
                // else if user exists prompt for PIN to login
                pinNumberPrompt(user.name.toLowerCase(), results[0].pin);
            }
        });
    })
}
// prompt user for pin number
const pinNumberPrompt = function (username, pin) {
    // console.log(username + " " + pin)
    inquirer.prompt([{
        message: "Please enter pin number:",
        name: "pin",
    }]).then(user => {
        let floatPin = parseFloat(user.pin);
        if (floatPin === pin) {
            mainText(`Logged in as ${username}`);
            successfulLogin = true;
            userNameSave = username;
            pinSave = pin;
            whichCommand();
        } else {
            errorText('Sorry, incorrect PIN')
            userNamePrompt();
        }
    })
}
// if username doesnt exist, then create user with pin...
const createUserPrompt = function (username) {
    inquirer.prompt([{
        message: `Would you like to create an account with us using the username [${username}]?`,
        type: "confirm",
        name: "create",
        default: false,
    }]).then(answer => {
        // if they would like to create account we will gather information
        if (answer.create === true) {
            // console.log("Creating user...")
            // endSession();
            createUser(username);
            // else we thank them and end the sessions 
        } else {
            mainText(`Thank you! Have a nice day!`);
            endSession();
            return false;
        }
    })
}
// actual function to create the user
const createUser = function (username) {
    inquirer.prompt([{
        message: "Please enter a 5 digit pin number",
        name: "pin",
    }]).then(user => {

        // variable set with validator module to get if pin entered is in fact a number
        let numcheck = validator.isInt(user.pin);
        let pin = parseInt(user.pin);
        let sql = `INSERT INTO users (user_name, pin) VALUES ('${username}', ${pin})`;
        // console.log(pin.length)
        // check pin to see if it is 5 digits
        if (pin < 10000 || pin > 99999) {
            errorText('Sorry we need a 5 digit pin number...')
            createUser(username);
        } // if the pin entered is not an actual number run createuser again
        else if (numcheck === false) {
            errorText('Sorry we need a 5 digit pin number...')
            createUser(username);
        } // else we will create user and input into database
        else {
            connection.query(sql, (err, result) => {
                if (err) throw err;
                // console.log(result);
                mainText(`User [${username}] created. Please login using your username and pin.`);
                userNamePrompt();
            })
        }

        // endSession();
    });
}
//-------------------------------------------


// ask user what command they would like to use:
const whichCommand = function () {

    inquirer.prompt([{
        type: 'list',
        message: 'What would you like to do:',
        choices: ['Check Balances', 'Deposit', 'Withdraw', 'Transfer Balance'],
        name: 'command',
    }]).then(which => {
        switch (which.command) {
            case 'Check Balances':
                // mainText(`Checking Balances`);
                whichAccount(which.command);
                break;
            case 'Deposit':
                // mainText(`Making Deposit`);
                whichAccount(which.command);
                break;
            case 'Withdraw':
                // console.log(`${separator}Making Withdrawal${separator}`);
                whichAccount(which.command);
                break;
            case 'Transfer Balance':
                // console.log(`${separator}Transferring money.${separator}`);
                moneyTransfer(which.command);
                break;

            default:
                break;
        }
    })
}

const whichAccount = (command) => {
    inquirer.prompt([{
        message: chalk.yellow(`Which account would you like to ${command} ${userNameSave}?`),
        type: "list",
        choices: ['Checking','Savings'],
        name: 'account'
    }]).then(which => {
        switch (command) {
            case 'Check Balances':

                checkBalance(which.account);
                break;
            case 'Deposit':

                depositFunds(which.account);
                break;
            case 'Withdraw':

                withdrawFunds(which.account);
                break;
            case 'Transfer Balance':

                moneyTransfer(which.account);
                break;

            default:
                break;
        }
    })

}

// check balance function
const checkBalance = function (account) {
    switch (account) {
        case 'Checking':

            conQuery("balance_checking");
            break;

        case 'Savings':

            // console.log("Savings Balance: ");
            conQuery("balance_savings");
            break;

        default:
            break;
    }
}

// deposit funds function
const depositFunds = function (account) {
    inquirer.prompt([{
        message: `How much money would you like to deposit into ${account} account?`,
        type: 'list',
        choices: ['20', '40', '60', '80', '100', 'other'],
        name: 'amount'
    }]).then(deposit => {
        // console.log(account + " " + deposit.amount)
        switch (account) {
            case 'Checking':
                if (deposit.amount === 'other') {
                    inquirer.prompt([{
                        message: `Enter in a dollar amount you would like to deposit.`,
                        name: `other`,
                    }]).then(amount => {
                        let intCheck = validator.isInt(amount.other);
                        let parsedAmount = parseFloat(amount.other);
                        if (intCheck === true) {
                            conQuery('deposit_checking', parsedAmount)
                        } else {
                            errorText('Please enter a valid dollar amount.')
                            depositFunds('Checking')
                        }
                    })
                } else {
                    // let intCheck = validator.isInt(parsedAmount);
                    let parsedAmount = parseFloat(deposit.amount);
                    conQuery('deposit_checking', parsedAmount)
                }
                
                break;
                case 'Savings':
                if (deposit.amount === 'other') {
                    inquirer.prompt([{
                        message: `Enter in a dollar amount you would like to deposit.`,
                        name: `other`,
                    }]).then(amount => {
                        let intCheck = validator.isInt(amount.other);
                        let parsedAmount = parseFloat(amount.other);
                        if (intCheck === true) {
                            conQuery('deposit_savings', parsedAmount)
                        } else {
                            errorText('Please enter a valid dollar amount.')
                            depositFunds('Savings')
                        }
                    })
                } else {
                    // let intCheck = validator.isInt(parsedAmount);
                    let parsedAmount = parseFloat(deposit.amount);
                    conQuery('deposit_savings', parsedAmount)
                }

                break;

            default:
                break;
        }
    })
}

// withdraw funds function
const withdrawFunds = function (account) {

    inquirer.prompt([{
        message: `How much money would you like to withdraw from ${account} account?`,
        type: 'list',
        choices: ['20', '40', '60', '80', '100', 'other'],
        name: 'amount'
    }]).then(withdraw => {
        // console.log(account + " " + withdraw.amount)
        switch (account) {
            case 'Checking':
                if (withdraw.amount === 'other') {
                    inquirer.prompt([{
                        message: `Enter in a dollar amount you would like to withdraw.`,
                        name: `other`,
                    }]).then(amount => {
                        let intCheck = validator.isInt(amount.other);
                        let parsedAmount = parseFloat(amount.other);
                        if (intCheck === true) {
                            conQuery('withdraw_checking', parsedAmount)
                        } else {
                            errorText('Please enter a valid dollar amount.')
                            withdrawFunds('Checking')
                        }
                    })
                } else {
                    // let intCheck = validator.isInt(parsedAmount);
                    let parsedAmount = parseFloat(withdraw.amount);
                    conQuery('withdraw_checking', parsedAmount)
                }
                
                break;
                case 'Savings':
                if (withdraw.amount === 'other') {
                    inquirer.prompt([{
                        message: `Enter in a dollar amount you would like to withdraw.`,
                        name: `other`,
                    }]).then(amount => {
                        let intCheck = validator.isInt(amount.other);
                        let parsedAmount = parseFloat(amount.other);
                        if (intCheck === true) {
                            conQuery('withdraw_savings', parsedAmount)
                        } else {
                            errorText('Please enter a valid dollar amount.')
                            withdrawFunds('Savings')
                        }
                    })
                } else {
                    // let intCheck = validator.isInt(parsedAmount);
                    let parsedAmount = parseFloat(withdraw.amount);
                    conQuery('withdraw_savings', parsedAmount)
                }

                break;

            default:
                break;
        }
    })
}

// transfer from one account to another
const moneyTransfer = function () {
    inquirer.prompt([{
        message: `Which account would you like to transfer from?`,
        type: `list`,
        choices: ['Checking', 'Savings'],
        name: 'from'
    }, {
        message: `Choose account to transfer into.`,
        type: `list`,
        choices: ['Checking', 'Savings'],
        name: 'to'
    }]).then(accounts => {
        if (accounts.from === accounts.to) {
            errorText('Sorry you cannot transfer to the same account you are transferring from.')
            continueSession();
        } else {
            inquirer.prompt([{
                message: `How much money would you like to transfer from ${accounts.from} to ${accounts.to}`,
                type: 'list',
                choices: ['20', '40', '60', '80', '100', 'other'],
                name: 'amount'
            }]).then(transfer => {
                switch (accounts.from) {
                    case 'Checking':
                        if (transfer.amount === 'other') {
                            inquirer.prompt([{
                                message: `Enter in a dollar amount you would like to transfer.`,
                                name: `other`,
                            }]).then(amount => {
                                let intCheck = validator.isInt(amount.other);
                                let parsedAmount = parseFloat(amount.other);
                                if (intCheck === true) {
                                    transferFunds('checking', 'savings', parsedAmount)
                                } else {
                                    errorText('Please enter a valid dollar amount.')
                                    continueSession();
                                }
                            })
                        } else {
                            // let intCheck = validator.isInt(parsedAmount);
                            let parsedAmount = parseFloat(transfer.amount);
                            transferFunds('checking', 'savings', parsedAmount)
                        }

                        break;
                    case 'Savings':
                        if (transfer.amount === 'other') {
                            inquirer.prompt([{
                                message: `Enter in a dollar amount you would like to transfer.`,
                                name: `other`,
                            }]).then(amount => {
                                let intCheck = validator.isInt(amount.other);
                                let parsedAmount = parseFloat(amount.other);
                                if (intCheck === true) {
                                    transferFunds('savings', 'checking', parsedAmount)
                                } else {
                                    errorText('Please enter a valid dollar amount.')
                                    continueSession();
                                }
                            })
                        } else {
                            // let intCheck = validator.isInt(parsedAmount);
                            let parsedAmount = parseFloat(transfer.amount);
                            transferFunds('savings', 'checking', parsedAmount)
                        }

                        break;
                    default:
                        break;
                }
            });
        }
    })
}

//actual transfer of funds function
const transferFunds = (from, to, amount) => {
    switch (from) {
        case 'checking':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                if (results[0].checking - amount >= 0) {
                    let currentChecking = results[0].checking;
                    let currentSavings = results[0].savings;
                    currentChecking -= amount;
                    currentSavings += amount;

                    connection.query('UPDATE users SET `checking` = ?, `savings` = ? WHERE user_name = ?', [currentChecking, currentSavings, userNameSave], function (error, results, fields) {
                        if (error) throw error;
                        mainText(`$${amount} transferred from ${from} account to ${to} account. New balances - Savings: $${currentSavings} Checking: $${currentChecking}`)
                        continueSession();
                    });
                } else {
                    errorText(`Sorry, you have insufficient funds. Taking $${amount} from ${from} account would overdraw your account.`)
                    continueSession();
                }
            });
            break;
        case 'savings':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                if (results[0].savings - amount >= 0) {
                    let currentChecking = results[0].checking;
                    let currentSavings = results[0].savings;
                    currentChecking += amount;
                    currentSavings -= amount;

                    connection.query('UPDATE users SET `checking` = ?, `savings` = ? WHERE user_name = ?', [currentChecking, currentSavings, userNameSave], function (error, results, fields) {
                        if (error) throw error;
                        mainText(`$${amount} transferred from ${from} account to ${to} account. New balances - Savings: $${currentSavings} Checking: $${currentChecking}`)
                        continueSession();
                    });
                } else {
                    errorText(`Sorry, you have insufficient funds. Taking $${amount} from ${from} account would overdraw your account.`)
                    continueSession();
                }
            });
            break;

        default:
            break;
    }
}

// ask if customer would like another transaction
const continueSession = function () {
    inquirer.prompt([{
        message: "Would you like to make another transaction?",
        type: "confirm",
        default: false,
        name: "continue"
    }]).then(session => {
        console.log("\n")
        if (session.continue === true) {

            whichCommand();
        } else {
            endSession();
            return false;
        }
    })
    return false;
}

// end session
const endSession = function () {
    connection.end()
}

// connection query function using command
const conQuery = (command, amount) => {
    switch (command) {
        case 'balance_checking':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                mainText(`Checking Account Balance: $${results[0].checking}`);
                continueSession();
            });
            break;
        case 'deposit_checking':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                // console.log(results[0].checking)
                let currentChecking = results[0].checking;
                currentChecking += amount;

                connection.query('UPDATE users SET `checking` = ? WHERE user_name = ?', [currentChecking, userNameSave], function (error, results, fields) {
                    if (error) throw error;
                    mainText(`Deposited $${amount} into Checking account. New balance is $${currentChecking}`)
                    continueSession();
                });
            });
            break;
        case 'withdraw_checking':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                // console.log(results[0].checking)
                if (results[0].checking - amount >= 0) {
                    let currentChecking = results[0].checking;
                    currentChecking -= amount;

                    connection.query('UPDATE users SET `checking` = ? WHERE user_name = ?', [currentChecking, userNameSave], function (error, results, fields) {
                        if (error) throw error;
                        mainText(`Withdrew $${amount} from Checking account. New balance is $${currentChecking}`)
                        continueSession();
                    });

                } else {
                    errorText(`Sorry, insufficient funds. Withdrawing $${amount} from Checking account would overdraw you.`)
                    continueSession();
                }
            });
            break;
        case 'balance_savings':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                mainText(`Savings Account Balance: $${results[0].savings}`)
                continueSession();
            });
            break;
        case 'deposit_savings':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                let currentSavings = results[0].savings;
                currentSavings += amount;

                connection.query('UPDATE users SET `savings` = ? WHERE user_name = ?', [currentSavings, userNameSave], function (error, results, fields) {
                    if (error) throw error;
                    mainText(`Deposited $${amount} into Savings account. New balance is $${currentSavings}`)
                    continueSession();

                });
            });
            break;
        case 'withdraw_savings':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                if (results[0].savings - amount >= 0) {
                    let currentSavings = results[0].savings;
                    currentSavings -= amount;

                    connection.query('UPDATE users SET `savings` = ? WHERE user_name = ?', [currentSavings, userNameSave], function (error, results, fields) {
                        if (error) throw error;
                        mainText(`Withdrew $${amount} from Savings account. New balance is $${currentSavings}`)
                        continueSession();

                    });
                } else {
                    errorText(`Sorry, insufficient funds. Withdrawing $${amount} from Savings account would overdraw you.`)
                    continueSession();
                }
            });
            break;

        default:
            break;
    }
    // connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
    //     if (error) throw error;
    //     return sql;
    // });
}

// might use later for refactoring
// const overdrawAccount = (withdrawAmount, accountBalance) => {

// }

// start session
connection.connect(function (err) {
    if (err) throw err;
    console.log(chalk.yellow("connected as id " + connection.threadId + "\n\n"));
    userNamePrompt();
});