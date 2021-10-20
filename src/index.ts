import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

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
  version: string;
  client_credentials_flow_access_token: string;
  authorization_code_flow_access_token: string;
  client_credentials_flow_expires: number;
  authorization_code_flow_expires: number;
  verbose: boolean;
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  idURL: string;
  apiURL: string;

  constructor(
    client_id: string,
    client_secret: string,
    redirect_uri?: string | undefined,
    overrides?:
      | {
          id: string;
          api: string;
        }
      | undefined
  ) {
    if (
      typeof client_id !== "string" ||
      typeof client_secret !== "string" ||
      (typeof redirect_uri !== "undefined" && typeof redirect_uri !== "string")
    ) {
      throw new Error(
        `LFSAPI: Constructor expects 2 mandatory arguments: client_id (string) and client_secret (string), and 1 optional argument: redirect_url (string|undefined) but got ${typeof client_id}, ${typeof client_secret} and ${typeof redirect_uri} instead.`
      );
    }

    // LFS API Version
    this.version = "0.0.1";

    // ID Endpoint
    this.idURL = overrides?.id ? overrides.id : "https://id.lfs.net";

    // API Endpoint
    this.apiURL = overrides?.api ? overrides.api : "https://api.lfs.net";

    // LFS API Access Token
    this.client_credentials_flow_access_token = "";
    this.authorization_code_flow_access_token = "";

    // Expire uts
    this.client_credentials_flow_expires = 0;
    this.authorization_code_flow_expires = 0;

    // Verbose
    this.verbose = false;

    // Client ID
    this.client_id = client_id;

    // Client Secret
    this.client_secret = client_secret;

    // Redirect URI
    this.redirect_uri = redirect_uri;
  }

  // Logging (log, warn, error)
  _log(msg: string) {
    if (this.verbose) console.log(`LFSAPI: ${msg}`);
  }
  _warn(msg: string) {
    if (this.verbose) console.warn(`LFSAPI Warning: ${msg}`);
  }
  _error(msg: string) {
    if (this.verbose) console.error(`LFSAPI Error: ${msg}`);
  }

  /**
   * @private
   * @name _authorizationCodeFlowAccessTokenExpired
   * @description Has the authorization code flow access token expired?
   * @returns boolean - whether token has expired or not
   */
  _authorizationCodeFlowAccessTokenExpired() {
    return Date.now() / 1000 > this.authorization_code_flow_expires;
  }

  /**
   * @private
   * @name _clientCredentialsFlowAccessTokenExpired
   * @description Has the client credentials flow access token expired?
   * @returns boolean - whether token has expired or not
   */
  _clientCredentialsFlowAccessTokenExpired() {
    return Date.now() / 1000 > this.client_credentials_flow_expires;
  }

  /**
   * @public
   * @name setVerbose
   * @description Log debug messages
   * @param {boolean} v
   */
  setVerbose(v: boolean) {
    if (typeof v === "boolean") this.verbose = v;
    return this;
  }

  /**
   * @public
   * @name authFlow
   * @description LFS Authorization Code Flow
   * @param {string} scope - API Scopes
   * @param {string} [state] - User defined CSRF Token
   * @returns Object containing authentication URL and access token fetcher
   */
  authFlow(scope: string, state?: string | undefined) {
    const authURLParams = new URLSearchParams({
      response_type: "code",
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      scope,
      state: state ? state : uuidv4(),
    });

    return {
      authURL: `${this.idURL}/oauth2/authorize?${authURLParams}`,
      getAccessToken: this._getAuthorizationCodeFlowAccessToken.bind(this),
    };
  }

  /**
   * @private
   * @name _getAuthorizationCodeFlowAccessToken
   * @description Request LFS API access token via Authorization Code Flow
   * @param {string} code - Authorization code returned from LFS auth server
   */
  async _getAuthorizationCodeFlowAccessToken(code: string) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.client_id,
      client_secret: this.client_secret,
      redirect_uri: this.redirect_uri,
      code,
    });

    await this._getAccessToken(
      params,
      (access_token: string, expires_in: number) => {
        this.authorization_code_flow_access_token = access_token;
        this.authorization_code_flow_expires = expires_in;
      }
    );
  }

  /**
   * @private
   * @name _getClientCredentialsFlowAccessToken
   * @description Request LFS API access token via Client Credentials Flow
   */
  async _getClientCredentialsFlowAccessToken() {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.client_id,
      client_secret: this.client_secret,
    });

    await this._getAccessToken(
      params,
      (access_token: string, expires_in: number) => {
        this.client_credentials_flow_access_token = access_token;
        this.client_credentials_flow_expires = expires_in;
      }
    );
  }

  /**
   * @private
   * @name _getAccessToken
   * @description Retrieve an access token
   * @param params Request parameters
   * @param access_token_store Access token type
   * @param access_token_expiry_store Access token type expiry
   */
  async _getAccessToken(
    params: URLSearchParams,
    cb: (access_token: string, expires_in: number) => void
  ) {
    await fetch(`${this.idURL}/oauth2/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })
      .then((res: { json: () => any }) => res.json())
      .then((json: { access_token: string; expires_in: number }) => {
        cb(json.access_token, json.expires_in);
      })
      .catch((err: any) => {
        this._error(err);
        return err;
      });
  }

  /**
   * @public
   * @name makeRequest
   * @description Make a request based on the full API endpoint string
   * @param {string} endpoint - Full endpoint string
   * @param {boolean} [code] - Request contains code param from auth flow
   * @returns JSON response from LFS API
   */
  async makeRequest(endpoint: string, code?: string) {
    // If this is a client credentials flow request (!code)...
    // get a new access token if the previous one expired
    if (!code && this._clientCredentialsFlowAccessTokenExpired()) {
      await this._getClientCredentialsFlowAccessToken();
    } else {
      // TODO: Handle auth flow refresh tokens here...

      await this._getAuthorizationCodeFlowAccessToken(code);
    }

    // Make API request
    return await fetch(`${this.apiURL}/${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${
          code
            ? this.authorization_code_flow_access_token
            : this.client_credentials_flow_access_token
        }`,
      },
    })
      .then((res: { json: () => any }) => res.json())
      .then((json: any) => {
        return json;
      })
      .catch((err: any) => {
        this._error(err);
        return err;
      });
  }

  // CLIENT_CREDENTIALS ENDPOINTS:

  /**
   * @public
   * @name getVehicleMods
   * @description List all vehicle mods
   */
  async getVehicleMods() {
    return await this.makeRequest("vehiclemod");
  }

  /**
   * @public
   * @name getVehicleMod
   * @description Get specific vehicle mod by ID
   * @param {number|string} id - Vehicle mod ID
   */
  async getVehicleMod(id: number | string) {
    return await this.makeRequest(`vehiclemod/${id}`);
  }

  // Vehicle class types for lookup
  static vehicleClassTypes = {
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

  /**
   * @public
   * @name lookupVehicleClassType
   * @description Convert vehicle class type ID into name string
   * @param {string|number} id - Vehicle class type ID
   * @returns Vehicle class type name string
   */
  lookupVehicleClassType(id: number | string) {
    return LFSAPI.vehicleClassTypes[id];
  }

  // ICE Layout types for lookup
  static vehicleICELayoutTypes = {
    0: "Inline",
    1: "Flat",
    2: "V",
  };

  /**
   * @public
   * @name lookupVehicleICELayoutType
   * @description Convert vehicle ICE layout type ID into name string
   * @param {string|number} id - Vehicle ICE layout type ID
   * @returns Vehicle ICE layout type name string
   */
  lookupVehicleICELayoutType(id: number | string) {
    return LFSAPI.vehicleICELayoutTypes[id];
  }

  // Drive types for lookup
  static vehicleDriveTypes = {
    0: "None",
    1: "Rear wheel drive",
    2: "Front wheel drive",
    3: "All wheel drive",
  };

  /**
   * @public
   * @name lookupVehicleDriveType
   * @description Convert vehicle drive type ID into name string
   * @param {string|number} id - Vehicle drive type ID
   * @returns Vehicle drive type name string
   */
  lookupVehicleDriveType(id: number | string) {
    return LFSAPI.vehicleDriveTypes[id];
  }

  // Shift types for lookup
  static vehicleShiftTypes = {
    0: "None",
    1: "H-pattern gearbox",
    2: "Motorbike",
    3: "Sequential",
    4: "Sequential with ignition cut",
    5: "Paddle",
    6: "Electric motor",
    7: "Centrifugal clutch",
  };

  /**
   * @public
   * @name lookupVehicleShiftType
   * @description Convert vehicle shift type ID into name string
   * @param {string|number} id - Vehicle shift type ID
   * @returns Vehicle shift type name string
   */
  lookupVehicleShiftType(id: number | string) {
    return LFSAPI.vehicleShiftTypes[id];
  }

  /**
   * @public
   * @name getHosts
   * @description List all hosts
   */
  async getHosts() {
    return await this.makeRequest("host");
  }

  /**
   * @public
   * @name getHost
   * @description Get specific host by ID
   * @param {number|string} id - Host ID
   */
  async getHost(id: number | string) {
    return await this.makeRequest(`host/${id}`);
  }

  // AUTHORIZATION_CODE ENDPOINTS:

  /**
   * @public
   * @name getUserInfo
   * @description Get information of authorised user
   * @param {string} [code] Query string URL param from auth flow
   */
  async getUserInfo(code?: string) {
    return await this.makeRequest("userinfo", code);
  }
}

export default LFSAPI;
