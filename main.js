function calculate(numAndOperators) {  // Type: array
	let mathExpression = ``;

	for (let i = 0; i < numAndOperators.length; i++) {
		let element = numAndOperators[i];

		if (element === '−') {  // 유니코드가 다름
			element = '-';
		} else if (element === '×') {
			element = '*';
		} else if (element === '÷') {
			element = '/';
		} else if (element === `-`) {  // eval()은 `3--2`같이 '빼기 마이너스'를 인식 못 하므로 전처리
			let nextElement = numAndOperators[i + 1];
			if (nextElement.startsWith(`-`)) {  // '빼기 마이너스'를 플러스로 변환
				element = `+`;
				numAndOperators[i + 1] = nextElement.slice(1);
			}
		}

		if (element.startsWith(`√`)) {
			if (element.endsWith(`%`)) {  // √8% 식으로 둘이 같이 쓰였다면
				let number = Number(element.slice(1, -1));
				element = String(Math.sqrt(number) / 100);
			} else {
				let number = Number(element.slice(1));
				element = String(Math.sqrt(number));
			}
		} else if (element.endsWith(`%`)) {
			let number = Number(element.slice(0, -1));
			element = String(number / 100);
		}

		mathExpression += element;
	}

	let resultValue = Number(eval(mathExpression).toFixed(13)) // n.nnnnnnnnnnnnn

	if (999_999_999_999_999 < resultValue) {
		resultValue = 'OVER!';
	} else {
		resultValue = String(resultValue).slice(0, 15);  // 무조건 최대 15자릿수까지만 출력

		/*
		if (resultValue.includes('.')) {  // 너무 작은 수일 경우 '2.0003e-9' 꼴로 나와버림
			resultValue = String(Number(resultValue).toFixed(resultValue.split('.')[1].length));
		}
		*/
	}

	return resultValue;
}

/*
console.log(
	calculate(["√350", "*", "28%"])
);
console.log(
	calculate(["√8%"])
);
console.log(
	calculate(["-0.3", "+", "-0.4"])
);
console.log(
	calculate(["3", "-", "-2"])
);
console.log(
	calculate(["Math.PI"])
);
*/

let operandAndOperatorArray = []
let operand = '';  // 피연산자 (숫자) 1~13자리까지
let operator = '';  // 연산자 (기호) + - × ÷

const divisionLine = '---------------';

function getButtonInfo(clickedElement) {
	let buttonElement, pElement;

	if (clickedElement.tagName.toLowerCase() === 'button') {
		buttonElement = clickedElement;
		pElement = clickedElement.children[0];  // child가 아니라 childen이므로
	} else if (clickedElement.tagName.toLowerCase() === 'p') {
		buttonElement = clickedElement.parentElement;
		pElement = clickedElement;
	}

	const result = {
		class: buttonElement.className,
		text: pElement.innerText,
	}

	return result
}

function isOperandLengthErasable() {
	return 1 <= operand.length && operand.length <= 15;
}

function isOperandLengthAddable() {
	return 0 <= operand.length && operand.length <= 14;
}

function _eraseOperand() {
	if (isOperandLengthErasable()) {

		if (operand.endsWith('%')) {
			if (operand.endsWith('√%') || operand.endsWith('-%')) {
				operand = operand.slice(0, -1);
			} else {
				operand = operand.slice(0, -2) + '%';
			}
		} else {
			operand = operand.slice(0, -1);
		}

		/*
		if (operand.endsWith('%')) {
			if (!operand.endsWith('√%') && !operand.endsWith('-%')) {
				operand = operand.slice(0, -2) + '%';
			}
		} else if (!operand.endsWith('√')) {
			operand = operand.slice(0, -1);
		}
		*/
	}
}
function _addDecimalPoint() {
	if (isOperandLengthAddable() && !operand.includes('.')) {
		if (operand.length === 0) {
			operand = '0.';
		} else {
			operand += '.'
		}
	}
}
function _switchSqrt() {
	if (isOperandLengthAddable() && !operand.startsWith('√')) {
		if (operand.startsWith('-')) {  // 음수 & 루트 공존 불가능
			operand = '√' + operand.slice(1);
		} else {
			operand = '√' + operand;
		}
	} else if (operand.startsWith('√')) {
		operand = operand.slice(1);
	}
}
function _switchPersent() {
	if (isOperandLengthAddable() && !operand.endsWith('%')) {
		operand += '%';
	} else if (operand.endsWith('%')) {
		operand = operand.slice(0, -1);
	}
}
function _switchOperendSign() {
	if (isOperandLengthAddable() && !operand.startsWith('-')) {
		if (operand.startsWith('√')) {  // 음수 & 루트 공존 불가능
			operand = '-' + operand.slice(1);
		} else {
			operand = '-' + operand;
		}
	} else if (operand.startsWith('-')) {
		operand = operand.slice(1);
	}
}
function _addNumber(numberStr) {
	if (isOperandLengthAddable()) {
		if (operand.endsWith('%')) {
			operand = operand.slice(0, -1) + numberStr + '%';
		} else {
			operand += numberStr;
		}
	}
}
function _addOperator(btnText) {
	if (operand !== '') {
		operator = btnText;
		operandAndOperatorArray.push(operand, operator);
		operand = '';
	} else {  // 연산자 변경
		operator = btnText;
		operandAndOperatorArray.pop()
		operandAndOperatorArray.push(operator)
	}
}

let isEndedCalculate = false;

// √123456.1234567% : 기존자리 +3 입력 버그

$('#buttonsArea').on('click', (e) => {
	if (!['button', 'p'].includes(e.target.tagName.toLowerCase())) { return; }

	const btnInfo = getButtonInfo(e.target);  // 클릭된 HTML element
	let isModified = false;

	// console.log(`Button '${btnInfo.text}' Pushed.`);

	if (btnInfo.class.includes('number')) {  // subArea numbers
		if (isEndedCalculate) {
			addElementToScreen('', '');
			addElementToScreen('', '');
			isEndedCalculate = false;
		}

		if (isNaN(Number(btnInfo.text))) {  // . ▶
			if (btnInfo.class.includes('backspace')) {  // ▶ (맨 뒤 숫자 지우기)
				_eraseOperand();
			} else {  // . (소수점)
				_addDecimalPoint();
			}
		} else { // 0 1 2 3 4 5 6 7 8 9
			_addNumber(btnInfo.text);
		}
	} else if (btnInfo.class.includes('operator')) {  // subArea operators
		if (btnInfo.text === '=') {
			if (operandAndOperatorArray.length !== 0 || operand.includes('√') || operand.includes('%')) {
				if (operand == '%' || operand == '-' || operand == '√' || operand == '√%' || operand == '-%') {

				} else if (operand === '' && operator !== '') {

				} else {
					isModified = isEndedCalculate = true;
					if (operand.endsWith('.%')) {
						operand = operand.slice(0, -2) + '%';
						modifyElementToScreen('', operand);
					}
					operandAndOperatorArray.push(operand);
					const result = calculate(operandAndOperatorArray);
					addElementToScreen('', divisionLine);
					operator = operand = '';
					addElementToScreen('=', result);
					operandAndOperatorArray = [];
				}
			}
		} else if (btnInfo.text === '√') {
			if (isEndedCalculate) {
				addElementToScreen('', '');
				addElementToScreen('', '');
				isEndedCalculate = false;
			}
			_switchSqrt();
		} else if (btnInfo.text === '%') {
			if (isEndedCalculate) {
				addElementToScreen('', '');
				addElementToScreen('', '');
				isEndedCalculate = false;
			}
			_switchPersent();
		} else if (btnInfo.text === '±') {
			if (isEndedCalculate) {
				addElementToScreen('', '');
				addElementToScreen('', '');
				isEndedCalculate = false;
			}
			_switchOperendSign();
		} else {  // + - × ÷
			if (operand.length !== 0) {
				if (operand !== '√' && operand !== '%' && operand !== '-' && operand !== '√%' && operand !== '-%') {
					if (operand.endsWith('.')) {
						operand = operand.slice(0, -1);
						modifyElementToScreen('', operand);
					}
					if (operator.length === 0) {
						_addOperator(btnInfo.text);
						addElementToScreen(operator, operand);
					} else {
						_addOperator(btnInfo.text);
						addElementToScreen(operator, '');
					}
				}
			} else {  // 연산자 변경
				_addOperator(btnInfo.text);
			}
		}
	}
	console.log(`operator[${operator}], operand[${operand}], Array[${operandAndOperatorArray}]`);

	if (!isModified && !isEndedCalculate) {
		modifyElementToScreen(operator, operand);
	}
});

function modifyElementToScreen(_operator, _operand) {
	const $screenElement = $('#screen');
	$screenElement[0].removeChild($screenElement[0].lastChild);
	$('#screen').append(`<div><p>${_operator}</p><p>${_operand}</p></div>`);
}

function addElementToScreen(_operator, _operand) {
	const $screenElement = $('#screen');
	$screenElement.append(`<div><p>${_operator}</p><p>${_operand}</p></div>`);

	while (8 < $screenElement[0].childElementCount) {
		$screenElement[0].removeChild($screenElement[0].firstChild);
	}
}


$('#switch').on('click', (e) => {  // On/C 슬라이드 스위치
	const $screenElement = $('#screen');

	while ($screenElement[0].childElementCount > 0) {
		$screenElement[0].removeChild($screenElement[0].firstChild);
	}

	operandAndOperatorArray = [];
	operand = operator = '';
	isEndedCalculate = false;

	$screenElement.append(`<div><p></p><p></p></div>`);
});