"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const js_sha256_1 = require("js-sha256");
/**
 * @name LFSAPI
 * @description Make requests to the Live for Speed JSON API
 * @author Peter Butcher (PButcher) <pete[at]pbutcher[dot]com>
 * @param {string} client_id - LFS API Client ID
 * @param {string} client_secret - LFS API Client Secret
 * @param {string} [redirect_uri] - LFS API Redirect URI
 * @param {object} [overrides] - Endpoint subdomain overrides { id, api }
 */
class LFSAPI {
    constructor(client_id, client_secret, redirect_uri, spa, idURL, apiURL) {
        // LFS API Version
        this.version = "0.0.1";
        // Client ID
        this.client_id = client_id;
        // Client Secret
        this.client_secret = client_secret;
        // Auth Flow Redirect URL
        this.redirect_uri = redirect_uri;
        // Single Page Application
        this.spa = spa;
        // Code Challenge
        this.pkce = {
            code_verifier: null,
            code_challenge: null,
        };
        // ID Endpoint
        this.idURL = idURL ? idURL : "https://id.lfs.net";
        // API Endpoint
        this.apiURL = apiURL ? apiURL : "https://api.lfs.net";
        // Client Credentials FLow
        this.client_credentials_flow = {
            access_token: null,
            expires_in: 0,
        };
        // Verbose
        this.verbose = false;
    }
    /**
     * @private
     * @name _clientCredentialsFlowAccessTokenExpired
     * @description Has the client credentials flow access token expired?
     * @returns boolean - whether token has expired or not
     */
    _clientCredentialsFlowAccessTokenExpired() {
        return Date.now() / 1000 > this.client_credentials_flow.expires_in;
    }
    /**
     * @public
     * @name generateAuthFlowURL
     * @description Generate URL for LFS Authorization Code Flow
     * @param {string} scope - API Scopes
     * @param {string} [state] - User defined CSRF Token
     * @returns Object containing authentication URL and CSRF Token
     */
    generateAuthFlowURL(scope, state) {
        return __awaiter(this, void 0, void 0, function* () {
            const csrfToken = state ? state : (0, uuid_1.v4)();
            const authURLParams = new URLSearchParams();
            // Mutual params
            authURLParams.set("response_type", "code");
            authURLParams.set("client_id", this.client_id);
            authURLParams.set("redirect_uri", this.redirect_uri);
            authURLParams.set("scope", scope);
            authURLParams.set("state", csrfToken);
            // Generate PKCE Challenge Pair
            if (this.spa)
                yield this._generatePKCEPair();
            if (this.spa && this.redirect_uri && this.pkce.code_challenge) {
                // URLSearchParams for auth flow with pkce
                authURLParams.set("code_challenge", this.pkce.code_challenge);
                authURLParams.set("code_challenge_method", "S256");
            }
            if (this.redirect_uri) {
                // Secure applications with Authorization Flow
                // - Authorization Flow with Client Secret
                return {
                    authURL: `${this.idURL}/oauth2/authorize?${authURLParams}`,
                    csrfToken,
                };
            }
            else {
                // Secure applications with Client Credentials
                // - Client Credentials Flow
                this._error("Cannot generate auth flow URL for client credentials flow");
            }
        });
    }
    /**
     * @private
     * @name _getClientCredentialsFlowAccessToken
     * @description Request LFS API access token via Client Credentials Flow
     */
    _getClientCredentialsFlowAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            this._log("Get new client credentials flow access tokens");
            const params = new URLSearchParams({
                grant_type: "client_credentials",
                client_id: this.client_id,
                client_secret: this.client_secret,
            });
            // TODO: Error checking
            const res = yield this._getAccessToken(params);
            // Client credentials flow tokens are stored in the class instance
            this.client_credentials_flow = {
                access_token: res.access_token,
                expires_in: Date.now() / 1000 + res.expires_in,
            };
        });
    }
    /**
     * @private
     * @name _getAccessToken
     * @description Retrieve an access token
     * @param params Request parameters
     * @param access_token_store Access token type
     * @param access_token_expiry_store Access token type expiry
     * @returns Access Tokens
     */
    _getAccessToken(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, axios_1.default)({
                url: `${this.idURL}/oauth2/access_token`,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data: params,
            })
                .then((res) => {
                return res.data;
            })
                .catch((err) => {
                this._error(err);
                return err;
            });
        });
    }
    /**
     * @private
     * @name getAuthFlowTokens
     * @description Request LFS API access token via Authorization Code Flow
     * @param {string} code - Authorization code returned from LFS auth server
     * @returns Access tokens
     */
    getAuthFlowTokens(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const authFlowTokenParams = new URLSearchParams();
            // Mutual params
            authFlowTokenParams.set("grant_type", "authorization_code");
            authFlowTokenParams.set("client_id", this.client_id);
            authFlowTokenParams.set("redirect_uri", this.redirect_uri);
            authFlowTokenParams.set("code", code);
            if (this.spa && this.redirect_uri && this.pkce.code_verifier) {
                // Auth flow with PKCE
                authFlowTokenParams.set("code_verifier", this.pkce.code_verifier);
            }
            else if (this.redirect_uri) {
                // Auth flow with client secret
                authFlowTokenParams.set("client_secret", this.client_secret);
            }
            return yield this._getAccessToken(authFlowTokenParams);
        });
    }
    /**
     * @public
     * @name refreshAccessToken
     * @description Refresh an access token using refresh token
     * @param {string} refresh_token - Refresh token
     * @returns Access tokens
     */
    refreshAccessToken(refresh_token) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshTokenParams = new URLSearchParams();
            // Mutual params
            refreshTokenParams.set("grant_type", "refresh_token");
            refreshTokenParams.set("refresh_token", refresh_token);
            refreshTokenParams.set("client_id", this.client_id);
            if (!this.spa) {
                // Refresh token params for auth flow with client secret
                refreshTokenParams.set("client_secret", this.client_secret);
            }
            return yield this._getAccessToken(refreshTokenParams);
        });
    }
    /**
     * @public
     * @name makeRequest
     * @description Make a request based on the full API endpoint string
     * @param {string} endpoint - Full endpoint string
     * @param {boolean} [token] - Access token override
     * @returns JSON response from LFS API
     */
    makeRequest(endpoint, token) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log(`Make request to ${endpoint}`);
            // Get new cc flow access token if the previous one expired
            if (!token && this._clientCredentialsFlowAccessTokenExpired()) {
                this._log("Client Credentials flow access token expired");
                yield this._getClientCredentialsFlowAccessToken();
            }
            // Make API request
            return yield (0, axios_1.default)({
                url: `${this.apiURL}/${endpoint}`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token ? token : this.client_credentials_flow.access_token}`,
                },
            })
                .then((res) => {
                return res.data;
            })
                .catch((err) => {
                this._error(err);
                return (err === null || err === void 0 ? void 0 : err.response) ? err.response.data : err;
            });
        });
    }
    /**
     * @public
     * @name setVerbose
     * @description Log debug messages
     * @param {boolean} v
     * @returns this
     */
    setVerbose(v) {
        if (typeof v === "boolean")
            this.verbose = v;
        return this;
    }
    // Logging (log, warn, error)
    _log(msg) {
        if (this.verbose)
            console.log(`LFSAPI: ${msg}`);
    }
    _warn(msg) {
        if (this.verbose)
            console.warn(`LFSAPI Warning: ${msg}`);
    }
    _error(msg) {
        if (this.verbose)
            console.error(`LFSAPI Error: ${msg}`);
    }
    /**
     * @private
     * @name _generateCodeVerifier
     * @description Generate verifier for PKCE challenge pair
     * @returns PKCE Challenge verifier
     */
    _generateCodeVerifier() {
        function dec2hex(dec) {
            return ("0" + dec.toString(16)).substr(-2);
        }
        var array = new Uint32Array(56 / 2);
        window.crypto.getRandomValues(array);
        return Array.from(array, dec2hex).join("");
    }
    /**
     * @private
     * @name _generateCodeChallengeFromVerifier
     * @description Generate code challenge for PKCE challenge pair
     * @param {string} verifier - PKCE Challenge verifier
     * @returns PKCE Challenge code challenge
     */
    _generateCodeChallengeFromVerifier(verifier) {
        return __awaiter(this, void 0, void 0, function* () {
            return btoa(String.fromCharCode(...new Uint8Array(new Uint8Array((0, js_sha256_1.sha256)(verifier)
                .match(/.{1,2}/g)
                .map((byte) => parseInt(byte, 16))))))
                .slice(0, -1)
                .replace(/[+]/g, "-")
                .replace(/\//g, "_");
        });
    }
    /**
     * @public
     * @name getPKCEVerifier
     * @description Get PKCE Challenge verifier
     * @returns PKCE Challenge verifier
     */
    getPKCEVerifier() {
        return this.pkce.code_verifier;
    }
    /**
     * @public
     * @name setPKCEVerifier
     * @description Set PKCE Challenge verifier
     * @param {string} code_verifier - PKCE Challenge code verifier
     */
    setPKCEVerifier(code_verifier) {
        this.pkce.code_verifier = code_verifier;
    }
    _generatePKCEPair() {
        return __awaiter(this, void 0, void 0, function* () {
            // SPA: Generate code verifier and challenge
            if (this.spa) {
                let codeVerifier = this._generateCodeVerifier();
                let codeChallenge = yield this._generateCodeChallengeFromVerifier(codeVerifier);
                this.pkce = {
                    code_verifier: codeVerifier,
                    code_challenge: codeChallenge,
                };
            }
        });
    }
    // ENDPOINTS
    /**
     * @public
     * @name getVehicleMods
     * @param {string} [token] Access token override
     * @description List all vehicle mods
     */
    getVehicleMods(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest("vehiclemod", token);
        });
    }
    /**
     * @public
     * @name getVehicleMod
     * @description Get specific vehicle mod by ID
     * @param {string} [token] Access token override
     * @param {number|string} id - Vehicle mod ID
     */
    getVehicleMod(id, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest(`vehiclemod/${id}`, token);
        });
    }
    /**
     * @public
     * @name lookupVehicleClassType
     * @description Convert vehicle class type ID into name string
     * @param {string|number} id - Vehicle class type ID
     * @returns Vehicle class type name string
     */
    lookupVehicleClassType(id) {
        return LFSAPI.vehicleClassTypes[id];
    }
    /**
     * @public
     * @name lookupVehicleICELayoutType
     * @description Convert vehicle ICE layout type ID into name string
     * @param {string|number} id - Vehicle ICE layout type ID
     * @returns Vehicle ICE layout type name string
     */
    lookupVehicleICELayoutType(id) {
        return LFSAPI.vehicleICELayoutTypes[id];
    }
    /**
     * @public
     * @name lookupVehicleDriveType
     * @description Convert vehicle drive type ID into name string
     * @param {string|number} id - Vehicle drive type ID
     * @returns Vehicle drive type name string
     */
    lookupVehicleDriveType(id) {
        return LFSAPI.vehicleDriveTypes[id];
    }
    /**
     * @public
     * @name lookupVehicleShiftType
     * @description Convert vehicle shift type ID into name string
     * @param {string|number} id - Vehicle shift type ID
     * @returns Vehicle shift type name string
     */
    lookupVehicleShiftType(id) {
        return LFSAPI.vehicleShiftTypes[id];
    }
    /**
     * @public
     * @name getHosts
     * @description List all hosts
     * @param {string} [token] Access token override
     * @returns List of hosts
     */
    getHosts(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest("host", token);
        });
    }
    /**
     * @public
     * @name getHost
     * @description Get specific host by ID
     * @param {number|string} id - Host ID
     * @param {string} [token] Access token override
     * @returns Host details by ID
     */
    getHost(id, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest(`host/${id}`, token);
        });
    }
    /**
     * @public
     * @name lookupHostStatus
     * @description Convert host status into name string
     * @param {string|number} status - Host status
     * @returns Host status string
     */
    lookupHostStatus(status) {
        return LFSAPI.hostStatuses[status];
    }
    /**
     * @public
     * @name lookupHostLocation
     * @description Convert host location into name string
     * @param {string|number} location - Host location
     * @returns Host location string
     */
    lookupHostLocation(location) {
        return LFSAPI.hostLocations[location];
    }
    // AUTHORIZATION_CODE ENDPOINTS
    /**
     * @public
     * @name getUserInfo
     * @description Get information of authorised user
     * @param {string} token Access token override
     */
    getUserInfo(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest("userinfo", token);
        });
    }
}
// Vehicle class types for lookup
LFSAPI.vehicleClassTypes = {
    0: "Object",
    1: "Touring car",
    2: "Saloon car",
    3: "Buggy",
    4: "Formula",
    5: "GT",
    6: "Hire kart",
    7: "Kart, 100cc",
    8: "Kart, 125cc",
    9: "Kart, 250cc",
    10: "Formula 1",
    11: "Formula SAE",
    12: "Bike",
    13: "Van",
    14: "Truck",
};
// ICE Layout types for lookup
LFSAPI.vehicleICELayoutTypes = {
    0: "Inline",
    1: "Flat",
    2: "V",
};
// Drive types for lookup
LFSAPI.vehicleDriveTypes = {
    0: "None",
    1: "Rear wheel drive",
    2: "Front wheel drive",
    3: "All wheel drive",
};
// Shift types for lookup
LFSAPI.vehicleShiftTypes = {
    0: "None",
    1: "H-pattern gearbox",
    2: "Motorbike",
    3: "Sequential",
    4: "Sequential with ignition cut",
    5: "Paddle",
    6: "Electric motor",
    7: "Centrifugal clutch",
};
// Host statuses for lookup
LFSAPI.hostStatuses = {
    0: "Off",
    1: "On",
    2: "Expired",
    3: "Discarded",
    4: "Suspended",
};
// Host location for lookup
LFSAPI.hostLocations = {
    0: "Europe (Rotterdam)",
    1: "America (Ashburn)",
    2: "Asia (Tokyo)",
};
exports.default = LFSAPI;
