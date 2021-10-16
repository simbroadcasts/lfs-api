# lfs-api

Make [Live for Speed](https://lfs.net) JSON API queries in your NodeJS projects.

**Note:** This module should only be used in your NodeJS back-end. The LFS API uses client secrets which should not be used in front-end/browser codebases.

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
// With request API methods (recommended)
const fz5sc = await api.getVehicleMod(7097617);

// Based on endpoint url
const vehiclemods = await api.makeRequest("vehiclemod");
```

---

## Basic API

### `LFSAPI.constructor(client_id, client_secret)`

Create an LFS API instance.

#### Parameters

`client_id` _string_ - Your application's client id  
`client_secret` _string_ - Your application's client secret

### **`async`** `LFSAPI.makeRequest(endpoint)`

Make an LFS API request based on the full API endpoint string. It is recommended to use one of the [API request methods](#Request-API) listed below.

#### Parameters

`endpoint` _string_ - An LFS API endpoint

---

## Request API

The LFS API currently offers the following methods:

- [getHosts](#async-lfsapigethosts)
- [getHost(id)](#async-lfsapigethostid)
- [getVehicleMods](#async-lfsapigetvehiclemods)
- [getVehicleMod(id)](#async-lfsapigetvehiclemodid)

### **`async`** `LFSAPI.getHosts`

List all hosts

### **`async`** `LFSAPI.getHost(id)`

Get specific host by ID

#### Parameters

`id` _string_ - Host ID

### **`async`** `LFSAPI.getVehicleMods`

List all vehicle mods

### **`async`** `LFSAPI.getVehicleMod(id)`

Get specific vehicle mod by ID

#### Parameters

`id` _string_ - Vehicle mod ID

---

## Helpers

### `LFS.setVerbose(verbose)`

Toggle debug logging

`verbose` _boolean_ - Verbose debug messages
