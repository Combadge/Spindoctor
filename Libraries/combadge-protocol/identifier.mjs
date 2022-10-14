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


class Identifier {
    constructor (identifier) {
        if (typeof(identifier) == 'string') {
            if (identifier.length > 12) {
                throw `Target identifier ${identifier} too long. Cap is 12 characters.`;
            } else {
                this._identifier = identifier;
            };
        } else {
            throw "Identifier must be of type String.";
        };
    };

    toString () {
        return this._identifier;
    };

    toJSON () {
        return {"identifier": this.identifier};
    };

    toBuffer (source=this._identifier) {
        var identBuffer = Buffer.from(source, 'utf8');
        var lengthBuffer = new Buffer.from([0,0]);
        lengthBuffer.writeUInt16BE(identBuffer.length);
        return Buffer.concat([lengthBuffer, identBuffer]);
    };
};

class UserIdent extends Identifier {
    constructor (userName="u-fakeuser",prettyName="Fake User") {
        super("u-username");
        this._userName = userName;
        this._prettyName = prettyName;
    };

    toString () {
        return `${this._userName} ${this._prettyName}`;
    };

    toJSON () {
        return {
            "userName": this._userName,
            "prettyName": this._prettyName
        };
    };

    get userName () {
        return this._userName;
    };

    get prettyName () {
        return this._userName;
    };

    toBuffer() {
        var userBuffer = super.toBuffer(this._userName);
        var prettyBuffer = super.toBuffer(this._prettyName);
        console.log(Buffer.concat([userBuffer, prettyBuffer]).toString('hex'));
        return Buffer.concat([userBuffer, prettyBuffer]);
    };

};

export { Identifier, UserIdent }