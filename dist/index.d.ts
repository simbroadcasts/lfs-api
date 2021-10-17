/**
 * @name LFSAPI
 * @description Make requests to the Live for Speed JSON API
 * @author Peter Butcher (PButcher) <pete[at]pbutcher[dot]com>
 * @param {string} client_id - LFS API Client ID
 * @param {string} client_secret - LFS API Client Secret
 */
declare class LFSAPI {
    version: string;
    access_token: string;
    expires: number;
    verbose: boolean;
    client_id: string;
    client_secret: string;
    constructor(client_id: string, client_secret: string);
    _log(msg: string): void;
    _warn(msg: string): void;
    _error(msg: string): void;
    _tokenExpired(): boolean;
    /**
     * @name setVerbose
     * @description Log debug messages
     * @param {boolean} v
     */
    setVerbose(v: boolean): this;
    /**
     * @name makeRequest
     * @description Make a request based on the full API endpoint string
     * @param {string} endpoint - Full endpoint string
     * @returns JSON response from LFS API
     */
    makeRequest(endpoint: string): Promise<any>;
    /**
     * @name getVehicleMods
     * @description List all vehicle mods
     */
    getVehicleMods(): Promise<any>;
    /**
     * @name getVehicleMod
     * @description Get specific vehicle mod by ID
     * @param {number|string} id - Vehicle mod ID
     */
    getVehicleMod(id: number | string): Promise<any>;
    /**
     * @name getHosts
     * @description List all hosts
     */
    getHosts(): Promise<any>;
    /**
     * @name getHost
     * @description Get specific host by ID
     * @param {number|string} id - Host ID
     */
    getHost(id: number | string): Promise<any>;
}
export default LFSAPI;
