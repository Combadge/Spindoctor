/**
 * Spin Doctor, a Combadge Voice Server
 * Copyright (C) 2021-2022 The Combadge Project by mo-g
 * 
 * Spin Doctor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * 
 * Spin Doctor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Spin Doctor.  If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * User class describes a person who signs in to a Communicator. A User will
 * have the following mandatory attributes:
 * - username: a unique identifier. This will link a User object to it's source
 *   in the database, and will be derived from and associated to any directory.
 * - name: The user's human-readable name as they or the directory records.
 * 
 * Additionally, a User may have the following optional attributes:
 * - presence: A representation of the presence state of the user. This could
 *   be offline, available, DND, in-call.
 * - permittedContacts: A machine readable reference to the contacts permitted
 *   to contact this user. i.e. in SME, allow your secretary to contact the CEO
 *   but not the chaiwala. Should probably handle state-dependent logic - i.e.
 *   allow your partner to contact you in DND mode, but not your mother-in-law.
 * - personalContacts: A store of the contacts that relate specifically to you.
 *   E.G. Your pharmacy, your work. This allows shorthands that wouldn't make
 *   sense when used by other people.
 */

userTemplate = { 
    userName: "u-fallbackuser", // Globally unique ID
    fullName: new UserFullName(personalName = "Fallback", familyName = "User", nickName = "Fallback User"),
    ipaPronunciation: "fɔːlbæk ˈjuːzə", // Not currently in use for STT or TTS but worth adding.
    groups: [],

    communicators: ["ba:dg:em:ac:ad:dr"], // Optional, for autologin/whitelisting
    terminals: ["te:rm:in:al:ma:cs"] // Being vidcom terminals that can be used to make video calls.
};

groupTemplate = {
    groupName: "g-allhands",
    nickName: "All Hands",
    ipaPronunciation: "ɔːl hændz", // Not currently in use for STT or TTS but worth adding.
    users: [],

    address: "Placeholder for multicast IPAddress Object"
};


/**
 * First pass. Probably want to restructure this to allow returning different form of name.
 * Also we'll usually be left with a trailing space right now, which needs fixing.
 * 
 * Do we want to merge pronunciation in to this as well?
 * 
 * Geronymic is intended as a gender neutral word for the Slavic Patronymic,
 * and any matriarchal anternative hat does or does not exist. Invented to my knowledge by
 * Stephanie Lackas Soressi on Stackexchange. Thanks Steph!
 * 
 * A mononym is encoded as a personal name, for any avoidance of doubt. Writing a naming
 * library for a Trek-derived software stack without supporting the names "Spock" or "Sarek"
 * would be most tactless.
 */
class UserFullName {
    constructor ({prefix = "",
                  personalName = "",
                  middleNames = [],
                  familyName = "",
                  suffix = "",
                  nickName = "",
                  geronymic = ""} = {}) {
        this.prefix = prefix;
        this.personalName = personalName;
        this.middleNames = middleNames;
        this.familyName = familyName;
        this.suffix = suffix;
        this.nickName = nickName;
        this.geronymic = geronymic;

        preferredFormat = this.westernName;
    };

    fullName () {
        var assembled = "";
        if (this.prefix) {assembled += this.prefix + " "};
        if (this.personalName) {assembled += this.personalName + " "};
        if (this.middleNames) {
            this.middleNames.forEach(function (name) {
                assembled += name + " ";
            });
        };
        if (this.familyName) {assembled += this.familyName + " "};
        if (this.suffix) {assembled += this.suffix};

        if (assembled) {
            return assembled;
        } else {
            throw "Cannot stringify empty name."
        };
    };

    /**
     * The science officer formerly known as...
     */
    mononym () {
        var assembled = "";
        if (this.prefix) {assembled += this.prefix + " "};
        if (this.personalName) {assembled += this.personalName};

        if (assembled) {
            return assembled;
        } else {
            throw "Cannot stringify empty name."
        };
    };

    /**
     * First past of an anglosphere "short name"
     */
    westernName () {
        var assembled = "";
        if (this.prefix) {assembled += this.prefix + " "};
        if (this.personalName) {assembled += this.personalName + " "};
        if (this.familyName) {assembled += this.familyName};

        if (assembled) {
            return assembled;
        } else {
            throw "Cannot stringify empty name."
        };
    };

    /**
     * If someone can provide a better name for this name structure, please do. Also,
     * if I've made any error in handling titles - please let me know.
     */
    slavicName () {
        var assembled = "";
        if (this.prefix) {assembled += this.prefix + " "};
        if (this.personalName) {assembled += this.personalName + " "};
        if (this.geronymic) {assembled += this.geronymic + " "};
        if (this.familyName) {assembled += this.familyName};

        if (assembled) {
            return assembled;
        } else {
            throw "Cannot stringify empty name."
        };
    };

    /**
     * I really want to implement this in a way that handles titles properly, but I'm not
     * confident of getting that right on the first pass, hence I've gone basic and just
     * stuck with "family fore" for now, so we at least show the intent of properly handling
     * names from different cultures than say - the anglosphere.
     */
    japaneseName () {
        var assembled = "";
        if (this.familyName) {assembled += this.familyName + " "};
        if (this.personalName) {assembled += this.personalName};

        if (assembled) {
            return assembled;
        } else {
            throw "Cannot stringify empty name."
        };
    };

    /**
     * This is fairly rudimentary, but it'll do for now.
     */
    tlhInganName () {
        var assembled = "";
        if (this.personalName) {assembled += this.personalName + " "};
        assembled += "child of "
        if (this.geronymic) {assembled += this.geronymic};

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
