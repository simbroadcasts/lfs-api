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
    apiURL: string;
    client_credentials_flow: {
        access_token: string | null;
        expires_in: number;
    };
    client_id: string;
    client_secret: string;
    idURL: string;
    redirect_uri?: string;
    spa?: boolean;
    pkce: {
        code_verifier: string | null;
        code_challenge: string | null;
    };
    verbose: boolean;
    version: string;
    constructor(client_id: string, client_secret: string, redirect_uri?: string, spa?: boolean, idURL?: string, apiURL?: string);
    /**
     * @private
     * @name _clientCredentialsFlowAccessTokenExpired
     * @description Has the client credentials flow access token expired?
     * @returns boolean - whether token has expired or not
     */
    _clientCredentialsFlowAccessTokenExpired(): boolean;
    /**
     * @public
     * @name generateAuthFlowURL
     * @description Generate URL for LFS Authorization Code Flow
     * @param {string} scope - API Scopes
     * @param {string} [state] - User defined CSRF Token
     * @returns Object containing authentication URL and CSRF Token
     */
    generateAuthFlowURL(scope: string, state?: string): Promise<{
        authURL: string;
        csrfToken: string;
    }>;
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
     * @returns Access Tokens
     */
    _getAccessToken(params: URLSearchParams): Promise<any>;
    /**
     * @private
     * @name getAuthFlowTokens
     * @description Request LFS API access token via Authorization Code Flow
     * @param {string} code - Authorization code returned from LFS auth server
     * @returns Access tokens
     */
    getAuthFlowTokens(code: string): Promise<any>;
    /**
     * @public
     * @name refreshAccessToken
     * @description Refresh an access token using refresh token
     * @param {string} refresh_token - Refresh token
     * @returns Access tokens
     */
    refreshAccessToken(refresh_token: string): Promise<any>;
    /**
     * @public
     * @name makeRequest
     * @description Make a request based on the full API endpoint string
     * @param {string} endpoint - Full endpoint string
     * @param {boolean} [token] - Access token override
     * @returns JSON response from LFS API
     */
    makeRequest(endpoint: string, token?: string): Promise<any>;
    /**
     * @public
     * @name setVerbose
     * @description Log debug messages
     * @param {boolean} v
     * @returns this
     */
    setVerbose(v: boolean): this;
    _log(msg: string): void;
    _warn(msg: string): void;
    _error(msg: string): void;
    /**
     * @private
     * @name _generateCodeVerifier
     * @description Generate verifier for PKCE challenge pair
     * @returns PKCE Challenge verifier
     */
    _generateCodeVerifier(): string;
    /**
     * @private
     * @name _generateCodeChallengeFromVerifier
     * @description Generate code challenge for PKCE challenge pair
     * @param {string} verifier - PKCE Challenge verifier
     * @returns PKCE Challenge code challenge
     */
    _generateCodeChallengeFromVerifier(verifier: string): Promise<string>;
    /**
     * @public
     * @name getPKCEVerifier
     * @description Get PKCE Challenge verifier
     * @returns PKCE Challenge verifier
     */
    getPKCEVerifier(): string;
    /**
     * @public
     * @name setPKCEVerifier
     * @description Set PKCE Challenge verifier
     * @param {string} code_verifier - PKCE Challenge code verifier
     */
    setPKCEVerifier(code_verifier: string): void;
    _generatePKCEPair(): Promise<void>;
    /**
     * @public
     * @name getVehicleMods
     * @param {string} [token] Access token override
     * @description List all vehicle mods
     */
    getVehicleMods(token?: string): Promise<any>;
    /**
     * @public
     * @name getVehicleMod
     * @description Get specific vehicle mod by ID
     * @param {string} [token] Access token override
     * @param {number|string} id - Vehicle mod ID
     */
    getVehicleMod(id: number | string, token?: string): Promise<any>;
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
     * @param {string} [token] Access token override
     * @returns List of hosts
     */
    getHosts(token?: string): Promise<any>;
    /**
     * @public
     * @name getHost
     * @description Get specific host by ID
     * @param {number|string} id - Host ID
     * @param {string} [token] Access token override
     * @returns Host details by ID
     */
    getHost(id: number | string, token?: string): Promise<any>;
    static hostStatuses: {
        0: string;
        1: string;
        2: string;
        3: string;
        4: string;
    };
    /**
     * @public
     * @name lookupHostStatus
     * @description Convert host status into name string
     * @param {string|number} status - Host status
     * @returns Host status string
     */
    lookupHostStatus(status: number | string): any;
    static hostLocations: {
        0: string;
        1: string;
        2: string;
    };
    /**
     * @public
     * @name lookupHostLocation
     * @description Convert host location into name string
     * @param {string|number} location - Host location
     * @returns Host location string
     */
    lookupHostLocation(location: number | string): any;
    /**
     * @public
     * @name getUserInfo
     * @description Get information of authorised user
     * @param {string} token Access token override
     */
    getUserInfo(token: string): Promise<any>;
}
export default LFSAPI;
