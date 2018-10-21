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

//-------------------------------------------
//             USER FUNCTIONS
//-------------------------------------------
// start off prompting user for username:
const userNamePrompt = function () {
    inquirer.prompt([{
        message: "What is your accounts user name:",
        name: "name",
    }]).then(user => {
        console.log("\nUsername: " + user.name)
        // query database for user if they exist
        connection.query('SELECT * FROM users WHERE user_name = ?', [user.name], function (error, results, fields) {
            if (error) throw error;
            // if user doesnt exist then we will run create user function
            if (results[0] === undefined) {
                console.log("No user with that username exists.")
                createUserPrompt(user.name);
            } else if (results[0].user_name === user.name) {
                // else if user exists prompt for PIN to login
                pinNumberPrompt(user.name, results[0].pin);
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
                checkBalance();
                break;
            case 'Deposit':
                console.log("Making Deposit");
                depositFunds();
                break;
            case 'Withdraw':
                console.log("Making Withdrawal");
                withdrawFunds();
                break;
            case 'Transfer Balance':
                console.log("Transferring from one account to another.");
                moneyTransfer();
                break;

            default:
                break;
        }
    })
}

// check balance function
const checkBalance = function () {
    inquirer.prompt([{
        message: `Which account would you like to check ${userNameSave}?`,
        type: "list",
        choices: ['Checking', 'Savings'],
        name: 'account'
    }]).then(which => {
        switch (which.account) {
            case 'Checking':
                console.log("Checking Balance: ");
                continueSession();
                break;

            case 'Savings':
                console.log("Savings Balance: ");
                continueSession();
                break;

            default:
                break;
        }
    })
}

// deposit funds function
const depositFunds = function () {

}

// withdraw funds function
const withdrawFunds = function () {

}

// transfer from one account to another
const moneyTransfer = function () {

}

// ask if customer would like another transaction
const continueSession = function () {
    inquirer.prompt([{
        message: "Would you like to make another transaction?",
        type: "confirm",
        default: false,
        name: "continue"
    }]).then(session => {
        if (session.continue === true) {
            whichCommand();
        } else {
            endSession();
        }
    })
}

// end session
const endSession = function () {
    connection.end()
}


// start session
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    userNamePrompt();
});
