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

userTemplate = { 
    userName: "u-fallbackuser", // Globally unique ID
    fullName: new UserFullName(foreName = "Fallback", familyName = "User", nickName = "Fallback User"),
    ipaPronunciation: "fɔːlbæk ˈjuːzə", // Not currently in use for STT or TTS but worth adding.
    associatedGroups: [],

    assignedBadge: "ba:dg:em:ac:ad:dr", // Optional, for autologin/whitelisting
    personalTerminals: [] // Being vidcom terminals that can be used to make video calls.
};

groupTemplate = {
    groupName: "g-allhands",
    nickName: "All Hands",
    ipaPronunciation: "ɔːl hændz", // Not currently in use for STT or TTS but worth adding.
    associatedUsers: [],

    assignedAddress: "Placeholder for multicast IPAddress Object"
};


/**
 * Frst pass. Probably want to restructure this to allow returning different form of name.
 * 
 * Assume middle names to include patronyms. Should obviously be treated as an ordered list regardless.
 * Do we want to merge pronunciation in to this as well?
 */
class UserFullName {
    constructor ({prefix = "", foreName = "", middleNames = [], familyName = "", suffix = "", nickName = ""} = {}) {
        this.prefix = prefix;
        this.foreName = foreName;
        this.middleNames = middleNames;
        this.familyName = familyName;
        this.suffix = suffix;
        this.nickName = nickName;

        preferredFormat = this.fullName;
    };

    fullName () {
        var assembled = "";
        if (this.prefix) {assembled += this.prefix};
        if (this.foreName) {assembled += this.foreName};
        if (this.middleNames) {
            this.middleNames.forEach(function (name) {
                assembled += name;
            });
        };
        if (this.familyName) {assembled += this.familyName};
        if (this.suffix) {assembled += this.suffix};

        if (assembled) {
            return assembled;
        } else {
            throw "Cannot stringify empty name."
        };
    };

    toString () {
        return this.preferredFormat();
    };

}

class User {
    constructor () {

    };
};

class Group {
    constructor () {

    };
};

export { User, Group };