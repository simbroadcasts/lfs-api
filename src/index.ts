import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

type Config = {
  client_id: string;
  client_secret?: string;
  redirect_uri?: string;
  spa?: boolean;
  auth?: boolean;
  idURL?: string;
  apiURL?: string;
};

type CCFlow = {
  access_token: string;
  expires_in: number;
};

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
  apiURL: string;
  config: Config;
  client_credentials_flow: CCFlow;
  client_id: string;
  client_secret: string;
  idURL: string;
  redirect_uri?: string;
  verbose: boolean;
  version: string;

  constructor(config: Config) {
    // LFS API Version
    this.version = "0.0.1";

    // Configuration
    this.config = config;

    // Client ID
    this.client_id = config.client_id;

    // Client Secret
    this.client_secret = config?.client_secret;

    // Auth Flow Redirect URL
    this.redirect_uri = config?.redirect_uri;

    // ID Endpoint
    this.idURL = config?.idURL ? config.idURL : "https://id.lfs.net";

    // API Endpoint
    this.apiURL = config?.apiURL ? config.apiURL : "https://api.lfs.net";

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
  generateAuthFlowURL(scope: string, state?: string) {
    const csrfToken = state ? state : uuidv4();
    const authURLParams = new URLSearchParams({
      response_type: "code",
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      scope,
      state: csrfToken,
    });

    if (this.config?.spa) {
      // Single page apps (insecure)
      // - Authorization Flow with PKCE
      // TODO: Generate code challenge and code verifier
    } else if (this.config?.auth) {
      // Secure applications with Authorization Flow
      // - Authorization Flow with Client Secret
      return {
        authURL: `${this.idURL}/oauth2/authorize?${authURLParams}`,
        csrfToken,
      };
    } else {
      // Secure applications with Client Credentials
      // - Client Credentials Flow
      this._error("Cannot generate auth flow URL for client credentials flow");
    }
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

    // TODO: Error checking
    const res = await this._getAccessToken(params);

    // Client credentials flow tokens are stored in the class instance
    this.client_credentials_flow = {
      access_token: res.access_token,
      expires_in: res.expires_in,
    };
  }

  /**
   * @private
   * @name _getAccessToken
   * @description Retrieve an access token
   * @param params Request parameters
   * @param access_token_store Access token type
   * @param access_token_expiry_store Access token type expiry
   */
  async _getAccessToken(params: URLSearchParams) {
    return await fetch(`${this.idURL}/oauth2/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })
      .then((res: { json: () => any }) => res.json())
      .then((json) => json)
      .catch((err) => {
        this._error(err);
        return err;
      });
  }

  /**
   * @private
   * @name getAuthFlowTokens
   * @description Request LFS API access token via Authorization Code Flow
   * @param {string} code - Authorization code returned from LFS auth server
   */
  async getAuthFlowTokens(code: string) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.client_id,
      client_secret: this.client_secret,
      redirect_uri: this.redirect_uri,
      code,
    });

    return await this._getAccessToken(params);
  }
  /**
   * @private
   * @name refreshAccessToken
   * @description Refresh an access token using refresh token
   * @param {string} refresh_token - Refresh token
   */
  async refreshAccessToken(refresh_token: string) {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: this.client_id,
      client_secret: this.client_secret,
    });

    return await this._getAccessToken(params);
  }

  /**
   * @public
   * @name makeRequest
   * @description Make a request based on the full API endpoint string
   * @param {string} endpoint - Full endpoint string
   * @param {boolean} [token] - Access token override
   * @returns JSON response from LFS API
   */
  async makeRequest(endpoint: string, token?: string) {
    // Get new cc flow access token if the previous one expired
    if (!token && this._clientCredentialsFlowAccessTokenExpired) {
      await this._getClientCredentialsFlowAccessToken();
    }

    // Make API request
    return await fetch(`${this.apiURL}/${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${
          token ? token : this.client_credentials_flow.access_token
        }`,
      },
    })
      .then((res: { json: () => any }) => res.json())
      .then((json: any) => json)
      .catch((err: any) => {
        this._error(err);
        return err;
      });
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

  // ENDPOINTS

  /**
   * @public
   * @name getVehicleMods
   * @param {string} [token] Access token override
   * @description List all vehicle mods
   */
  async getVehicleMods(token?: string) {
    return await this.makeRequest("vehiclemod", token);
  }

  /**
   * @public
   * @name getVehicleMod
   * @description Get specific vehicle mod by ID
   * @param {string} [token] Access token override
   * @param {number|string} id - Vehicle mod ID
   */
  async getVehicleMod(id: number | string, token?: string) {
    return await this.makeRequest(`vehiclemod/${id}`, token);
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
   * @param {string} [token] Access token override
   * @returns List of hosts
   */
  async getHosts(token?: string) {
    return await this.makeRequest("host", token);
  }

  /**
   * @public
   * @name getHost
   * @description Get specific host by ID
   * @param {number|string} id - Host ID
   * @param {string} [token] Access token override
   * @returns Host details by ID
   */
  async getHost(id: number | string, token?: string) {
    return await this.makeRequest(`host/${id}`, token);
  }

  // AUTHORIZATION_CODE ENDPOINTS

  /**
   * @public
   * @name getUserInfo
   * @description Get information of authorised user
   * @param {string} token Access token override
   */
  async getUserInfo(token: string) {
    return await this.makeRequest("userinfo", token);
  }
}

export default LFSAPI;
