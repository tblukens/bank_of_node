// require dotenv to get database credentials
require('dotenv').config()
// inquirer to run prompts to user
const inquirer = require('inquirer');
// possibly using validator for checking numbers...
const validator = require('validator');
// mysql module to help connect to database
const mysql = require('mysql');
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

const separator = "\n" + "-".repeat(75) + "\n";

//-------------------------------------------
//             USER FUNCTIONS
//-------------------------------------------
// start off prompting user for username:
const userNamePrompt = function () {
    inquirer.prompt([{
        message: "What is your accounts user name:",
        name: "name",
    }]).then(user => {
        console.log("\nUsername: " + user.name.toLowerCase())
        // query database for user if they exist
        connection.query('SELECT * FROM users WHERE user_name = ?', [user.name.toLowerCase()], function (error, results, fields) {
            if (error) throw error;
            // if user doesnt exist then we will run create user function
            if (results[0] === undefined) {
                console.log("No user with that username exists.")
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
    console.log(username + " " + pin)
    inquirer.prompt([{
        message: "Please enter pin number:",
        name: "pin",
    }]).then(user => {
        let floatPin = parseFloat(user.pin);
        if (floatPin === pin) {
            console.log(`Logged in as ${username}`)
            successfulLogin = true;
            userNameSave = username;
            pinSave = pin;
            whichCommand();
        } else {
            console.log("incorrect pin")
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
            console.log("Creating user...")
            // endSession();
            createUser(username);
            // else we thank them and end the sessions 
        } else {
            console.log("Thank you! Have a nice day!")
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
        console.log(pin.length)
        // check pin to see if it is 5 digits
        if (pin < 10000 || pin > 99999) {
            console.log("Sorry we need a 5 digit pin number...\n")
            createUser(username);
        } // if the pin entered is not an actual number run createuser again
        else if (numcheck === false) {
            console.log("Sorry we need a 5 digit pin number...\n")
            createUser(username);
        } // else we will create user and input into database
        else {
            connection.query(sql, (err, result) => {
                if (err) throw err;
                console.log(result);
                console.log(`User [${username}] created. Please login using your username and pin.\n`);
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
                console.log("Checking Balances");
                whichAccount(which.command);
                break;
            case 'Deposit':
                console.log("Making Deposit");
                whichAccount(which.command);
                break;
            case 'Withdraw':
                console.log("Making Withdrawal");
                whichAccount(which.command);
                break;
            case 'Transfer Balance':
                console.log("Transferring from one account to another.");
                moneyTransfer(which.command);
                break;

            default:
                break;
        }
    })
}

const whichAccount = (command) => {
    inquirer.prompt([{
        message: `Which account would you like to ${command} ${userNameSave}?`,
        type: "list",
        choices: ['Checking', 'Savings'],
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

            console.log("Checking Balance: ");
            conQuery("balance_checking")
            break;

        case 'Savings':

            console.log("Savings Balance: ");
            conQuery("balance_savings")
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
        console.log(account + " " + deposit.amount)
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
                            console.log(`\n${separator}\nPlease enter a valid dollar amount.\n${separator}\n`)
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
                            console.log(`\n${separator}\nPlease enter a valid dollar amount.\n${separator}\n`)
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
        console.log(account + " " + withdraw.amount)
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
                            console.log(`\n${separator}\nPlease enter a valid dollar amount.\n${separator}\n`)
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
                            console.log(`\n${separator}\nPlease enter a valid dollar amount.\n${separator}\n`)
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
            console.log(`${separator}Sorry, you cannot transfer into the same account that you are transferring from.${separator}`)
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
                                    console.log(`\n${separator}\nPlease enter a valid dollar amount.\n${separator}\n`)
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
                                    console.log(`\n${separator}\nPlease enter a valid dollar amount.\n${separator}\n`)
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
                let currentChecking = results[0].checking;
                let currentSavings = results[0].savings;
                currentChecking -= amount;
                currentSavings += amount;

                connection.query('UPDATE users SET `checking` = ?, `savings` = ? WHERE user_name = ?', [currentChecking, currentSavings, userNameSave], function (error, results, fields) {
                    if (error) throw error;
                    console.log(`\n${separator}\n$${amount} transferred from ${from} account to ${to} account.\nNew balances:\nSavings: ${currentSavings}\nChecking: ${currentChecking}\n${separator}\n`)
                    continueSession();
                });
            });
            break;
        case 'savings':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                let currentChecking = results[0].checking;
                let currentSavings = results[0].savings;
                currentChecking += amount;
                currentSavings -= amount;

                connection.query('UPDATE users SET `checking` = ?, `savings` = ? WHERE user_name = ?', [currentChecking, currentSavings, userNameSave], function (error, results, fields) {
                    if (error) throw error;
                    console.log(`\n${separator}\n$${amount} transferred from ${from} account to ${to} account.\nNew balances:\nSavings: ${currentSavings}\nChecking: ${currentChecking}\n${separator}\n`)
                    continueSession();
                });
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

// connection query function using command????
const conQuery = (command, amount) => {
    console.log(command)
    switch (command) {
        case 'balance_checking':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                console.log(`${separator}Checking Account Balance: ${results[0].checking}${separator}`);
                continueSession();
            });
            break;
        case 'deposit_checking':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                console.log(results[0].checking)
                let currentChecking = results[0].checking;
                currentChecking += amount;

                connection.query('UPDATE users SET `checking` = ? WHERE user_name = ?', [currentChecking, userNameSave], function (error, results, fields) {
                    if (error) throw error;
                    console.log(`\n${separator}\nDeposited ${amount} into Checking account. New balance is ${currentChecking}\n${separator}\n`)
                    continueSession();
                });
            });
            break;
        case 'withdraw_checking':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                console.log(results[0].checking)
                let currentChecking = results[0].checking;
                currentChecking -= amount;

                connection.query('UPDATE users SET `checking` = ? WHERE user_name = ?', [currentChecking, userNameSave], function (error, results, fields) {
                    if (error) throw error;
                    console.log(`\n${separator}\nWithdrew ${amount} from Checking account. New balance is ${currentChecking}\n${separator}\n`)
                    continueSession();
                });
            });
            break;
        case 'balance_savings':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                console.log(`${separator}Savings Account Balance: ${results[0].savings}${separator}`);
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
                    console.log(`\n${separator}\nDeposited ${amount} into Savings account. New balance is ${currentSavings}\n${separator}\n`)
                    continueSession();

                });
            });
            break;
        case 'withdraw_savings':
            connection.query('SELECT * FROM users WHERE user_name = ?', [userNameSave], function (error, results, fields) {
                if (error) throw error;
                let currentSavings = results[0].savings;
                currentSavings -= amount;

                connection.query('UPDATE users SET `savings` = ? WHERE user_name = ?', [currentSavings, userNameSave], function (error, results, fields) {
                    if (error) throw error;
                    console.log(`\n${separator}\nWithdrew ${amount} from Savings account. New balance is ${currentSavings}\n${separator}\n`)
                    continueSession();

                });
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



// start session
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    userNamePrompt();
});