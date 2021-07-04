const qs = require('querystring');
const axios = require("axios");
const fs = require("fs");

// init methode, die die keycloak config ausliest!

var keycloakTargetURL = undefined;
var keycloakUser = undefined;
var keycloakUserPassword = undefined;
var keycloakClientID = undefined;
var keycloakClientSecret = undefined;
var keycloakRealm = undefined;

var initKeycloak = function () {
  if (JSON.parse(process.env.KEYCLOAK_ENABLED)) {
    try {

      keycloakTargetURL = process.env.KEYCLOAK_AUTH_SERVER_URL;
        keycloakRealm = process.env.KEYCLOAK_REALM;
        keycloakClientID = process.env.KEYCLOAK_RESOURCE;
        keycloakUser = process.env.KEYCLOAK_ADMIN_RIGHTS_USER_NAME;
        keycloakUserPassword = process.env.KEYCLOAK_ADMIN_RIGHTS_USER_PASSWORD;
        
    } catch (error) {
      console.error("Error while initializing kommonitorKeycloakHelperService. Error while fetching and interpreting config file. Error is: " + error);
    }
  }
};

// run init process
initKeycloak();

const requestKeycloakToken = async function () {
  var parameters = {
    "username": keycloakUser,
    "password": keycloakUserPassword,
    "client_id": keycloakClientID,
    "grant_type": "password"
  };

  var keycloakBearerTokenURL = keycloakTargetURL + "realms/" + keycloakRealm + "/protocol/openid-connect/token";

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  return await axios.post(keycloakBearerTokenURL, qs.stringify(parameters), config)
    .then((response) => {
      /*
        {
            "access_token": "tokenString",
            "expires_in": 60,
            "refresh_expires_in": 1800,
            "refresh_token": "tokenString",
            "token_type": "bearer",
            "not-before-policy": 0,
            "session_state": "5d9d8418-be24-4641-a47c-3309bb243d8d",
            "scope": "email profile"
        }
      */
      return response.data["access_token"];
    })
    .catch((error) => {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      //$scope.error = response.statusText;
      console.error("Error while requesting auth bearer token from keycloak. Error is: \n" + error);
      throw error;
    })
};

const getKeycloakAxiosConfig = async function(){

  var config = {    
    headers: {}
  };

  if (JSON.parse(process.env.KEYCLOAK_ENABLED)){
    // get bearer token and make auth header
    var bearerToken = await requestKeycloakToken();

    config.headers= {
      'Authorization': 'Bearer ' + bearerToken
    }
  }

  return config;
};

exports.requestKeycloakToken = requestKeycloakToken;
exports.getKeycloakAxiosConfig = getKeycloakAxiosConfig;