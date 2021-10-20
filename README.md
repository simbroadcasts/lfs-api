# lfs-api

Make [Live for Speed](https://lfs.net) JSON API queries in your NodeJS projects.

**Note:** This module should only be used in your NodeJS back-end. The LFS API uses client secrets which should not be used in front-end/browser codebases.

## Install

Add this module to your project with `npm install lfs-api` or `yarn add lfs-api`

## Usage

This module currently supports the following LFS API flows:

- [Client Credentials Flow with Client Secret](#client-credentials-flow-with-client-secret)
- [Authorization Flow with Client Secret](#authorization-flow-with-client-secret)

### Client Credentials Flow with Client Secret

Before you can make requests, you need to set up an application on the LFS API.

Once you have set up an application, you can use your `client_id` and `client_secret` to make LFS API calls in your app:

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
const myMod = await api.makeRequest("vehiclemod/7097617");
```

### Client Credentials Flow with Client Secret

This flow allows you to authenticate a user with their LFS account.

- First you will generate a URL including your `client_id`, `scope`, `redirect_uri` and an optional CSRF token. The `redirect_uri` is set in your lfs.net API settings (can be localhost for development and testing).
- When a user clicks the URL they are directed to lfs.net to authenticate.
- Once a user has accepted the scope, they are returned to your site's `redirect_uri`.
- This user is now authenticated. To identify the user, you will now have access to some protected APIs based on the accepted scope.

```js
// Import the LFSAPI module
import LFSAPI from "lfs-api";

// Choose a suitable webserver
import express from "express";
import cors from "cors";

// Choose a suitable library for your CSRF token E.g. uuid
import { v4 as uuidv4 } from "uuid";

// Keep your client ID and secret out of version control!
import { CLIENT_ID, CLIENT_SECRET } from "./secrets";

// Create an api class instance with your client ID, secret and redirect uri
const api = new LFSAPI(CLIENT_ID, CLIENT_SECRET, "YOUR_REDIRECT_URI");

// Set up Express...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Generate an auth URL for users to authenticate with lfs.net
// Include scopes and CSRF token arguments
const { authURL } = api.authFlow("openid email profile", uuidv4());

// Create a route...
app.get("/api/v1/lfs/", async (req, res) => {
  // Read the ?code= query string when redirected back to your site from lfs.net
  if (req.query.code) {
    // Do something with the API to identify the user you are authenticating
    const user = await api.getUserInfo(req.query.code);
    // ...
  }
  // Display a button with the auth URL to the user
  res.send(`<a href="${authURL}">Authenticate with lfs.net</a>`);
});

// Listen on port 3100
app.listen(3100, () => console.log("Started: http://localhost:3100"));
```

---

## Basic API

### `LFSAPI.constructor(client_id, client_secret, [redirect_url], [overrides])`

Create an LFS API instance.

#### Parameters

| Parameter       | Type                            | Description                                |
| --------------- | ------------------------------- | ------------------------------------------ |
| `client_id`     | _string_                        | Your application's client ID               |
| `client_secret` | _string_                        | Your application's client secret           |
| `redirect_uri`  | _string_                        | Your application's redirect URI (Optional) |
| `overrides`     | { id: _string_, api: _string_ } | Override ID and API subdomains (Optional)  |

#### Example

```js
// Import the LFSAPI module
import LFSAPI from "lfs-api";

// Keep your client ID and secret out of version control!
import { CLIENT_ID, CLIENT_SECRET } from "./secrets";

// Create an api class instance
const api = new LFSAPI(CLIENT_ID, CLIENT_SECRET);
```

### **`async`** `LFSAPI.makeRequest(endpoint)`

Make an LFS API request based on the full API endpoint string. It is recommended to use one of the [API request methods](#Request-API) listed below.

#### Parameters

| Parameter  | Type     | Description                                                                           |
| ---------- | -------- | ------------------------------------------------------------------------------------- |
| `endpoint` | _string_ | An LFS API endpoint                                                                   |
| `code`     | _string_ | The `code` query string parameter added by lfs.net when redirecting back to your site |

#### Returns

JSON object (see below for examples)

### `LFSAPI.authFlow(scope, [state])`

Generate a URL for authorization flow to direct users to lfs.net for authentication. You can include a CSRF token and the scopes below.

#### Parameters

| Parameter | Type     | Description                                                                         |
| --------- | -------- | ----------------------------------------------------------------------------------- |
| `scope`   | _string_ | A space delimited string of scopes (see table below)                                |
| `state`   | _string_ | A [CSRF Token](https://en.wikipedia.org/wiki/Cross-site_request_forgery) (Optional) |

#### Scopes

| Scope     | Type     | Description                                      |
| --------- | -------- | ------------------------------------------------ |
| `openid`  | Required | Gives just the user ID                           |
| `profile` |          | Adds the username and last profile update date   |
| `email`   |          | Adds the email address and whether it's verified |

#### Example Code

```js
// Choose a suitable library for your CSRF token E.g. uuid
import { v4 as uuidv4 } from "uuid";

// Generate authorization flow activation URL with scopes and CSRF token
const { authURL } = api.authFlow("openid email profile", uuidv4());
```

#### Example Output

```
https://id.lfs.net/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3100%2Fapi%2Fv1%2Flfs&scope=openid+profile&state=11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000
```

---

## API Methods

The LFS API currently offers the following methods:

### Client Credentials Flow API

- [getHosts](#async-lfsapigethosts)
- [getHost(id)](#async-lfsapigethostid)
- [getVehicleMods](#async-lfsapigetvehiclemods)
- [getVehicleMod(id)](#async-lfsapigetvehiclemodid)

### **`async`** `LFSAPI.getHosts()`

List all hosts

### **`async`** `LFSAPI.getHost(id)`

Get specific host by ID

#### Parameters

`id` _string_ - Host ID

### **`async`** `LFSAPI.getVehicleMods()`

List all vehicle mods

### **`async`** `LFSAPI.getVehicleMod(id)`

Get specific vehicle mod by ID

#### Parameters

`id` _string_ - Vehicle mod ID

### Authorization Flow API

- [getUserInfo](#async-getuserinfo)

### **`async`** `LFSAPI.getUserInfo()`

Get information about the user you are authenticating

---

## Helpers

### `LFS.setVerbose(verbose)`

Toggle debug logging

`verbose` _boolean_ - Verbose debug messages
