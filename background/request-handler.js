// background/request-handler.js
import { AD_DOMAIN_PATTERNS } from './ad-patterns.js';

const capturedRequests = new Map();

const onBeforeRequestHandler = (details) => {
  capturedRequests.set(details.requestId, {
    requestId: details.requestId,
    tabId: details.tabId,
    url: details.url,
    method: details.method,
    initiator: details.initiator,
    timeStamp: details.timeStamp,
    requestHeaders: [],
    responseHeaders: [],
    statusCode: null,
    statusLine: null,
    completed: false,
    error: null,
  });
};

const onSendHeadersHandler = (details) => {
  const req = capturedRequests.get(details.requestId);
  if (req) req.requestHeaders = details.requestHeaders;
};

const onResponseStartedHandler = (details) => {
  const req = capturedRequests.get(details.requestId);
  if (req) {
    req.statusCode = details.statusCode;
    req.statusLine = details.statusLine;
    req.responseHeaders = details.responseHeaders;
  }
};

const onCompletedHandler = (details) => {
  const req = capturedRequests.get(details.requestId);
  if (req) {
    req.completed = true;
    if (!req.statusCode) {
      req.statusCode = details.statusCode;
      req.statusLine = details.statusLine;
    }
  }
};

const onErrorOccurredHandler = (details) => {
  const req = capturedRequests.get(details.requestId);
  if (req) {
    req.error = details.error;
    req.completed = true;
  }
};

export const initRequestHandlers = () => {
  const filter = { urls: AD_DOMAIN_PATTERNS };
  chrome.webRequest.onBeforeRequest.addListener(onBeforeRequestHandler, filter);
  chrome.webRequest.onSendHeaders.addListener(onSendHeadersHandler, filter, ["requestHeaders"]);
  chrome.webRequest.onResponseStarted.addListener(onResponseStartedHandler, filter, ["responseHeaders"]);
  chrome.webRequest.onCompleted.addListener(onCompletedHandler, filter, ["responseHeaders"]);
  chrome.webRequest.onErrorOccurred.addListener(onErrorOccurredHandler, filter);
};

export const getDataForTab = (tabId) => {
  return Array.from(capturedRequests.values()).filter(req => req.tabId === tabId);
};

export const clearDataForTab = (tabId) => {
  if (!tabId) return;
  const keysToDelete = [];
  for (const [key, value] of capturedRequests.entries()) {
    if (value.tabId === tabId) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => capturedRequests.delete(key));
};