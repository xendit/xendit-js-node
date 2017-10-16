'use strict';

var Card = require('./card');

var STAGING_XENDIT_BASE_URL = 'https://api-staging.xendit.co';
var PRODUCTION_XENDIT_BASE_URL = 'https://api.xendit.co';

function Xendit() {}

Xendit.settings = {
    url: PRODUCTION_XENDIT_BASE_URL
};

Xendit.card = new Card(Xendit);

Xendit.setPublishableKey = function setPublishableKey(publishableKey) {
    Xendit.settings.publishable_key = publishableKey;
};

Xendit._useStagingURL = function (toggle) {
    Xendit.settings.url = toggle === false ? PRODUCTION_XENDIT_BASE_URL : STAGING_XENDIT_BASE_URL;
};

Xendit._getXenditURL = function () {
    return Xendit.settings.url;
};

Xendit._getPublishableKey = function () {
    return Xendit.settings.publishable_key;
};

Xendit._getEnvironment = function () {
    var normalizedKey = this._getPublishableKey().toUpperCase();
    var isKeyProduction = normalizedKey.indexOf('PRODUCTION') > -1;

    return isKeyProduction ? 'PRODUCTION' : 'DEVELOPMENT';
};

// global.Xendit = Xendit;
module.exports = Xendit;
