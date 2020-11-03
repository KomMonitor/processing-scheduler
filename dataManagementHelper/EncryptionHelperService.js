'use strict';

const CryptoJS = require("crypto-js");

var isBase64 = function (str) {
  var notBase64 = /[^A-Z0-9+\/=]/i;
  const isString = (typeof str === 'string' || str instanceof String);

  if (!isString) {
    let invalidType;
    if (str === null) {
      invalidType = 'null';
    } else {
      invalidType = typeof str;
      if (invalidType === 'object' && str.constructor && str.constructor.hasOwnProperty('name')) {
        invalidType = str.constructor.name;
      } else {
        invalidType = `a ${invalidType}`;
      }
    }
    throw new TypeError(`Expected string but received ${invalidType}.`);
  }

  const len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false;
  }
  const firstPaddingChar = str.indexOf('=');
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === '=');

};

var decryptAesCBC = function (encryptedString) {

  var hashedKey = CryptoJS.SHA256(process.env.ENCRYPTION_PASSWORD);

  // from BASE64 encoded encrypted string
  var encryptedWordArray = CryptoJS.enc.Base64.parse(encryptedString);

  // get IV from beginning
  var iv = CryptoJS.lib.WordArray.create(
    encryptedWordArray.words.slice(0, (process.env.ENCRYPTION_IV_LENGTH_BYTE) / 4)
  );

  var decrypted = CryptoJS.AES.decrypt(
    {
      ciphertext: CryptoJS.lib.WordArray.create(
        encryptedWordArray.words.slice(process.env.ENCRYPTION_IV_LENGTH_BYTE / 4)
      )
    },
    hashedKey,
    { iv: iv }
  );

  var decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

  var decryptedJson = JSON.parse(decryptedString);

  // sometimes a response might still be BASE64 encoded in addition
  // if so, then resolve that
  if ((typeof decryptedJson === 'string' || decryptedJson instanceof String) && isBase64(decryptedJson)) {
    decryptedJson = CryptoJS.enc.Base64.parse(decryptedJson).toString(CryptoJS.enc.Utf8);
    decryptedJson = JSON.parse(decryptedJson);
  }

  return decryptedJson;
};

exports.decryptAPIResponseIfRequired = function (response) {
  // if encrypted, then will look like:
  // {encryptedData: encryptedData}
  // using AES-CBC

  if (process.env.ENCRYPTION_ENABLED && response.data.encryptedData) {
    try {
      var encryptedString = response.data.encryptedData;

      var decryptedJson = decryptAesCBC(encryptedString);

      response.data = decryptedJson;

      return response;
    } catch (error) {
      console.error(error);
      return response;
    }
  }

  return response;
};