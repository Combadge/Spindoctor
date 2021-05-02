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


// The values to be sent to identify each command from server to badge.
const vCommands = {
    //Sign In and Out
    Ping: "0003",
    Ack: "0002",
    UserLogIn: "0005",
    UserLogOut: "0012",
    UpdateUserInfo: "0019",
    // Call Management
    SetBadgeDisplay: "000a",
    TriggerBadgePrompt: "0014",
    EndCall: "0009",
    SetCallTarget: "0007",
    //Message Handling
    NewMessageA: "000b",
    NewMessageB: "0010",
    // Badge Management Commands:
    ChangeControlServer: "0017",
    ChangeAudioManagerIP: "0008",
    Update: "0001",
    SetBadgeSettings: "000e",
    UploadDiagnostics: "001a",
    Shutdown: "0013",
    SetAPName: "0006",
    UpdateBadgeName: "001b",
    UserPressedCall: "0004",
    // Unknown and Not Implemented:
    NotImplemented: [
        "0000",
        "0011",
        "0016",
        "0018"
    ],
    Unknown: [
        "000c",
        "000d",
        "000f",
        "0015"
    ]
};

const vInitPhase = {
    firstPing: "First Ping Received",
    apNameSet: "AP name set"
};

const vbCommands = {
    "0003": "Ping",
    "0002": "Ack",
    "0006": "SetAPName",
    "000e": "SetBadgeSettings",
    "0011": "Unknown 0011 ??send erbits?",
    "0016": "Unknown 0016",
    "0004": "UserPressedCall",
    "000a": "SetBadgeDisplay",
    "0007": "SetCallTarget"
};

const audioProtocol = {
    RTP: "0400",
    vRTP: "0000"
};

const emptySetting = "0000";


/**
 * Take a string of hex values and extract ASCII form.
 */
 function ucify (hexString) {
    var output = "";
    for (var n = 0; n < hexString.length; n += 2) {
        output += String.fromCharCode(parseInt(hexString.substr(n, 2), 16));
    };
    return output;
};


function asciiCode (character) { return character.charCodeAt(0); }

/**
 * Take a string of ASCII values and extract hex form.
 */
 function unucify (asciiString) {
    var intCharCode = asciiString.split('').map(asciiCode);
    var hexCharCode = intCharCode.map(char => char.toString(16));

    return hexCharCode.join("");
};

function ipHexify (address) {
var bytes = address.split(".");
var hex = bytes.map(value => parseInt(value).toString(16).padStart(2, '0'));
return hex.join("");
};

function stringByteLength (string) {
    var byteCount = string.length/2;
    return byteCount.toString(16).padStart(4,'0');
}


/**
 * Communicator class describes a physical or virtual communications device
 * allocated to a single individual at a time. E.G. A hand-held speaker or a
 * wrist or chest worn communicator.
 *
 * Mandatory Values:
 *   MAC address. (Unique identifier.)
 *   IP address. (Place to contact.)
 */
class Communicator {
    constructor(MAC, IP) {
    this.IP = IP;
    this.MAC = MAC;
    this.User = undefined;
    };
};

/**
 * Combadge class adds to Communicator for Badge-specific features.
 */
class Combadge extends Communicator {
    constructor(MAC, IP, sourceUDPPort, packet, UDPServer) {
        super(MAC, IP);
        if(packet.command != "0003") {
            console.log(":(");
        };

        this.UDPServer = UDPServer;
        this.sourceUDPPort = sourceUDPPort;

        this.badgeSerial = 1;
        this.serverSerial = 1;
        var deconstruction = this.unpackPing(packet.data);
        
        console.log(`${this.MAC} ${this.getUserPrettyName()}: RX [${packet.serial}] ${packet.command}`);

        this.initPhase = vInitPhase.firstPing;
        this.sendTimestampAck();
        this.sendBadgeSettings();

        
        this.userName = "u-afakeuser";
        this.prettyName = "Alex Fakeuser";

        this.inCallState = false;
    };
    
    sendCommandToBadge(response) {
        console.log(`${this.MAC} ${this.getUserPrettyName()}: TX [${response.serial}] ${vbCommands[response.command]} ${response.third}`);
        var serial = response.serial.toString(16).padStart(8, '0');
        var dgramConstruct = "aeaeaeae" + response.command + response.first + response.second + serial + this.MAC + response.third;
        this.UDPServer.send(new Buffer.from(dgramConstruct, 'hex') , this.sourceUDPPort, this.IP);

    };

    packetSorter(packet) {
        console.log(`${this.MAC} ${this.getUserPrettyName()}: RX [${packet.serial}] ${packet.command} ${packet.data}`);
        this.badgeSerial = packet.serial;

        switch(packet.command) {
            case vCommands.Ack: 
                switch(this.initPhase) {
                    case vInitPhase.firstPing:
                        this.incrementSerial();
                        this.sendAPName();
                        break;
                    case vInitPhase.apNameSet:
                        break;
                }
            break;

            case vCommands.UserPressedCall: 
                switch(packet.data.slice(-4)) {
                    case "0000":
                        if (this.inCallState) {
                            this.hangUp();
                            this.inCallState = false;
                            break;
                        } else {
                            this.sendBlankAck(this.badgeSerial);
                            this.incrementSerial();
                            this.setBadgeAgentString();
                            this.inCallState = true;
                            break;
                        }

                    case "0001":
                        //protocID cmnd 0000 0000 serialno macaddressno ???? ???? ???? targetip port ???? ..
                        //aeaeaeae 0007 0000 0000 00000005 0009ef07e007 0001 0001 0001 0a620244 1d7c 0001 00
                        //aeaeaeae 0007 45f7 04f5 00000072 0009ef025677 0003 0001 0001 e6e6000d 1c50 0002 00
                        this.sendBlankAck(this.badgeSerial);
                        this.incrementSerial();
                        this.callRTPTarget()
                        break;
                }
                break;

            default:
                this.sendBlankAck(this.badgeSerial);
                //console.log(JSON.stringify(packet, null, 4));

        }
    };

    /**
     * Send RTP connection details and trigger the badge to start a call.
     */
    callRTPTarget () {
        var serverAddress = this.UDPServer.address();
        //This is where we need to spawn an RTP server thread.
        var serverPort = "5299"; //because why not

        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.SetCallTarget;
        response.first = emptySetting;
        response.second = emptySetting;
        response.third = `000100010001${ipHexify(serverAddress.address)}${parseInt(serverPort).toString(16)}000100`; //because I have no idea what the rest does yet.
    
        this.sendCommandToBadge(response);
    };

    /**
     * Trigger badge to hang up active call.
     */
    hangUp () {
        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.EndCall;
        response.first = emptySetting;
        response.second = emptySetting;
        response.third = emptySetting;
    
        this.sendCommandToBadge(response);
    };

    /**
     * Respond to initial ping with current dateTime.
     */
    sendTimestampAck() {
        var unixtime = Date.now() / 1000 | 0;

        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.Ack;
        response.first = emptySetting;
        response.second = audioProtocol.RTP;
        response.third = `${unixtime.toString(16)}0000012b`;
    
        this.sendCommandToBadge(response);
    };

    /**
     * Respond to initial ping with blank data.
     */
     sendBlankAck(suppliedSerial) {
        var response = {};
        response.serial = suppliedSerial;
        response.command = vCommands.Ack;
        response.first = emptySetting;
        response.second = audioProtocol.RTP;
        response.third = `${emptySetting}${emptySetting}${emptySetting}${emptySetting}`;
    
        this.sendCommandToBadge(response);
    };

    /**
     * Send badge the current settings. Currently running with the default from a B3000N - 40 for no DND, plus whatever bb8cf3 is.
     * Should be treated as a stub and expanded when more understanding of this is reached and we implement badge statefulness.
     */
    sendBadgeSettings() {
        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.SetBadgeSettings;
        response.first = emptySetting;
        response.second = emptySetting;
        response.third = "40bb8cf3";
    
        this.sendCommandToBadge(response);
    };

    /**
     * Send badge the name of the current AP. Currently just stubbing this out. We need to actuall manage AP names before we can give real ones.
     */
    sendAPName() {

        var accessPointName = new String("Test APNAME");
        var accessPointName = unucify(accessPointName);
        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.SetAPName;
        response.first = emptySetting;
        response.second = emptySetting;
        response.third = `${stringByteLength(accessPointName)}${accessPointName}`;
    
        this.sendCommandToBadge(response);

        this.initPhase = vInitPhase.apNameSet;
    };

    

    /**
     * Provide the name of the current logged in user.
     */
     getUserPrettyName() {
        //var user = this.User;
        return "Inactive";
    };
 

    /**
     * Append a new serial to the serial list.
     */
    incrementSerial() {
        this.serverSerial += 1;
    }

    /**
     * Call the badge, 
     */
    setBadgeAgentString() {

        //aeaeaeae000a00000000000000040009ef07e0070006564f43455241000000000000000000000000

        var displayString = "Computer";
        var displayString = unucify(displayString);
        var displayStringLength = stringByteLength(displayString);
        var displayString = displayString.concat("".padEnd(24,"0"));

        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.SetBadgeDisplay;
        response.first = emptySetting;
        response.second = emptySetting;
        response.third = `${displayStringLength}${displayString}`;
    
        this.sendCommandToBadge(response);

                //  $LEN V-O-C-E-R-A- (tail padded with 12 bytes of 00)
                //  0006 564f43455241 000000000000000000000000
    };

    /**
     * Use the userName and prettyName values set on the badge object by the log in function on the agent, and update the badge.
     */
    userLogIn() {
        var userString = unucify(this.userName);
        var prettyString = unucify(this.prettyName);
        var userStringLength = stringByteLength(userString);
        var prettyStringLength = stringByteLength(prettyString);
        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.UserLogIn;
        response.first = emptySetting;
        response.second = emptySetting;
        response.third = `${userStringLength}${userString}${prettyStringLength}${prettyString}`;
    
        this.sendCommandToBadge(response);
    };

    /**
     * Reset the badge state to default.
     */
    userLogOut() {
        var response = {};
        response.serial = this.serverSerial;
        response.command = vCommands.UserLogOut;
        response.first = emptySetting;
        response.second = emptySetting;
        response.third = emptySetting;
    
        this.sendCommandToBadge(response);
    };

    unpackPing(packetData) {
        // UNKNUNIXTIME..APMACADDRISH....Ln(username)..Ln(prettyname)04040404040404040404040404040404040404040000000000000000NOTKNOWN
        var elements = {};
        elements.partone = packetData.slice(0, 4);
        elements.options = packetData.slice(4, 12);
        // spacer = packetData.slice(12, 14);
        elements.apmacaddr = packetData.slice(14, 26);
        // spacer = packetData.slice(26, 28);
        packetData = packetData.slice(28);

        var unameLength = (parseInt(packetData.slice(0,4), 16))*2;
        if (unameLength == 0) {unameLength = 2};
        var uname = packetData.slice(4,(unameLength+4));
        if (uname == "00") {uname = undefined};
        elements.uname = ucify(uname);
        packetData = packetData.slice((unameLength+4));

        var pnameLength = (parseInt(packetData.slice(0,4), 16))*2;
        if (pnameLength == 0) {pnameLength = 2};
        var pname = packetData.slice(4,(pnameLength+4));
        if (pname == "00") {pname = undefined};
        elements.pname = ucify(pname);
        packetData = packetData.slice((pnameLength+4));

        //40spacer = packetData.slice(0, 40);
        //00spacer = packetData.slice(40, 56);

        elements.lastpart = packetData.slice(56);
    };
};

exports.Communicator = Communicator
exports.Combadge = Combadge;

