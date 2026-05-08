// server/utils/response.js

export const sendResponse = (statusCode, message, data = null) => {
  return {
    statusCode,
    message,
    data,
  };
};