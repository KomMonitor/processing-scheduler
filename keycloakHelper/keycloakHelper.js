const qs = require('querystring');

// init methode, die die keycloak config ausliest!

const keycloakTargetURL = undefined;
const keycloakUser = undefined;
const keycloakUserPassword = undefined;
const keycloakClientID = undefined;
const keycloakClientSecret = undefined;
const keycloakRealm = undefined;

var initKeycloak = function () {
  if (process.env.KEYCLOAK_ENABLED) {
    try {
      await axios.get('keycloak.json').then(async function (response) {
        var keycloakConfig = response.data;
        keycloakTargetURL = keycloakConfig['auth-server-url'];
        keycloakRealm = keycloakConfig['realm'];
        keycloakClientID = keycloakConfig['resource'];
        keycloakUser = keycloakConfig['keycloak-username'];
        keycloakUserPassword = keycloakConfig["keycloak-userpassword"];
      });
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
      console.error("Error while requesting auth bearer token from keycloak.");
      throw error;
    })
};

exports.requestKeycloakToken = requestKeycloakToken;