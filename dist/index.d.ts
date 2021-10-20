/**
 * @name LFSAPI
 * @description Make requests to the Live for Speed JSON API
 * @author Peter Butcher (PButcher) <pete[at]pbutcher[dot]com>
 * @param {string} client_id - LFS API Client ID
 * @param {string} client_secret - LFS API Client Secret
 * @param {string} [redirect_uri] - LFS API Redirect URI
 * @param {object} [overrides] - Endpoint subdomain overrides { id, api }
 */
declare class LFSAPI {
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
    constructor(client_id: string, client_secret: string, redirect_uri?: string | undefined, overrides?: {
        id: string;
        api: string;
    } | undefined);
    _log(msg: string): void;
    _warn(msg: string): void;
    _error(msg: string): void;
    /**
     * @private
     * @name _authorizationCodeFlowAccessTokenExpired
     * @description Has the authorization code flow access token expired?
     * @returns boolean - whether token has expired or not
     */
    _authorizationCodeFlowAccessTokenExpired(): boolean;
    /**
     * @private
     * @name _clientCredentialsFlowAccessTokenExpired
     * @description Has the client credentials flow access token expired?
     * @returns boolean - whether token has expired or not
     */
    _clientCredentialsFlowAccessTokenExpired(): boolean;
    /**
     * @public
     * @name setVerbose
     * @description Log debug messages
     * @param {boolean} v
     */
    setVerbose(v: boolean): this;
    /**
     * @public
     * @name authFlow
     * @description LFS Authorization Code Flow
     * @param {string} scope - API Scopes
     * @param {string} [state] - User defined CSRF Token
     * @returns Object containing authentication URL and access token fetcher
     */
    authFlow(scope: string, state?: string | undefined): {
        authURL: string;
        getAccessToken: any;
    };
    /**
     * @private
     * @name _getAuthorizationCodeFlowAccessToken
     * @description Request LFS API access token via Authorization Code Flow
     * @param {string} code - Authorization code returned from LFS auth server
     */
    _getAuthorizationCodeFlowAccessToken(code: string): Promise<void>;
    /**
     * @private
     * @name _getClientCredentialsFlowAccessToken
     * @description Request LFS API access token via Client Credentials Flow
     */
    _getClientCredentialsFlowAccessToken(): Promise<void>;
    /**
     * @private
     * @name _getAccessToken
     * @description Retrieve an access token
     * @param params Request parameters
     * @param access_token_store Access token type
     * @param access_token_expiry_store Access token type expiry
     */
    _getAccessToken(params: URLSearchParams, cb: (access_token: string, expires_in: number) => void): Promise<void>;
    /**
     * @public
     * @name makeRequest
     * @description Make a request based on the full API endpoint string
     * @param {string} endpoint - Full endpoint string
     * @param {boolean} [code] - Request contains code param from auth flow
     * @returns JSON response from LFS API
     */
    makeRequest(endpoint: string, code?: string): Promise<any>;
    /**
     * @public
     * @name getVehicleMods
     * @description List all vehicle mods
     */
    getVehicleMods(): Promise<any>;
    /**
     * @public
     * @name getVehicleMod
     * @description Get specific vehicle mod by ID
     * @param {number|string} id - Vehicle mod ID
     */
    getVehicleMod(id: number | string): Promise<any>;
    static vehicleClassTypes: {
        0: string;
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        7: string;
        8: string;
        9: string;
        10: string;
        11: string;
        12: string;
        13: string;
        14: string;
    };
    /**
     * @public
     * @name lookupVehicleClassType
     * @description Convert vehicle class type ID into name string
     * @param {string|number} id - Vehicle class type ID
     * @returns Vehicle class type name string
     */
    lookupVehicleClassType(id: number | string): any;
    static vehicleICELayoutTypes: {
        0: string;
        1: string;
        2: string;
    };
    /**
     * @public
     * @name lookupVehicleICELayoutType
     * @description Convert vehicle ICE layout type ID into name string
     * @param {string|number} id - Vehicle ICE layout type ID
     * @returns Vehicle ICE layout type name string
     */
    lookupVehicleICELayoutType(id: number | string): any;
    static vehicleDriveTypes: {
        0: string;
        1: string;
        2: string;
        3: string;
    };
    /**
     * @public
     * @name lookupVehicleDriveType
     * @description Convert vehicle drive type ID into name string
     * @param {string|number} id - Vehicle drive type ID
     * @returns Vehicle drive type name string
     */
    lookupVehicleDriveType(id: number | string): any;
    static vehicleShiftTypes: {
        0: string;
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        7: string;
    };
    /**
     * @public
     * @name lookupVehicleShiftType
     * @description Convert vehicle shift type ID into name string
     * @param {string|number} id - Vehicle shift type ID
     * @returns Vehicle shift type name string
     */
    lookupVehicleShiftType(id: number | string): any;
    /**
     * @public
     * @name getHosts
     * @description List all hosts
     */
    getHosts(): Promise<any>;
    /**
     * @public
     * @name getHost
     * @description Get specific host by ID
     * @param {number|string} id - Host ID
     */
    getHost(id: number | string): Promise<any>;
    /**
     * @public
     * @name getUserInfo
     * @description Get information of authorised user
     * @param {string} [code] Query string URL param from auth flow
     */
    getUserInfo(code?: string): Promise<any>;
}
export default LFSAPI;
