# lfs-api

[![NPM Version](https://img.shields.io/npm/v/lfs-api?style=flat-square)](https://www.npmjs.com/package/lfs-api)

Query the [Live for Speed](https://lfs.net) OAuth2 API in your Web projects.

---

## Install

Add this module to your project with `npm install lfs-api` or `yarn add lfs-api`

---

## Supported Flows

Before you can make requests, you need to [register an application](https://lfs.net/account/api) with the LFS API. Next, choose the most appropriate LFS API OAuth2 flow for your project of those supported.

### Secure Applications

Secure applications are defined as follows:

> Your application can securely store a secret. The source code is hidden from the public.

- [Client Credentials Flow with Client Secret](#client-credentials-flow-with-client-secret)
- [Authorization Flow with Client Secret](#authorization-flow-with-client-secret)

### Insecure Applications

Insecure applications are defined as follows:

> Your application cannot securely store a secret because all source code is public domain E.g. Single Page Applications (SPAs).

- [Authorization flow with PKCE](#authorization-flow-with-pkce)

---

## Usage

### Client Credentials Flow with Client Secret

[`Secure apps only`](#secure-applications)

You can use your `client_id` and `client_secret` to make LFS API calls in your app:

```js
// Import the LFSAPI module
import LFSAPI from "lfs-api";

// Keep your client ID and secret out of version control!
import { CLIENT_ID, CLIENT_SECRET } from "./secrets";

// Create an api class instance
const api = new LFSAPI(CLIENT_ID, CLIENT_SECRET);

// Make queries
// 1) With request API methods (recommended)
const modList = await api.getVehicleMods();

// 2) Based on endpoint url
const myMod = await api.makeRequest("vehiclemod/39CEEB");
```

### Authorization Flow with Client Secret

[`Secure apps only`](#secure-applications)

This flow allows you to authenticate a user with their LFS account and make API requests based on the accepted OAuth2 scopes.

- Pass your `client_id`, `client_secret` and `redirect_uri` to the constructor.
- Next you will generate a URL to direct users to [lfs.net](https://lfs.net) to accept OAuth2 scopes. Pass a space separated list of scopes to `LFSAPI.generateAuthFlowURL(scope)`.
- Once a user clicks this URL and accepts the OAuth2 scopes, the user will be redirected to the `redirect_uri` you set in your [lfs.net API settings](https://lfs.net/account/api) (can be localhost for development and testing).
- This user is now authenticated. To identify the user, and to make calls to the API, you will now need to request access tokens using the autorization code in the URL query string with `LFSAPI.getAuthFlowTokens(code)`.
- Once these tokens have been received, you will get access to some protected API endpoints based on the accepted scope as well as all other API endpoints.

You can refresh tokens with `LFSAPI.refreshAccessTokens(refreshToken)`.

Here's a short example:

```js
// Import the LFSAPI module
import LFSAPI from "lfs-api";

// Optional: Choose a suitable library for your CSRF token E.g. uuid
import { v4 as uuidv4 } from "uuid";

// Keep your client ID and secret out of version control!
import { CLIENT_ID, CLIENT_SECRET } from "./secrets";

// Create an api class instance with your client ID, secret and redirect uri
const api = new LFSAPI(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:3100/api/v1/lfs"
);

// Generate an auth URL for users to authenticate with lfs.net
// Include scopes and optional CSRF token arguments
const csrf = uuidv4();
const { authURL } = api.generateAuthFlowURL("openid email profile", csrf);

// Or let lfs-api generate a CSRF Token for you:
const { authURL, csrfToken } = api.generateAuthFlowURL("openid email profile");

// Once the user visited your auth url...
// ...has accepted scopes at lfs.net...
// ...has been returned to your redirect uri...
// ...you will need to generate a set of tokens.

// Use the authorization code from the response URL to generate tokens
const authFlowTokens = await api.getAuthFlowTokens(req.query.code);
// This example uses ExpressJS to access the query ^^^^^^^^^^^^^^

// You can then store these tokens in a database and set cookies.
// This is left as an exercise for the reader

// You can now access the API by sending your token along with each request
const user = await api.getUserInfo(authFlowTokens.access_token);
const mod = await api.getVehicleMod("39CEEB", authFlowTokens.access_token);

// The LFSAPI.getAuthFlowTokens() method also receives a refresh token and an expiry in seconds.
// The latter is useful for checking ahead of time whether an access token has expired.
// You can use the refresh token to get a new set of tokens:
const newTokens = await api.refreshAccessToken(authFlowTokens.refresh_token);
// You would normally retrieve this refresh token from your database rather than using it directly.
```

### Authorization flow with PKCE

This flow allows you to authenticate a user with their LFS account and make API requests based on the accepted scopes in insecure applications E.g. Single Page Apps (SPAs).

- Pass your `client_id`, `client_secret` and `redirect_uri` to the constructor. The 4th argument (`spa`) should be set to `true` to mark this app as an insecure app.
- Next you will generate a URL to direct users to [lfs.net](https://lfs.net) to accept OAuth2 scopes. Pass a space separated list of scopes to `LFSAPI.generateAuthFlowURL(scope)`.
- At this point you will need to store the PKCE challenge verifier in a cookie (or local/session storage) to use after a user is redirected back to your app. You can get the verifier using `LFSAPI.getPKCEVerifier()`.
- Once a user clicks the URL you generated earlier and accepts the OAuth2 scopes, the user will be redirected to the `redirect_uri` you set in your [lfs.net API settings](https://lfs.net/account/api) (can be localhost for development and testing).
- This user is now authenticated. To identify the user, and to make calls to the API:
  - First, you will need to let `lfs-api` know about the PKCE challenge verifier you stored earlier with `LFSAPI.setPKCEVerifier(codeVerifier)`.
  - You can now request access tokens using the autorization code in the URL query string with `LFSAPI.getAuthFlowTokens(code)`
- Once these tokens have been received, you will get access to some protected API endpoints based on the accepted scope as well as all other API endpoints.

**Remember:** Don't forget to remove the PKCE code verifier cookie or session/localstorage object.

Here's a short example using [React](https://reactjs.org):

```jsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";
import Cookies from "js-cookie";
import LFSAPI from "lfs-api";
import { CLIENT_ID, CLIENT_SECRET } from "./secrets";

const api = new LFSAPI(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:3000/",
  true // Marks this app as an SPA
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<h1>404</h1>} />
      </Routes>
    </Router>
  );
}

function Home() {
  const [searchParams] = useSearchParams();
  const [authURL, setAuthURL] = useState("");
  const [user, setUser] = useState();

  useEffect(() => {
    async function authFlow() {
      // Generate auth flow URL
      const authFlowURL = await api.generateAuthFlowURL("openid profile email");

      // Code Verifier Cookie Exists
      if (Cookies.get("codeVerifier")) {
        // Set verifier if exists in cookie
        api.setPKCEVerifier(Cookies.get("codeVerifier"));
      }

      // If code and no cookie...
      if (!Cookies.get("accessToken") && searchParams.get("code")) {
        const authFlowTokens = await api.getAuthFlowTokens(
          searchParams.get("code")
        );

        // Set cookies
        Cookies.set("accessToken", authFlowTokens.access_token);
        Cookies.set("refreshToken", authFlowTokens.refresh_token);
        Cookies.set("expires", Date.now() / 1000 + authFlowTokens.expires_in);

        // Remove invalid code verifier cookie
        Cookies.remove("codeVerifier");
      }

      // If code verifier cookie hasn't been set yet, set it
      if (!Cookies.get("codeVerifier")) {
        Cookies.set("codeVerifier", api.getPKCEVerifier());
      }

      if (Cookies.get("accessToken")) {
        if (Cookies.get("expires") < Date.now() / 1000) {
          // Access token expired!
          // Check for expiration and get new tokens with refresh token...
        }
        // Use protected APIs...
        const user = await api.getUserInfo(Cookies.get("accessToken"));
        setUser(user);
      }

      setAuthURL(authFlowURL.authURL);
    }
    authFlow();
  }, [searchParams]);

  return (
    <>
      {user ? (
        `Welcome ${user.data.name}!`
      ) : (
        <a href={authURL}>Authenticate with lfs.net</a>
      )}
    </>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
```

This example doesn't handle refreshing a token, that is left as an exercise for the reader. You can refresh tokens with `LFSAPI.refreshAccessTokens(refreshToken)`.

---

## Basic API

### `LFSAPI.constructor(client_id, client_secret, [redirect_url], [spa])`

Create an LFS API class instance.

#### Parameters

| Parameter       | Type      | Description                                                           |
| --------------- | --------- | --------------------------------------------------------------------- |
| `client_id`     | _string_  | Your application's client ID                                          |
| `client_secret` | _string_  | Your application's client secret                                      |
| `redirect_uri`  | _string_  | Your application's redirect URI (Use only with Auth Flow)             |
| `spa`           | _boolean_ | Mark this application as insecure (Use only with Auth Flow with PKCE) |

#### Example

```js
// Import the LFSAPI module
import LFSAPI from "lfs-api";

// Keep your client ID and secret out of version control!
import { CLIENT_ID, CLIENT_SECRET } from "./secrets";

// Create an api class instance for Client Credentials flow
const api = new LFSAPI(CLIENT_ID, CLIENT_SECRET);

// Create an api class instance for Authorization flow
const authApi = new LFSAPI(
  CLIENT_ID,
  CLIENT_SECRET,
  "https://localhost:3100/api/v1/lfs"
);
```

### **`async`** `LFSAPI.makeRequest(endpoint, [token])`

Make an LFS API request based on the full API endpoint string. It is recommended to use one of the [API request methods](#api-methods) listed below.

#### Parameters

| Parameter  | Type     | Description                            |
| ---------- | -------- | -------------------------------------- |
| `endpoint` | _string_ | An LFS API endpoint                    |
| `token`    | _string_ | Access token (Use only with Auth Flow) |

#### Returns

API response as JSON object (see below for examples)

### `LFSAPI.generateAuthFlowURL(scope, [state])`

Generate a URL for authorization flow to direct users to [lfs.net](https://lfs.net) for authentication. You can include a CSRF token and the scopes below.

#### Parameters

| Parameter | Type     | Description                                                                                                                          |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `scope`   | _string_ | A space delimited string of scopes (see table below)                                                                                 |
| `state`   | _string_ | A [CSRF Token](https://en.wikipedia.org/wiki/Cross-site_request_forgery) (Optional). If not specified, one will be generated for you |

#### Scopes

| Scope     | Type     | Description                                      |
| --------- | -------- | ------------------------------------------------ |
| `openid`  | Required | Gives just the user ID                           |
| `profile` | Optional | Adds the username and last profile update date   |
| `email`   | Optional | Adds the email address and whether it's verified |

#### Example Code

```js
// Choose a suitable library for your CSRF token E.g. uuid
import { v4 as uuidv4 } from "uuid";

// Generate an auth URL for users to authenticate with lfs.net
// Include scopes and optional CSRF token arguments
const csrf = uuidv4();
const { authURL } = api.generateAuthFlowURL("openid email profile", csrf);

// Or let lfs-api generate a CSRF Token for you:
const { authURL, csrfToken } = api.generateAuthFlowURL("openid email profile");
```

#### Example Output

```js
{
  authURL: "https://id.lfs.net/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3100%2Fapi%2Fv1%2Flfs&scope=openid+profile&state=11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000",
  csrfToken: "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

### `LFSAPI.getAuthFlowTokens(code)`

Use authorization flow code returned from [lfs.net](https://lfs.net) during authentication in exchange for access and refresh tokens. Use only with auth flow.

When using auth flow with PKCE, you _must_ call [`LFSAPI.setPKCEVerifier(code_verifier)`](#lfsapisetpkceverifiercodeverifier) beforehand.

#### Parameters

| Parameter | Type     | Description                                                                                              |
| --------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `code`    | _string_ | The `code` query string parameter added by [lfs.net](https://lfs.net) when redirecting back to your site |

### `LFSAPI.refreshAccessToken(refresh_token)`

Returns a new access and refresh token. You should use the `expires_in` property from `LFSAPI.getAccessTokens()` to check whether an access token has expired before calling this function as this invalidates the previous access token and destroys a user session.

#### Parameters

| Parameter       | Type     | Description                                                                                      |
| --------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `refresh_token` | _string_ | A `refresh_token` previously received from `LFSAPI.getAccessTokens()` to refresh a user session. |

### `LFSAPI.getPKCEVerifier()`

Returns the code verifier part of the PKCE challenge pair. This should be used to set a cookie or LocalStorage entry during authorization flows with PKCE.

### `LFSAPI.setPKCEVerifier(code_verifier)`

Used to set the code verifier part of the PKCE challenge pair. This should be used to let `lfs-api` know what the current code verifier is once users are redirected back to your `redirect_uri` after scope confirmation. You should call this function before requesting access tokens.

#### Parameters

| Parameter       | Type     | Description                                                                         |
| --------------- | -------- | ----------------------------------------------------------------------------------- |
| `code_verifier` | _string_ | A PKCE code verifier retrieved from a cookie or storage prior to scope confirmation |

---

## API Methods

When using authorization flows, all API methods should be passed an access token as the last argument.

This module currently offers the following LFS API methods:

- [Hosts API](#hosts-api)
  - [getHosts](#async-lfsapigethosts)
  - [getHost(id)](#async-lfsapigethostid)
- [Vehicle Mods API](#vehicle-mods-api)
  - [getVehicleMods](#async-lfsapigetvehiclemods)
  - [getVehicleMod(id)](#async-lfsapigetvehiclemodid)
- [User API](#user-api)
  - [getUserInfo(token)](#async-lfsapigetuserinfotoken)

---

## Hosts API

### **`async`** `LFSAPI.getHosts([token])`

List all hosts that you are an admin of.

### **`async`** `LFSAPI.getHost(id, [token])`

Get specific host you are an admin of by ID: `id` _string_ - Host ID

### Hosts API Static Methods and Properties

- [lookupHostStatus(status)](#lfsapilookuphoststatusstatus)
  - `static` hostStatuses
- [lookupHostLocation(location)](#lfsapilookuphostlocationlocation)
  - `static` hostLocations

#### `LFSAPI.lookupHostStatus(status)`

Lookup the `status` property index fetched from the hosts API. A list of host statuses is available via the `LFSAPI.hostStatuses` static property.

#### `LFSAPI.lookupHostLocation(location)`

Lookup the `location` property index fetched from the hosts API. A list of host locations is available via the `LFSAPI.hostLocations` static property.

---

## Vehicle Mods API

### **`async`** `LFSAPI.getVehicleMods([token])`

List all vehicle mods

### **`async`** `LFSAPI.getVehicleMod(id, [token])`

Get specific vehicle mod by ID: `id` _string_ - Vehicle mod ID

### Vehicle Mods API Static Methods and Properties

- [lookupVehicleClassType(id)](#lfsapilookupvehicleclasstypeid)
  - `static` vehicleClassTypes
- [lookupVehicleICELayoutType(id)](#lfsapilookupvehicleicelayouttypeid)
  - `static` vehicleICELayoutTypes
- [lookupVehicleDriveType(id)](#lfsapilookupvehicledrivetypeid)
  - `static` vehicleDriveTypes
- [lookupVehicleShiftType(id)](#lfsapilookupvehicleshifttypeid)
  - `static` vehicleShiftTypes

#### `LFSAPI.lookupVehicleClassType(id)`

Lookup the `class` property index fetched from the vehicle API. A list of vehicle class types is available via the `LFSAPI.vehicleClassTypes` static property.

#### `LFSAPI.lookupVehicleICELayoutType(id)`

Lookup the `iceLayout` property index fetched from the vehicle API. A list of ICE layout types is available via the `LFSAPI.vehicleClassTypes` static property.

#### `LFSAPI.lookupVehicleDriveType(id)`

Lookup the `drive` property index fetched from the vehicle API. A list of drive types is available via the `LFSAPI.vehicleDriveTypes` static property.

#### `LFSAPI.lookupVehicleShiftType(id)`

Lookup the `shiftType` property index fetched from the vehicle API. A list of shift types is available via the `LFSAPI.vehicleShiftTypes` static property.

### Usage Example

Use helper methods to present vehicle properties.

```ts
// Request a vehicle mod details
const { data: FZ5V8SafetyCar } = await api.getVehicleMod("39CEEB");

// Destructure some properties
const { class: vehicleClass } = FZ5V8SafetyCar;
const { iceLayout, drive, shiftType } = FZ5V8SafetyCar.vehicle;

// Use helper methods...
const result = {
  class: api.lookupVehicleClassType(vehicleClass),
  iceLayout: api.lookupVehicleICELayoutType(iceLayout),
  drive: api.lookupVehicleDriveType(drive),
  shiftType: api.lookupVehicleShiftType(shiftType),
};
```

#### Expected output

```json
{
  "class": "Touring car",
  "iceLayout": "V",
  "drive": "Rear wheel drive",
  "shiftType": "H-pattern gearbox"
}
```

---

## User API

### **`async`** `LFSAPI.getUserInfo(token)`

**AUTHORIZATION FLOW ONLY - Required scopes:** `openid`  
Get information about the user you are authenticating

---

## Debug

### `LFSAPI.setVerbose(verbose)`

Toggle debug logging

`verbose` _boolean_ - Verbose debug messages

---

## Limitations

The PKCE flow is quite an involved process. It would be better if the library used `js-cookie` or `LocalStorage` natively to _optionally_ handle setting, removing and updating access tokens, refresh tokens and the PKCE code verifier from cookies/storage automatically. This is a planned update.
