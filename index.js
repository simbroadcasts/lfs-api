import fetch from "node-fetch";

/**
 * @name LFSAPI
 * @description Make requests to the Live for Speed JSON API
 * @author Peter Butcher (PButcher) <pete[at]pbutcher[dot]com>
 * @param {string} client_id - LFS API Client ID
 * @param {string} client_secret - LFS API Client Secret
 */
class LFSAPI {
  constructor(client_id, client_secret) {
    if (typeof client_id !== "string" && typeof client_secret !== "string") {
      throw new Error(
        `LFSAPI: Constructor expects 2 arguments of type string (client_id, client_secret), got ${typeof client_id} and ${typeof client_secret} instead.`
      );
    }

    // LFS API Version
    this.version = "0.0.1";

    // LFS API Access Token
    this.access_token = "";

    // Expire uts
    this.expires = 0;

    // Verbose
    this.verbose = false;

    // Client ID
    this.client_id = client_id;

    // Client Secret
    this.client_secret = client_secret;
  }

  // Logging (log, warn, error)
  _log(msg) {
    if (this.verbose) console.log(`LFSAPI: ${msg}`);
  }
  _warn(msg) {
    if (this.verbose) console.warn(`LFSAPI Warning: ${msg}`);
  }
  _error(msg) {
    if (this.verbose) console.error(`LFSAPI Error: ${msg}`);
  }

  // Has the LFS API access token expired?
  _tokenExpired() {
    return Date.now() / 1000 > this.expires;
  }

  /**
   * @name setVerbose
   * @description Log debug messages
   * @param {boolean} v
   */
  setVerbose(v) {
    if (typeof v === "boolean") this.verbose = v;
    return this;
  }

  /**
   * @name makeRequest
   * @description Make a request based on the full API endpoint string
   * @param {string} endpoint - Full endpoint string
   * @returns JSON response from LFS API
   */
  async makeRequest(endpoint) {
    // Get a new access token if the previous one expired
    if (this._tokenExpired()) {
      this._log("Renewing Access Token");
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.client_id,
        client_secret: this.client_secret,
      });

      // Get access token
      await fetch("https://id.lfs.net/oauth2/access_token", {
        method: "POST",
        header: "Content-Type: application/x-www-form-urlencoded",
        body: params,
      })
        .then((res) => res.json())
        .then((json) => {
          this.access_token = json.access_token;
          this.expires = Date.now() / 1000 + json.expires_in;
        })
        .catch((err) => {
          this._error(err);
          return err;
        });
    }

    // Make API request
    return await fetch(`https://api.lfs.net/${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        return json;
      })
      .catch((err) => {
        this._error(err);
        return err;
      });
  }

  /**
   * @name getVehicleMods
   * @description List all vehicle mods
   */
  async getVehicleMods() {
    return await this.makeRequest("vehiclemod");
  }

  /**
   * @name getVehicleMod
   * @description Get specific vehicle mod by ID
   * @param {number|string} id - Vehicle mod ID
   */
  async getVehicleMod(id) {
    return await this.makeRequest(`vehiclemod/${id}`);
  }

  /**
   * @name getHosts
   * @description List all hosts
   */
  async getHosts() {
    return await this.makeRequest("host");
  }

  /**
   * @name getHost
   * @description Get specific host by ID
   * @param {number|string} id - Host ID
   */
  async getHost(id) {
    return await this.makeRequest(`host/${id}`);
  }
}

export default LFSAPI;
