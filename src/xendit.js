'use strict';

var Card = require('./card');

var STAGING_XENDIT_BASE_URL = 'https://api-staging.xendit.co';
var PRODUCTION_XENDIT_BASE_URL = 'https://api.xendit.co';

var PRODUCTION_SONG_BIRD_URL = 'https://songbird.cardinalcommerce.com/edge/v1/songbird.js';
var STAGING_SONG_BIRD_URL = 'https://songbirdstag.cardinalcommerce.com/edge/v1/songbird.js';

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

Xendit.loadSongBird = function (environment, callback) {
    scriptTag = document.createElement('script');
    scriptTag.src = Xendit._getSongBirdUrl(environment);
    document.body.appendChild(scriptTag);
    scriptTag.onload = function () {
        callback();
    };
};

Xendit._getSongBirdUrl = function (environment) {
    if (environment.toUpperCase() === 'PRODUCTION') {
        return PRODUCTION_SONG_BIRD_URL;
    } else {
        return STAGING_SONG_BIRD_URL;
    }
};

// global.Xendit = Xendit;
module.exports = Xendit;
