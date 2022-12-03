/**
 * ecma-cccp (Communicator Command and Control Protocol), an implementation of an OEM Combadge control protocol for Spin Doctor
 * Copyright (C) 2021-2022 The Combadge Project by mo-g
 *
 * ecma-cccp is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * ecma-cccp is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ecma-cccp.  If not, see <https://www.gnu.org/licenses/>.
 */


const Transports = ["TCP", "UDP"];

const Protocols = [ "VCC", "VUPD", "VCONF", "RTP", "SIP", "HTTP", "HTTPS", "RTCP"];


/**
 * Represent an IP address in a way that can be used in whatever format necessary.
 */
class IPAddress {
    _multicast = false;
    constructor (address = new Buffer(), multicast = undefined) {
        this._address = address;
        this._subnet = undefined;
        this.multicast = multicast;
    }

    /**
     * Create an IP address from a passed buffer or string.
     * Should interpret notation of string to decide CIDR/pure, IPv4 or IPv6.
     * @param {*} address 
     */
    static from (address) {
        switch (typeof(address)) {
            case "string":
                return IPAddress.fromString(address);

            case "object":
                if (address instanceof Buffer) {
                    return IPAddress.fromBuffer(address);
                }

            default:
                throw "Not a string or a buffer, can't parse as IP address.";
        }
    }

    /**
     * Create an IP address from a passed string.
     * Returns an IPv6Address or an IPv4Address depending on type.
     * @param {*} stringAddress 
     */
    static fromString (stringAddress) {
        var colonTest = stringAddress.split(":");
        var dotTest = stringAddress.split(".");
        if (colonTest.length > dotTest.length) {
            return IPv6Address.fromString(stringAddress);
        } else {
            return IPv4Address.fromString(stringAddress);
        }
    }

    /**
     * Create an IP address from a passed buffer.
     * Returns an IPv6Address or an IPv4Address depending on type.
     * @param {*} bufferAddress 
     */
    static fromBuffer (bufferAddress) {
        if (bufferAddress.length > 4) {
            return IPv6Address.fromBuffer(bufferAddress);
        } else {
            return IPv4Address.fromBuffer(bufferAddress);
        }
    }

    /**
     * Set the subnet from an int or "int" of CIDR
     * But do we want to store as a bitmask instead of a cidr?
     * @param {*} subnet 
     */
    set cidrSubnet (subnet) {
        this._subnet = parseInt(subnet);
    }

    /**
     * Set the subnet from a string or buffer in mask format.
     * But do we want to store as a bitmask instead of a cidr?
     * @param {*} subnet 
     */
    set subnetMask (subnet) {
        this._subnet = parseInt(subnet);
    }

    /**
     * Represent IP Address as a human-readable string notation,
     * defaulting to ddn for IPv4 and cdn for IPv6 with no cidr mask.
     */
    toString (preformatted = undefined, includeCIDR = false) {
        if (preformatted) {
            return ""; // This should never be called directly, only from a subclass.
        } else {
            var formatted = preformatted;
        }

        if (includeCIDR) {
            if (this._subnet) {
                formatted.concat("/", this.subnet.toString(10));
            } else {
                throw "CIDR requested but subnet unset!";
            }
        }

        return formatted;
    }
    
    /**
     * Inspired by toString and toJSON, outputs the IP address as raw bytes
     * 
     * This is used in Spindoctor to pass addresses to the Combadge in the CnCP.
     */
    toBuffer() {
        return this._address;
    }
}

/**
 * Subclass of IPAddress for IPv4 addresses.
 */
class IPv4Address extends IPAddress {
    constructor (address, multicast = undefined) {
        super(address, multicast);
    }

    /**
     * Create an IP address from a passed buffer or string.
     * Should interpret notation of string to decide CIDR/pure, IPv4 or IPv6.
     * @param {*} address 
     */
    static from (address) {
        switch (typeof(address)) {
            case "string":
                return IPv4Address.fromString(address);

            case "object":
                if (address instanceof Buffer) {
                    return IPv4Address.fromBuffer(address);
                }

            default:
                throw "Not a string or a buffer, can't parse as IP address.";
        }
    }

    /**
     * Create an IP address from a passed string.
     * Should interpret notation of string to decide CIDR/pure
     * @param {*} stringAddress 
     */
    static fromString (stringAddress) {
        // Test for CIDR
        var cidrTested = stringAddress.split("/");
        var cidrSubnet = undefined;
        if (cidrTested.length > 1) {
            cidrSubnet = cidrTested[1];
        }

        var noCIDRAddress = cidrTested[0];
        var address = new Buffer(noCIDRAddress.split(".").map(value => parseInt(value)));

        var ipInstance = new IPv4Address(address);

        if (cidrSubnet) {
            ipInstance.setCidrSubnet(cidrSubnet);
        }

        return ipInstance;
    }

    /**
     * Create an IP address from a passed buffer.
     * We're storing this way, so only need to validate.
     * @param {*} bufferAddress 
     */
    static fromBuffer (bufferAddress) {
        if (bufferAddress instanceof Buffer) {
            return new IPv4Address(bufferAddress);
        } else {
            throw "Not a string or a buffer, can't parse as IP address.";
        }
    }

    /**
     * Represent IP Address as a human-readable string notation,
     * defaulting to ddn for IPv4 with no cidr mask.
     */
    toString (includeCIDR = false) {
        return this._address.map(value => value.toString(10).padStart(2, '0')).join("");
    }
}

/**
 *
 * Subclass of IPAddress for IPv4 addresses.
 */
class IPv6Address extends IPAddress {
    constructor (address, multicast = undefined) {
        super(address, multicast);
    }

    /**
     * Create an IP address from a passed buffer or string.
     * Should interpret notation of string to decide CIDR/pure
     * @param {*} address 
     */
    static from (address) {
        switch (typeof(address)) {
            case "string":
                return IPv6Address.fromString(address);
            break;

            case "object":
                if (address instanceof Buffer) {
                    return IPv6Address.fromBuffer(address);
                }

            default:
                throw "Not a string or a buffer, can't parse as IP address.";
        }
    }

    /**
     * Create an IP address from a passed string.
     * Should interpret notation of string to decide CIDR/pure
     * @param {*} stringAddress 
     */
    static fromString (stringAddress) {
        // Test for CIDR
        var cidrTested = stringAddress.split("/");
        var cidrSubnet = undefined;
        if (cidrTested.length > 1) {
            cidrSubnet = cidrTested[1];
        }

        var noCIDRAddress = cidrTested[0];
        var address = new Buffer(noCIDRAddress.split(":").map(value => parseInt(value, 16)));

        var ipInstance = new IPv6Address(address);

        if (cidrSubnet) {
            ipInstance.setCidrSubnet(cidrSubnet);
        }

        return ipInstance;
    }

    /**
     * Create an IP address from a passed buffer.
     * @param {*} bufferAddress 
     */
    static fromBuffer (bufferAddress) {
        if (bufferAddress instanceof Buffer) {
            return new IPv6Address(bufferAddress);
        } else {
            throw "Not a string or a buffer, can't parse as IP address.";
        }
    }

    /**
     * Represent IP Address as a human-readable string notation,
     * defaulting to cdn for IPv6 with no cidr mask.
     */
    toString (includeCIDR = false) {
        return this._address.map(value => value.toString(16).padStart(2, '0')).join("");
    }
}

/**
 * Yep, we're going all the way.
 */
class Port {
    #transport = undefined;
    #port = undefined;
    #protocol = undefined;

    constructor (transport = undefined, port = undefined, protocol = undefined) {
        this.transport = transport;
        this.port = port;
        this.protocol = port;
    }

    set port (port) {
        if (typeof(port) == 'number') {
            this.#port = port;
        } else if (port instanceof Buffer) {
            this.#port = port.readInt16BE;
        } else {
            throw "Port is not in Number or Buffer form."
        }
        
    }

    set transport (transport) {
        if (Transports.includes(transport)) {
            this.#transport = transport;
        } else {
            throw `Unsupported Transport ${transport}`;
        }
    }

    set protocol (protocol) {
        if (Protocols.includes(protocol)) {
            this.#protocol = protocol;
        } else {
            throw `Unsupported Protocol ${protocol}`;
        }
    }

    get protocol () {
        return this.#protocol;
    }

    get transport () {
        return this.#transport;
    }

    get port () {
        return this.#port;
    }

    toString () {
        return `Instance of ${this.protocol} on ${this.transport}:${this.port}`
    }

    toBuffer () {
        return Buffer.from([this.port]);
    }

    valueOf () {
        return this.port;
    }
}

export {IPAddress, IPv4Address, IPv6Address, Port};
