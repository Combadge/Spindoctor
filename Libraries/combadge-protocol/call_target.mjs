/**
 * Combadge-protocol, an implementation of an OEM Combadge control protocol for Spin Doctor
 * Copyright (C) 2021-2022 The Combadge Project by mo-g
 *
 * Combadge-protocol is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * Combadge-protocol is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Combadge-protocol.  If not, see <https://www.gnu.org/licenses/>.
 */


import { IPAddress, Port } from "./ipaddress.mjs";
import { Identifier } from "./identifier.mjs";

/**
 * Represent a target for a Combadge (or possibly the server) to call. 
 */
class CallTarget {
    constructor (address = undefined, port = undefined,) {
        this.address = address;
        this.port = port;
    };

    get address () {
        return this._address;
    };

    set address (address) {
        if (!(address instanceof IPAddress)) {
            throw "Not an IPAddress object."
        } else {
            this._address = address;
        };
    };

    set port (port) {
        if (!(port instanceof Port)) {
            throw "Not a Port object."
        } else {
            this._port = port;
        };
    };

    get port () {
        return this._port;
    };

    set identifier (identifier) {
        if (!(identifier instanceof Identifier)) {
            throw "Not an IPAddress object."
        } else {
            this._identifier = identifier;
        };

    };

    get identifier() {
        return this._identifier;
    };

    toString () {
        return ``;
    };

    toBuffer () {
        return Buffer.concat([this._targetIP, this._port]);
    };
};

/**
 * Represent a multicast group for a number of users to join in on.
 */
class CallGroup extends CallTarget {
    constructor () {

    };

    set IP (address) {
        if (address.multicast != true) {
            throw "Cannot assign a unicast IP to a CallGroup. Must be Multicast."
        };

        super.IP = address;
    };
};

export { CallTarget, CallGroup };