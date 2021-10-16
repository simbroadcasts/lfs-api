# lfs-api

Make [Live for Speed](https://lfs.net) JSON API queries in your NodeJS projects.

## Install

Add this module to your project with `npm install lfs-api` or `yarn add lfs-api`

## Usage

Before you can make requests, you need to set up an application on the LFS API.

Once you have set up an application, you can use your `client_id` and `client_secret` to make LFS API calls in your app:

```js
// Import the LFSAPI module
import LFSAPI from "lfs-api";

// Create an api class instance
const api = new LFSAPI("YOUR_CLIENT_API", "YOUR_CLIENT_SECRET");

// Make queries
const query = await api.makeRequest("vehiclemod");
```

## API

### `LFSAPI.constructor(client_id, client_secret)`

Create an LFS API instance.

#### Parameters

`client_id` _string_ - Your application's client id  
`client_secret` _string_ - Your application's client secret

### **`async`** `LFSAPI.makeRequest(endpoint)`

Make an LFS API request.

#### Parameters

`endpoint` _string_ - An LFS API endpoint

### `LFS.setVerbose(verbose)`

Toggle debug logging

`verbose` _boolean_ - Verbose debug messages
