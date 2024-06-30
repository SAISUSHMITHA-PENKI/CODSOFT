const display = document.querySelector(".display p");
const buttons = document.querySelectorAll(".buttons button");
let expression = "";
let resultDisplayed = false;
let decimalEntered = false;
let lastInputWasOperator = false;
let memory = null;

buttons.forEach((button) => {
    button.addEventListener("click", () => {
        const input = button.textContent.trim();
        handleInput(input);
    });
    button.addEventListener("focus", () => {
        button.style.boxShadow = "0 0 0 2px white";
    });
    button.addEventListener("blur", () => {
        button.style.boxShadow = "none";
    });
});

document.addEventListener("keydown", handleKeyboardInput);

function handleInput(input) {
    if (input === "AC") {
        clearDisplay();
        return;
    }

    if (input === "=") {
        calculateResult();
        return;
    }

    if (input === "MS") {
        storeInMemory();
        return;
    }

    if (input === "MR") {
        recallFromMemory();
        return;
    }

    if (input === "%") {
        calculatePercentage();
        return;
    }

    if (resultDisplayed && !isOperator(input)) {
        expression = "";
        resultDisplayed = false;
    }

    if (isOperator(input) || input === "(" || input === ")") {
        if (lastInputWasOperator && isOperator(input) && input !== "-") {
            expression = expression.slice(0, -1) + input;
        } else {
            expression += input;
        }
        lastInputWasOperator = true;
    } else {
        if (input === "." && decimalEntered) {
            return;
        }
        if (input === ".") {
            decimalEntered = true;
        }
        if (lastInputWasOperator) {
            decimalEntered = false;
        }
        expression += input;
        lastInputWasOperator = false;
    }

    updateDisplay();
}

function updateDisplay() {
    display.textContent = expression || "0";
}

function calculateResult() {
    try {
        const result = evaluateExpression(expression);
        display.textContent = formatNumber(result);
        expression = result.toString();
        resultDisplayed = true;
    } catch (error) {
        displayError(error.message);
    }
}

function evaluateExpression(expr) {
    const tokens = tokenizeExpression(expr);
    const postfixTokens = infixToPostfix(tokens);
    const result = evaluatePostfixExpression(postfixTokens);
    if (!isFinite(result) || isNaN(result)) {
        throw new Error("Invalid expression: Math error");
    }
    return result;
}

function tokenizeExpression(expr) {
    const tokens = [];
    let currentNumber = "";
    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];
        if (!isNaN(parseInt(char)) || char === ".") {
            currentNumber += char;
        } else {
            if (currentNumber !== "") {
                tokens.push(parseFloat(currentNumber));
                currentNumber = "";
            }
            if (isOperator(char) || char === "(" || char === ")") {
                tokens.push(char);
            }
        }
    }
    if (currentNumber !== "") {
        tokens.push(parseFloat(currentNumber));
    }
    return tokens;
}

function infixToPostfix(tokens) {
    const postfixTokens = [];
    const operatorStack = [];
    const precedence = {
        "+": 1,
        "-": 1,
        "*": 2,
        "/": 2,
        "%": 2,
        "^": 3,
    };

    for (const token of tokens) {
        if (!isNaN(token)) {
            postfixTokens.push(token);
        } else if (token === "(") {
            operatorStack.push(token);
        } else if (token === ")") {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
                postfixTokens.push(operatorStack.pop());
            }
            if (operatorStack.length === 0) {
                throw new Error("Unbalanced parentheses");
            }
            operatorStack.pop();
        } else {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(" && precedence[token] <= precedence[operatorStack[operatorStack.length - 1]]) {
                postfixTokens.push(operatorStack.pop());
            }
            operatorStack.push(token);
        }
    }

    while (operatorStack.length > 0) {
        if (operatorStack[operatorStack.length - 1] === "(") {
            throw new Error("Unbalanced parentheses");
        }
        postfixTokens.push(operatorStack.pop());
    }

    return postfixTokens;
}

function evaluatePostfixExpression(tokens) {
    const stack = [];
    for (const token of tokens) {
        if (!isNaN(token)) {
            stack.push(token);
        } else {
            const b = stack.pop();
            const a = stack.length > 0 ? stack.pop() : 0;
            switch (token) {
                case "+":
                    stack.push(a + b);
                    break;
                case "-":
                    stack.push(a - b);
                    break;
                case "*":
                    stack.push(a * b);
                    break;
                case "/":
                    if (b === 0) {
                        throw new Error("Division by zero");
                    }
                    stack.push(a / b);
                    break;
                case "%":
                    if (b === 0) {
                        throw new Error("Modulo by zero");
                    }
                    stack.push(a % b);
                    break;
                case "^":
                    stack.push(Math.pow(a, b));
                    break;
            }
        }
    }
    if (stack.length !== 1) {
        throw new Error("Invalid expression");
    }
    return stack[0];
}

function clearDisplay() {
    expression = "";
    display.textContent = "0";
    resultDisplayed = false;
    decimalEntered = false;
}

function displayError(errorMessage) {
    display.textContent = `Error: ${errorMessage}`;
    expression = "Error";
}

function isOperator(input) {
    return ["+", "-", "*", "/", "%", "^"].includes(input);
}

function handleKeyboardInput(event) {
    const key = event.key;
    const isShiftPressed = event.shiftKey;

    if (!isNaN(parseInt(key)) || key === ".") {
        handleInput(key);
    } else if (key === "=" || key === "Enter") {
        calculateResult();
    } else if (key === "Backspace") {
        clearLastInput();
    } else if (key === "Escape") {
        clearDisplay();
    } else if (key === "Delete") {
        expression = "";
        display.textContent = "0";
        resultDisplayed = false;
    } else if (isShiftPressed && key !== "Shift") {
        switch (key) {
            case "9":
                handleInput("(");
                break;
            case "0":
                handleInput(")");
                break;
            case "5":
                handleInput("%");
                break;
            case "+":
                handleInput("+");
                break;
            case "-":
                handleInput("-");
                break;
            case "*":
                handleInput("*");
                break;
            case "/":
                handleInput("/");
                break;
            case "^":
                handleInput("^");
                break;
        }
    } else if (isOperator(key)) {
        handleInput(key);
    }
}

function storeInMemory() {
    if (!isNaN(parseFloat(expression))) {
        memory = parseFloat(expression);
    }
}

function recallFromMemory() {
    if (memory !== null) {
        expression += memory.toString();
        display.textContent = expression;
    }
}

function calculatePercentage() {
    if (!isNaN(parseFloat(expression))) {
        const result = parseFloat(expression) / 100;
        expression = result.toString();
        display.textContent = expression;
        resultDisplayed = true;
    }
}

function formatNumber(number) {
    if (Math.abs(number) >= 1e9 || (Math.abs(number) < 1e-9 && number !== 0)) {
        return number.toExponential(9);
    } else {
        return number.toString();
    }
}

function clearLastInput() {
    if (expression.length > 0) {
        expression = expression.slice(0, -1);
        updateDisplay();
    }
}
