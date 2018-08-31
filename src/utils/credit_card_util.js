'use strict';

function CreditCardUtil() {}

var CYBCardTypes = {
    VISA: '001',
    MASTERCARD: '002',
    AMEX: '003',
    DISCOVER: '004',
    JCB: '007',
    VISA_ELECTRON: '033',
    DANKORT: '034'
};

var NUMBER_REGEX = /^\d+$/;

CreditCardUtil.isCreditCardNumberValid = function (creditCardNumber) {
    return NUMBER_REGEX.test(creditCardNumber) &&
        creditCardNumber.length >= 12 &&
        creditCardNumber.length <= 19 &&
        CreditCardUtil.getCardType(creditCardNumber) !== null &&
        CreditCardUtil.isValidLuhnNumber(creditCardNumber);
};

CreditCardUtil.isCreditCardExpirationDateValid = function (cardExpirationMonth, cardExpirationYear) {
    return NUMBER_REGEX.test(cardExpirationMonth) &&
        NUMBER_REGEX.test(cardExpirationYear) &&
        Number(cardExpirationMonth) >= 1 &&
        Number(cardExpirationMonth) <= 12 &&
        Number(cardExpirationYear) >= 2016 &&
        Number(cardExpirationYear) <= 2100;
};

CreditCardUtil.isCreditCardCVNValid = function (creditCardCVN) {
    if (creditCardCVN) {
        return NUMBER_REGEX.test(creditCardCVN) &&
            Number(creditCardCVN) >= 0 && String(creditCardCVN).length <= 4;
    } else {
        return true;
    }
};

CreditCardUtil.isCreditCardCVNValidForCardType = function (creditCardCVN, cardNumber) {
    if (creditCardCVN) {
        if (NUMBER_REGEX.test(creditCardCVN) && Number(creditCardCVN)) {
            return CreditCardUtil._isCardAmex(cardNumber) ? String(creditCardCVN).length === 4 : String(creditCardCVN).length === 3;
        }

        return false;
    } else {
        return true;
    }
};

CreditCardUtil.isValidLuhnNumber = function (cardNumber) {
    var sum = 0, bEven = false;
	cardNumber = cardNumber.replace(/\D/g, '');

	for (var n = cardNumber.length - 1; n >= 0; n--) {
		var cDigit = cardNumber.charAt(n);
		var nDigit = parseInt(cDigit, 10);

		if (bEven) {
			if ((nDigit *= 2) > 9) {
                nDigit -= 9;
            }
		}

		sum += nDigit;
		bEven = !bEven;
	}

	return (sum % 10) === 0;
};

CreditCardUtil.getCardType = function (cardNumber) {
    if (cardNumber.indexOf('4') === 0)  {
        if (CreditCardUtil._isCardVisaElectron(cardNumber)) {
            return CYBCardTypes.VISA_ELECTRON;
        } else {
            return CYBCardTypes.VISA;
        }
    } else if (CreditCardUtil._isCardAmex(cardNumber)) {
        return CYBCardTypes.AMEX;
    } else if (CreditCardUtil._isCardMastercard(cardNumber)) {
        return CYBCardTypes.MASTERCARD;
    } else if (CreditCardUtil._isCardDiscover(cardNumber)) {
        return CYBCardTypes.DISCOVER;
    } else if (CreditCardUtil._isCardJCB(cardNumber)) {
        return CYBCardTypes.JCB;
    } else if (CreditCardUtil._isCardDankort(cardNumber)) {
        return CYBCardTypes.DANKORT;
    } else {
        return null;
    }
};

CreditCardUtil._isCardAmex = function (cardNumber) {
    return cardNumber.indexOf('34') === 0 || cardNumber.indexOf('37') === 0;
};

CreditCardUtil._isCardMastercard = function (cardNumber) {
    var startingNumber = Number(cardNumber.substring(0, 2));
    return startingNumber >= 50 && startingNumber <=55;
};

CreditCardUtil._isCardDiscover = function (cardNumber) {
    var firstStartingNumber = Number(cardNumber.substring(0, 3));
    var secondStartingNumber = Number(cardNumber.substring(0, 6));

    return (firstStartingNumber >= 644 && firstStartingNumber <= 649) ||
        (secondStartingNumber >= 622126 && secondStartingNumber <= 622925) ||
        cardNumber.indexOf('65') === 0 ||
        cardNumber.indexOf('6011') === 0;
};

CreditCardUtil._isCardJCB = function (cardNumber) {
    var startingNumber = cardNumber.substring(0, 4);
    return startingNumber >= 3528 && startingNumber <= 3589;
};

CreditCardUtil._isCardMaestro = function (cardNumber) {
    return cardNumber.indexOf('5018') === 0 ||
    cardNumber.indexOf('5020') === 0 ||
    cardNumber.indexOf('5038') === 0 ||
    cardNumber.indexOf('5612') === 0 ||
    cardNumber.indexOf('5893') === 0 ||
    cardNumber.indexOf('6304') === 0 ||
    cardNumber.indexOf('6759') === 0 ||
    cardNumber.indexOf('6761') === 0 ||
    cardNumber.indexOf('6762') === 0 ||
    cardNumber.indexOf('6763') === 0 ||
    cardNumber.indexOf('0604') === 0 ||
    cardNumber.indexOf('6390') === 0;
};

CreditCardUtil._isCardDankort = function (cardNumber) {
    return cardNumber.indexOf('5019') === 0;
};

CreditCardUtil._isCardVisaElectron = function (cardNumber) {
    return cardNumber.indexOf('4026') === 0 ||
        cardNumber.indexOf('417500') === 0 ||
        cardNumber.indexOf('4405') === 0 ||
        cardNumber.indexOf('4508') === 0 ||
        cardNumber.indexOf('4844') === 0 ||
        cardNumber.indexOf('4913') === 0 ||
        cardNumber.indexOf('4917') === 0;
};

module.exports = CreditCardUtil;
