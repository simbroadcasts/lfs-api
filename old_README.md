# lfs-api

Query the [Live for Speed](https://lfs.net) API in your projects.

---

## Install

Add this module to your project with `npm install lfs-api` or `yarn add lfs-api`

---

## Usage

Before you can make requests, you need to [register an application](https://lfs.net/account/api) with the LFS API. Next, choose the most appropriate LFS API OAuth2 flow of those supported.

### Secure Applications

Your application can securely store a secret. The source code is hidden from the public.

- [Client Credentials Flow with Client Secret](#client-credentials-flow-with-client-secret)
- [Authorization Flow with Client Secret](#authorization-flow-with-client-secret)

### Single Page Applications (SPAs)

Your application cannot securely store a secret because all source code is public domain.

- [Authorization flow with PKCE](#authorization-flow-with-pkce)

### Client Credentials Flow with Client Secret

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
const myMod = await api.makeRequest("vehiclemod/7097617");
```

### Authorization Flow with Client Secret

This flow allows you to authenticate a user with their LFS account.

- First you will generate a URL including your `client_id`, `scope`, `redirect_uri` and an optional CSRF token (`state`). The `redirect_uri` is set in your [lfs.net](https://lfs.net) API settings (can be localhost for development and testing).
- When a user clicks the URL they are directed to [lfs.net](https://lfs.net) to authenticate.
- Once a user has accepted the scope, they are returned to your site's `redirect_uri`.
- This user is now authenticated. To identify the user, you will now have access to some protected APIs based on the accepted scope.

```js
// Import the LFSAPI module
import LFSAPI from "lfs-api";

// Choose a suitable library for your CSRF token E.g. uuid
import { v4 as uuidv4 } from "uuid";

// Keep your client ID and secret out of version control!
import { CLIENT_ID, CLIENT_SECRET } from "./secrets";

// Create an api class instance with your client ID, secret and redirect uri
const api = new LFSAPI(CLIENT_ID, CLIENT_SECRET, "YOUR_REDIRECT_URI");

// Generate an auth URL for users to authenticate with lfs.net
// Include scopes and optional CSRF token arguments
const { authURL } = api.generateAuthFlowURL("openid email profile", uuidv4());

// Or let lfs-api generate a CSRF Token for you:
// const { authURL, csrfToken } = api.generateAuthFlowURL("openid email profile");
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

### **`async`** `LFSAPI.makeRequest(endpoint, [code])`

Make an LFS API request based on the full API endpoint string. It is recommended to use one of the [API request methods](#api-methods) listed below.

#### Parameters

| Parameter  | Type     | Description                                                                                              |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `endpoint` | _string_ | An LFS API endpoint                                                                                      |
| `code`     | _string_ | The `code` query string parameter added by [lfs.net](https://lfs.net) when redirecting back to your site |

#### Returns

JSON object (see below for examples)

### `LFSAPI.generateAuthFlowURL(scope, [state])`

Generate a URL for authorization flow to direct users to [lfs.net](https://lfs.net) for authentication. You can include a CSRF token and the scopes below.

#### Parameters

| Parameter | Type     | Description                                                                          |
| --------- | -------- | ------------------------------------------------------------------------------------ |
| `scope`   | _string_ | A space delimited string of scopes (see table below)                                 |
| `state`   | _string_ | A [CSRF Token](https://en.wikipedia.org/wiki/Cross-site_request_forgery) (Optional). |

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

// Generate an auth URL for users to authenticate with lfs.net
// Include scopes and optional CSRF token arguments
const { authURL } = api.generateAuthFlowURL("openid email profile", uuidv4());
// Or let lfs-api generate a CSRF Token for you:
// const { authURL, csrfToken } = api.generateAuthFlowURL("openid email profile");
```

#### Example Output

```js
{
  authURL: "https://id.lfs.net/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3100%2Fapi%2Fv1%2Flfs&scope=openid+profile&state=11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000",
  csrfToken: "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000"
}
```

### `LFSAPI.useAuthCode(code)`

Set authorization flow code returned from [lfs.net](https://lfs.net) during authentication. This method removes the need to pass the auth code to protected APIs on every call.

#### Parameters

| Parameter | Type     | Description                                                                                              |
| --------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `code`    | _string_ | The `code` query string parameter added by [lfs.net](https://lfs.net) when redirecting back to your site |

---

## API Methods

This module currently offers the following LFS API methods:

- [Hosts API](#hosts-api)
  - [getHosts](#async-lfsapigethosts)
  - [getHost(id)](#async-lfsapigethostid)
- [Vehicle Mods API](#vehicle-mods-api)
  - [getVehicleMods](#async-lfsapigetvehiclemods)
  - [getVehicleMod(id)](#async-lfsapigetvehiclemodid)
- [User API](#user-api)
  - [getUserInfo(code)](#async-lfsapigetuserinfocode)

---

## Hosts API

### **`async`** `LFSAPI.getHosts()`

List all hosts

### **`async`** `LFSAPI.getHost(id)`

Get specific host by ID: `id` _string_ - Host ID

---

## Vehicle Mods API

### **`async`** `LFSAPI.getVehicleMods()`

List all vehicle mods

### **`async`** `LFSAPI.getVehicleMod(id)`

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

Lookup the index fetched from `LFSAPI.getVehileMod(id).vehicle.class`. A list of vehicle class types is available via the `LFSAPI.vehicleClassTypes` static property.

#### `LFSAPI.lookupVehicleICELayoutType(id)`

Lookup the index fetched from `LFSAPI.getVehicleMod(id).vehicle.iceLayout`. A list of ICE layout types is available via the `LFSAPI.vehicleClassTypes` static property.

#### `LFSAPI.lookupVehicleDriveType(id)`

Lookup the index fetched from `LFSAPI.getVehileMod(id).vehicle.drive`. A list of drive types is available via the `LFSAPI.vehicleDriveTypes` static property.

#### `LFSAPI.lookupVehicleShiftType(id)`

Lookup the index fetched from `LFSAPI.getVehileMod(id).vehicle.shiftType`. A list of shift types is available via the `LFSAPI.vehicleShiftTypes` static property.

---

## User API

### **`async`** `LFSAPI.getUserInfo(code)`

**Required scopes:** `openid`  
Get information about the user you are authenticating

---

## Debug

### `LFSAPI.setVerbose(verbose)`

Toggle debug logging

`verbose` _boolean_ - Verbose debug messages
