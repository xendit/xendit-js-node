'use strict';

var RequestUtil = require('./utils/request_util');
var CreditCardUtil = require('./utils/credit_card_util');

if (!window.btoa) {
    window.btoa = require('base-64').encode;
}

function Card (Xendit) {
    this._xendit = Xendit;
}

Card.prototype.createToken = function (tokenData, callback) {
    tokenData.is_multiple_use = tokenData.is_multiple_use !== undefined ? tokenData.is_multiple_use : false;
    tokenData.should_authenticate = tokenData.should_authenticate !== undefined ? tokenData.should_authenticate : true;

    if (!tokenData.is_multiple_use && (isNaN(tokenData.amount) || Number(tokenData.amount) < 0)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Amount must be a number equal or greater than 0' });
    }

    if (!CreditCardUtil.isCreditCardNumberValid(tokenData.card_number)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card number is invalid' });
    }

    if (!CreditCardUtil.isCreditCardExpirationDateValid(tokenData.card_exp_month, tokenData.card_exp_year)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card expiration date is invalid' });
    }

    if (!CreditCardUtil.isCreditCardCVNValid(tokenData.card_cvn)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card CVN is invalid' });
    }

    if (!CreditCardUtil.isCreditCardCVNValidForCardType(tokenData.card_cvn, tokenData.card_number)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card CVN is invalid for this card type' });
    }

    this._createCreditCardToken(tokenData, function (err, creditCardCharge) {
        if (err) {
            return callback(err);
        }

        callback(null, creditCardCharge);
    });
};

Card.prototype.createTokenV1 = function (transactionData, transactionMetadata, callback) {
    var self = this;

    transactionData.is_multiple_use = transactionData.is_multiple_use !== undefined ? transactionData.is_multiple_use : false;
    transactionData.should_authenticate = transactionData.should_authenticate !== undefined ? transactionData.should_authenticate : true;

    if (arguments.length === 2) {
        callback = transactionMetadata;
        transactionMetadata = null;
    }

    if (!transactionData.is_multiple_use && (isNaN(transactionData.amount) || Number(transactionData.amount) < 0)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Amount must be a number equal or greater than 0' });
    }

    if (!CreditCardUtil.isCreditCardNumberValid(transactionData.card_number)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card number is invalid' });
    }

    if (!CreditCardUtil.isCreditCardExpirationDateValid(transactionData.card_exp_month, transactionData.card_exp_year)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card expiration date is invalid' });
    }

    if (!CreditCardUtil.isCreditCardCVNValid(transactionData.card_cvn)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card CVN is invalid' });
    }

    if (!CreditCardUtil.isCreditCardCVNValidForCardType(transactionData.card_cvn, transactionData.card_number)) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Card CVN is invalid for this card type' });
    }

    this._getTokenizedCreditCard(transactionData, function (err, tokenizedCreditCard) {
        if (err) {
            return callback(err);
        }

        if (transactionMetadata !== null) {
            transactionMetadata.credit_card_type = CreditCardUtil.getCardType(transactionData.card_number);
            transactionMetadata.device_fingerprint_id = self._xendit._device_fingerprint_id;
        }

        self._createCreditCardTokenV1(tokenizedCreditCard.token, transactionData, transactionMetadata, function (err, creditCardCharge) {
            if (err) {
                return callback(err);
            }

            callback(null, creditCardCharge);
        });
    });
};

Card.prototype.createAuthentication = function (authenticationData, transactionMetadata, callback) {
    var self = this;

    if (arguments.length === 2) {
        callback = transactionMetadata;
        transactionMetadata = null;
    }

    if (isNaN(authenticationData.amount) || Number(authenticationData.amount) < 0) {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Amount must be a number equal or greater than 0' });
    }

    if ((typeof authenticationData.token_id) !== 'string') {
        return callback({ error_code: 'VALIDATION_ERROR', message: 'Token id must be a string' });
    }

    self._createAuthentication(authenticationData, transactionMetadata, function (err, authentication) {
        if (err) {
            return callback(err);
        }

        callback(null, authentication);
    });
};

Card.prototype.validateCardNumber = function (cardNumber) {
    return CreditCardUtil.isCreditCardNumberValid(cardNumber);
};

Card.prototype.validateExpiry = function (expMonth, expYear) {
    return CreditCardUtil.isCreditCardExpirationDateValid(expMonth, expYear);
};

Card.prototype.validateCvn = function (cvn) {
    return CreditCardUtil.isCreditCardCVNValid(cvn);
};

Card.prototype.validateCvnForCardType = function (cvn, cardNumber) {
    return CreditCardUtil.isCreditCardCVNValidForCardType(cvn, cardNumber);
};

Card.prototype._getTokenizationConfiguration = function (callback) {
    var publicApiKey = this._xendit._getPublishableKey();
    var basicAuthCredentials = 'Basic ' + window.btoa(publicApiKey + ':');
    var xenditBaseURL = this._xendit._getXenditURL();

    RequestUtil.request({
        method: 'GET',
        url: xenditBaseURL + '/credit_card_tokenization_configuration',
        headers: { Authorization: basicAuthCredentials }
    }, callback);
};

Card.prototype._getTokenizedCreditCard = function (transactionData, callback) {
    var self = this;

    this._getTokenizationConfiguration(function (err, tokenizationConfiguration) {
        if (err) {
            return callback(err);
        }

        self._tokenizeCreditCard(tokenizationConfiguration, transactionData, callback);
    });
};

Card.prototype._tokenizeCreditCard = function (tokenizationConfiguration, transactionData, callback) {
    var baseFlexUrl = this._xendit._getEnvironment() === 'PRODUCTION' ? tokenizationConfiguration.flex_production_url : tokenizationConfiguration.flex_development_url;
    var flexUrl = baseFlexUrl + '/cybersource/flex/v1/tokens';

    RequestUtil.request({
        method: 'POST',
        url: flexUrl,
        body: {
            keyId: tokenizationConfiguration.tokenization_auth_key_id,
            cardInfo: {
                cardNumber: transactionData.card_number,
                cardExpirationMonth: transactionData.card_exp_month,
                cardExpirationYear: transactionData.card_exp_year,
                cardType: CreditCardUtil.getCardType(transactionData.card_number)
            }
        }
    }, function (err, response) {
        if (err) {
            var errorResponse;

            if (!err.responseStatus || !err.responseStatus.reason) {
                return callback({
                    error_code: 'SERVER_ERROR',
                    message: 'Something unexpected happened, we are investigating this issue right now'
                });
            }

            switch (err.responseStatus.reason) {
                case 'VALIDATION_ERROR': errorResponse = {
                    error_code: 'VALIDATION_ERROR',
                    message: err.responseStatus.message
                }; break;
                default: errorResponse = {
                    error_code: 'TOKENIZATION_ERROR',
                    message: err.responseStatus.message
                };
            }

            return callback(errorResponse);
        }

        callback(null, response);
    });
};

Card.prototype._createCreditCardToken = function (tokenData, callback) {
    var publicApiKey = this._xendit._getPublishableKey();
    var basicAuthCredentials = 'Basic ' + window.btoa(publicApiKey + ':');
    var xenditBaseURL = this._xendit._getXenditURL();

    var body = {
        is_single_use: !tokenData.is_multiple_use,
        card_data: {
            account_number: tokenData.card_number,
            exp_month: tokenData.card_exp_month,
            exp_year: tokenData.card_exp_year,
            cvn: tokenData.card_cvn
        },
        should_authenticate: tokenData.should_authenticate,
    };
    
    if(!body.is_single_use && body.card_data.cvn === '' || body.card_data.cvn === null) {
        delete body.card_data.cvn;
    }

    if (tokenData.amount !== undefined && tokenData.amount !== '') {
        body.amount = tokenData.amount;
    }

    if (tokenData.card_cvn !== undefined && tokenData.card_cvn !== '') {
        body.card_cvn = tokenData.card_cvn;
    }

    RequestUtil.request({
        method: 'POST',
        url: xenditBaseURL + '/v2/credit_card_tokens',
        headers: { Authorization: basicAuthCredentials },
        body: body
    }, callback);
};

Card.prototype._createCreditCardTokenV1 = function (creditCardToken, transactionData, transactionMetadata, callback) {
    var publicApiKey = this._xendit._getPublishableKey();
    var basicAuthCredentials = 'Basic ' + window.btoa(publicApiKey + ':');
    var xenditBaseURL = this._xendit._getXenditURL();

    var body = {
        is_authentication_bundled: !transactionData.is_multiple_use,
        credit_card_token: creditCardToken,
        should_authenticate: transactionData.should_authenticate,
    };

    if (transactionData.amount !== undefined && transactionData.amount !== '') {
        body.amount = transactionData.amount;
    }

    if (transactionData.card_cvn !== undefined && transactionData.card_cvn !== '') {
        body.card_cvn = transactionData.card_cvn;
    }

    if (transactionMetadata !== null) {
        body.transaction_metadata = transactionMetadata;
    }

    RequestUtil.request({
        method: 'POST',
        url: xenditBaseURL + '/credit_card_tokens',
        headers: { Authorization: basicAuthCredentials },
        body: body
    }, callback);
};

Card.prototype._createAuthentication = function (authenticationData, transactionMetadata, callback) {
    var publicApiKey = this._xendit._getPublishableKey();
    var basicAuthCredentials = 'Basic ' + window.btoa(publicApiKey + ':');
    var xenditBaseURL = this._xendit._getXenditURL();

    var body = {
        amount: authenticationData.amount
    };

    if (transactionMetadata !== null) {
        body.transaction_metadata = transactionMetadata;
    }

    RequestUtil.request({
        method: 'POST',
        url: xenditBaseURL + '/credit_card_tokens/' + authenticationData.token_id + '/authentications',
        headers: { Authorization: basicAuthCredentials },
        body: body
    }, callback);
};

module.exports = Card;
