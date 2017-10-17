'use strict';

var RequestUtil = {};

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

module.exports = RequestUtil;
