'use strict';

var pjson = require('../../package.json');

var RequestUtil = {};
var CLIENT_TYPE = 'XENDIT_JS';

RequestUtil.request = function (requestData, responseHandler) {
    var request = new XMLHttpRequest();
    var body = requestData.body ? JSON.stringify(requestData.body) : null;
    var headers = requestData.headers ? requestData.headers : {};

    request.open(requestData.method, requestData.url, true);
    request.onreadystatechange = function () {
        if(request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                responseHandler(null, JSON.parse(request.responseText));
            } else {
                try {
                    responseHandler(JSON.parse(request.responseText));
                } catch (e) {
                    responseHandler({
                        error_code: 'SERVER_ERROR',
                        message: 'Sorry, we had a problem processing your request.'
                    });
                }
            }
        }
    };

    request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    for (var key in headers) {
        request.setRequestHeader(key, headers[key]);
    }

    request.send(body);
};

RequestUtil.getServerOptions = function (xendit) {
    var publicApiKey = xendit._getPublishableKey();
    var basicAuthCredentials = 'Basic ' + window.btoa(publicApiKey + ':');
    var xenditBaseURL = xendit._getXenditURL();

    var headers = {
        Authorization: basicAuthCredentials,
        'client-type': CLIENT_TYPE,
        'client-version': pjson.version
    };

    return {
        headers: headers,
        url: xenditBaseURL
    };
};

RequestUtil.hasHigherOrEqualMajorVersion = function (versionString, majorVersion) {
    var currentMajorVersion = versionString ? versionString.slice(0, versionString.indexOf('.')) : 1;
    return Number(currentMajorVersion) >= majorVersion;
};

module.exports = RequestUtil;
