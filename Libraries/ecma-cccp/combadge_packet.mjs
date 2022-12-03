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


import { UserIdent } from "./identifier.mjs";

/**
 * The protocol ident from the command packet header.
 */
const VozIdent = "aeaeaeae";

/**
 * A pairing of ServerCommand:BadgeCommand. Used for defining packets to send
 * to the badge.
 */
const VozServerCommands = {
    //Sign In and Out
    Ping: "0003", // from
    Ack: "0002",  // from compile
    UserLogIn: "0005", // compile
    UserLogOut: "0012", // compile
    UpdateUserInfo: "0019", // compile
    // Call Management
    SetBadgeDisplay: "000a", // compile
    TriggerBadgePrompt: "0014", // compile
    HangUp: "0009", // compile
    CallRTPTarget: "0007", // compile
    //Message Handling
    NewMessageA: "000b", // compile
    NewMessageB: "0010", // compile
    // Badge Management Commands:
    ChangeControlServer: "0017", // compile
    ChangeAudioManagerIP: "0008", // compile
    Update: "0001", // compile
    SetBadgeSettings: "000e", // compile
    UploadDiagnostics: "001a", // compile
    Shutdown: "0013", // compile
    SetAPName: "0006", // compile
    UpdateBadgeName: "001b", // compile
    UserPressedCall: "0004", // from
    MaybeSetErbits: "0011", // from
    MaybeSendLogs: "0016", // from
    Unknown0: "0000",
    UnknownC: "000c",
    UnknownD: "000d",
    UnknownF: "000f",
    Unknown15: "0015",
    Unknown18: "0018"
};

/**
 * Invert the ServerCommand:BadgeCommand keypairs to get the pairing of
 * BadgeCommand:ServerCommand. This is used to interpret packets received by
 * the badge, and I wasn't about to hardcode them twice. At least this way
 * it only loops once. If just using:
 * 
 * Object.keys(VozServerCommands).find(serverCommand => VozServerCommands[serverCommand] === badgeCommand);
 * 
 * Is quicker, someone let me know and I'll substitute it.
 */
 const VozBadgeCommands = function (serverCommands) {
    var badgeCommands = {};
    for (var command in serverCommands) {
        badgeCommands[serverCommands[command]] = command;
    }
    return badgeCommands;
} (VozServerCommands);

const VozAudioProtocol = {
    RTP: "0400",
    VRTP: "0000"
};

const EmptySetting = "0000";
const AgentName = "Computer";

const VozBSSIDError = 18; // I have no idea why, but it adds 

/**
 * Take a string of hex values and extract ASCII form.
 */
 function hexToUnicode (hexString) {
    var output = "";
    for (var n = 0; n < hexString.length; n += 2) {
        output += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
    }
    return output;
}

function asciiCode (character) { return character.charCodeAt(0); }

/**
 * Take a string of ASCII values and extract hex form.
 */
 function unicodeToHex (asciiString) {
    var intCharCode = asciiString.split('').map(asciiCode);
    var hexCharCode = intCharCode.map(char => char.toString(16));

    return hexCharCode.join("");
}

function ipDecToHex (address) {
    var bytes = address.split(".");
    return bytes.map(value => parseInt(value).toString(16).padStart(2, '0')).join("");
}

function bufferToMacAddr (macBuffer) {
    return macBuffer.toString('hex').match( /.{1,2}/g ).join( ':' );
}

function macAddrToBuffer (macAddress) {
    return Buffer.from(macAddress.split(':').join(''), 'hex');
}

function bufferToBSSID (bssidBuffer) {
    var bssidArray = bssidBuffer.toString('hex').match( /.{1,2}/g );
    bssidArray[0] = ( parseInt(bssidArray[0], 16) - VozBSSIDError ).toString(16);
    return bssidArray.join( ':' );
}

function bssidToBuffer (bssid) {
    var bssidArray = bssid.split(':');
    bssidArray[0] = ( parseInt(bssidArray[0], 16) + VozBSSIDError ).toString(16);
    return Buffer.from(bssid.join(''), 'hex');
}

function stringByteLength (string) {
    var byteCount = string.length/2;
    return byteCount.toString(16).padStart(4,'0');
}


/**
 * Primitive for the packet structure used by OEM Combadges.
 */
 class CombadgePacket {
     
    _serial = new String();

    constructor (macAddress) {
        this.MAC = macAddress;
    }

    set serial (serialValue) {
        this._serial = serialValue.toString(16).padStart(8, '0');
    }

    get serial () {
        return parseInt(this._serial, 16);
    }

    get hexSerial () {
        return this._serial;
    }

    /**
     * Takes a dgram as a Buffer, and decodes it into a structured object
     * representing the packet sent by the badge. Then call a from() in an appropriate
     * subclass, decided by command and possibly further sublogic later.
     * 
     * Allows a program to import CombadgePacket only, and get a fully decoded packet back
     * that can be passed to a Combadge instance.
     * 
     * Inspired by Array.from().
     */
    static from(packet) {
        if (packet.slice(0, 4).toString('hex') !== VozIdent) {
            throw new Error("Not a Combadge Control Packet", packet.toString('hex'));
        }
        var command = packet.slice(4, 6).toString('hex');

        var segmentedPacket = {
            firstSetting: packet.slice(6, 8).toString('hex'),
            secondSetting: packet.slice(8, 10).toString('hex'),
            serial: packet.slice(10, 14).readInt32BE(),
            MAC: packet.slice(14, 20).toString('hex'),
            data: packet.slice(20)
        };
        
        /**
         * This only needs cover things the badge will send to the server.
         */
        switch (command) {
            case VozServerCommands.Ping:
                var newPacket = Ping.from(segmentedPacket);
                break;
            case VozServerCommands.Ack:
                var newPacket = Ack.from(segmentedPacket);
                break;
            case VozServerCommands.UserPressedCall:
                var newPacket = CallPressed.from(segmentedPacket);
                break;
            case VozServerCommands.MaybeSetErbits:
                var newPacket = ErBits.from(segmentedPacket);
                break;
            case VozServerCommands.MaybeSendLogs:
                var newPacket = BadgeLogs.from(segmentedPacket);
                break;
        }

        if (newPacket) {
            return newPacket;
        } else {
            return undefined;
        }
    }

    toBuffer (values) {

        var hexPackedPacket = VozIdent + values.command + values.firstSetting + values.secondSetting + this.hexSerial + this.MAC + values.data;
        return Buffer.from(hexPackedPacket, 'hex');
    }
}

/**
 * Cannot be compiled, only ever received from the badge, never sent to it.
 */
class Ping extends CombadgePacket {
    constructor (MAC, {propertyVersion = EmptySetting, firmwareVersion = EmptySetting, packetData = {}} = {}) {
        super(MAC);
        this.propertyVersion = propertyVersion;
        this.firmwareVersion = firmwareVersion;
        this.options = packetData.options;
        this.accessPoint = packetData.apBSSID;
        this.userName = packetData.userName;
        this.prettyName = packetData.prettyName;
    }

    toString () {
        return `AP: ${this.accessPoint}, login: ${this.userName}, name: ${this.prettyName}`;
    }

    static from (structuredPacket) {
        var MAC = structuredPacket.MAC;
        var packetSerial = structuredPacket.serial;
        var propertyVersion = parseInt(structuredPacket.firstSetting, 16);
        var firmwareVersion = parseInt(structuredPacket.secondSetting, 16);
        var packetData = structuredPacket.data;

        var dataValues = {};
        dataValues.firstValue = packetData.slice(0, 2);
        dataValues.options = packetData.slice(2, 6);
        var __spacer = packetData.slice(6, 7);
        dataValues.apBSSID = bufferToBSSID(packetData.slice(7, 13));
        var __spacer = packetData.slice(13, 14);
        packetData = packetData.slice(14);

        var unameLength = packetData.slice(0,2).readInt16BE();
        var uname = packetData.slice(2,(unameLength+2)).toString('hex');
        if (uname == "") {
            dataValues.userName = undefined;
        } else {
            dataValues.userName = hexToUnicode(uname);
        }
        packetData = packetData.slice((unameLength+2));

        var pnameLength = packetData.slice(0,2).readInt16BE();
        var pname = packetData.slice(2,(pnameLength+2)).toString('hex');
        if (pname == "") {
            dataValues.prettyName = undefined;
        } else {
            dataValues.prettyName = hexToUnicode(pname);
        }
        packetData = packetData.slice((pnameLength+2));

        var __40spacer = packetData.slice(0, 20);
        var __00spacer = packetData.slice(20, 28);

        dataValues.lastValue = packetData.slice(28);

        var returnPacket = new Ping(MAC, {propertyVersion: propertyVersion, firmwareVersion: firmwareVersion, packetData: dataValues});
        returnPacket.serial = packetSerial;
        return returnPacket;
    }

    toBuffer () {
        throw TypeError("Ping is a badge-only command and cannot be compiled.");
    }
}


class Ack extends CombadgePacket {
    constructor (MAC, {sendTime = false, sendAudio = true} = {}) {
        super(MAC);
        this.sendTime = sendTime;
        this.sendAudio = sendAudio;
    }

    toString () {
        if (this.sendTime) {
            return `Sending Timestamp`;
        } else {
            return `Blank ACK`;
        }
    }

    static from (structuredPacket) {
        var MAC = structuredPacket.MAC;
        var packetSerial = structuredPacket.serial;
        var propertyVersion = parseInt(structuredPacket.firstSetting, 16);
        var firmwareVersion = parseInt(structuredPacket.secondSetting, 16);
        var data = structuredPacket.data;

        var returnPacket = new Ack(MAC);
        returnPacket.serial = packetSerial;
        return returnPacket;
    }

    toBuffer () {
        if (this.sendTime) {
            var unixtime = Date.now() / 1000 | 0;
            var data = `${unixtime.toString(16)}0000012b`;
        } else {
            var data = `${EmptySetting}${EmptySetting}${EmptySetting}${EmptySetting}`;
        }

        if (this.sendAudio) {
            var audioProtocol = VozAudioProtocol.RTP;
        } else {
            var audioProtocol = EmptySetting;
        }

        var values = {
            command: VozServerCommands.Ack,
            firstSetting: EmptySetting,
            secondSetting: audioProtocol,
            data: data
        };
        return super.toBuffer(values);
    }
}

/**
 * Send badge the current settings. Currently running with the default from a B3000N - 40 for no DND, plus whatever bb8cf3 is.
 * Should be treated as a stub and expanded when more understanding of this is reached and we implement badge statefulness.
 */

 class NewMessageA extends CombadgePacket {
    constructor (MAC, {} = {}) {
        super(MAC);
    }

    toString () {
        return `Packet design incomplete. No summary available.`;
    }

    toBuffer () {
        var values = {
            command: VozServerCommands.NewMessageA,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: "".padEnd(20,"04")
        };
        return super.toBuffer(values);
    }
}

/**
 * Send badge the current settings. Currently running with the default from a B3000N - 40 for no DND, plus whatever bb8cf3 is.
 * Should be treated as a stub and expanded when more understanding of this is reached and we implement badge statefulness.
 */

class BadgeSettings extends CombadgePacket {
    constructor (MAC, {} = {}) {
        super(MAC);
    }

    toString () {
        return `Packet design incomplete. No summary available.`;
    }

    toBuffer () {
        var values = {
            command: VozServerCommands.SetBadgeSettings,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: '40bb8cf3'.padEnd(20,"04")
        };
        return super.toBuffer(values);
    }
}

class CallPressed extends CombadgePacket {
    constructor (MAC, {propertyVersion = EmptySetting, firmwareVersion = EmptySetting, callState = false} = {}) {
        super(MAC);
        this.propertyVersion = propertyVersion;
        this.firmwareVersion = firmwareVersion;
        this.callState = callState;
    }

    toString () {
        if (this.callState) {
            return `Dialling in progress.`;
        } else {
            return `Beginning Call`;
        }
    }

    static from (structuredPacket) {
        var MAC = structuredPacket.MAC;
        var packetSerial = structuredPacket.serial;
        var propertyVersion = parseInt(structuredPacket.firstSetting, 16);
        var firmwareVersion = parseInt(structuredPacket.secondSetting, 16);
        var callState = Boolean(structuredPacket.data.readUInt16BE());

        var returnPacket = new CallPressed(MAC, {propertyVersion: propertyVersion, firmwareVersion: firmwareVersion, callState: callState});
        returnPacket.serial = packetSerial;
        return returnPacket;
    }
}

class ErBits extends CombadgePacket {
    constructor (MAC, {propertyVersion = EmptySetting, firmwareVersion = EmptySetting, erbits = Buffer.from([])} = {}) {
        super(MAC);
        this.propertyVersion = propertyVersion;
        this.firmwareVersion = firmwareVersion;
        this.erbits = erbits;
    }

    toString () {
        return `Packet design incomplete. No summary available.`;
    }

    static from (structuredPacket) {
        var MAC = structuredPacket.MAC;
        var packetSerial = structuredPacket.serial;
        var propertyVersion = parseInt(structuredPacket.firstSetting, 16);
        var firmwareVersion = parseInt(structuredPacket.secondSetting, 16);
        var erbits = structuredPacket.data.toString('hex');

        var returnPacket = new ErBits(MAC, {propertyVersion: propertyVersion, firmwareVersion: firmwareVersion, erbits: erbits});
        returnPacket.serial = packetSerial;
        return returnPacket;
    }
}


class BadgeLogs extends CombadgePacket {
    constructor (MAC, {propertyVersion = EmptySetting, firmwareVersion = EmptySetting, badgeLogs = Buffer.from([])} = {}) {
        super(MAC);
        this.propertyVersion = propertyVersion;
        this.firmwareVersion = firmwareVersion;
        this.badgeLogs = badgeLogs;
    }

    toString () {
        return `Packet design incomplete. No summary available.`;
    }

    static from (structuredPacket) {
        var MAC = structuredPacket.MAC;
        var packetSerial = structuredPacket.serial;
        var propertyVersion = parseInt(structuredPacket.firstSetting, 16);
        var firmwareVersion = parseInt(structuredPacket.secondSetting, 16);
        var badgeLogs = structuredPacket.data.toString('hex');

        var returnPacket = new BadgeLogs(MAC, {propertyVersion: propertyVersion, firmwareVersion: firmwareVersion, badgeLogs: badgeLogs});
        returnPacket.serial = packetSerial;
        return returnPacket;
    }
}

/**
 * Set the badge's display to show the target that we're calling. Defaults to
 * the globally set Agent string.
 */
 class DisplayTarget extends CombadgePacket {
    constructor (MAC, {displayString = AgentName} = {}) {
        super(MAC);
        this.displayString = displayString;
    }

    toString () {
        return `Setting display to: ${this.displayString}`;
    }

    toBuffer () {
        var displayString = unicodeToHex(this.displayString);
        var displayStringLength = stringByteLength(displayString);
        var endPadding = "".padEnd(12,"00");
        var data = `${displayStringLength}${displayString}${endPadding}`;

        var values = {
            command: VozServerCommands.SetBadgeDisplay,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: data
        };
        return super.toBuffer(values);
    }
}

/**
 * Send RTP connection details and trigger the badge to start a call.
*/
class CallRTP extends CombadgePacket {
    constructor (MAC, {address = "0.0.0.0", port=5299} = {}) {
        super(MAC);
        this.targetAddress = address;
        //This is where we need to spawn an RTP server thread.
        this.targetPort = port;
    }

    toString () {
        return `Calling RTP host at ${this.targetAddress}:${this.targetPort}`;
    }

    toBuffer () {
        var values = {
            command: VozServerCommands.CallRTPTarget,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: `000100010001${ipDecToHex(this.targetAddress)}${parseInt(this.targetPort).toString(16)}000100`
        };
        return super.toBuffer(values);
    }
}  

class HangUp extends CombadgePacket {
    constructor (MAC, {} = {}) {
        super(MAC);
    }

    toString () {
        return `Ending active call.`;
    }

    toBuffer () {
        var values = {
            command: VozServerCommands.HangUp,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: ""
        };
        return super.toBuffer(values);
    }
}

class LogIn extends CombadgePacket {
    constructor (MAC, userIdent = new UserIdent) {
        super(MAC);
        this.userIdent = userIdent
    }

    toString () {
        return `Logging in user ${this.userIdent}`;
    }

    toBuffer () {
        var values = {
            command: VozServerCommands.UserLogIn,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: this.userIdent.toBuffer().toString('hex')
        };
        return super.toBuffer(values);
    }
}


class LogOut extends CombadgePacket {
    constructor (MAC, {} = {}) {
        super(MAC);
    }

    toString () {
        return `Logging user out.`;
    }

    toBuffer () {
        var values = {
            command: VozServerCommands.UserLogOut,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: ""
        };
        return super.toBuffer(values);
    }
}


/**
 * Send a prompt, I think this is for the logs only but I'm not sure.
 */

class PromptText extends CombadgePacket {
    constructor (MAC, {prompt = "default_prompt"} = {}) {
        super(MAC);
        this.prompt = prompt;
    }

    toString () {
        return `Sending prompt: ${this.prompt}`;
    }

    toBuffer () {
        var promptText = "Prompt: " + this.prompt;
        var promptString = unicodeToHex(promptText);
        var values = {
            command: VozServerCommands.TriggerBadgePrompt,
            firstSetting: EmptySetting,
            secondSetting: EmptySetting,
            data: `${stringByteLength(promptString)}${promptString}`
        };
        return super.toBuffer(values);
    }
}

/**
 * Send badge the name of the current AP. Currently just stubbing this out. We need to actuall manage AP names before we can give real ones.
 */
/*
sendAPName () {

    var accessPointName = new String("Test APNAME");
    var accessPointName = unucify(accessPointName);
    var response = {};
    response.serial = this.serverSerial;
    response.command = VozServerCommands.SetAPName;
    response.first = EmptySetting;
    response.second = EmptySetting;
    response.third = `${stringByteLength(accessPointName)}${accessPointName}`;

    this.sendCommandToBadge(response);

    this.initPhase = InitPhase.apNameSet;
};
*/
    

export default CombadgePacket;

/**
 * Only need to export packets that we can create and compile. Ignore
 * badge -> server only packets.
 */
export {
    CombadgePacket,
    Ack,
    BadgeSettings,
    DisplayTarget,
    CallRTP,
    HangUp,
    NewMessageA,
    LogIn,
    LogOut,
    PromptText
    //sendAPName
};
