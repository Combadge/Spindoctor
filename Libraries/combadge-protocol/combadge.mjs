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


import * as packets from './combadge_packet.mjs';
import { Identifier, UserIdent } from './identifier.mjs';


// 0014 aeaeaeae0014000000000000000c0009ef07e007005d5265636f676e697a6572434d53746174653a20526563526573756c74733d41736b466f724e616d652c000000000000000000000000000000000000000000002c20436f6e663d302e3635204772616d6d61723d73696e676c656e616d65 RecognizerCMState: RecResults=AskForName,<Username>, Conf=0.65 Grammar=singlename
// RecognizerCMState: RecResults=LogOut Conf=0.83 Grammar=mainmenu
// 0014 aeaeaeae0014000000000000001e0009ef07e007 003f 5265636f676e697a6572434d53746174653a20526563526573756c74733d4c6f674f757420436f6e663d302e3833204772616d6d61723d6d61696e6d656e75 RecognizerCMState: RecResults=LogOut Conf=0.83 Grammar=mainmenu
// 0014 aeaeaeae001400000000000000160009ef07e007 0007 5965734f724e6f "YesOrNo"
// 0014 aeaeaeae001400000000000000950009ef07e007 003f 5265636f676e697a6572434d53746174653a20526563526573756c74733d4c6f674f757420436f6e663d302e3834204772616d6d61723d6d61696e6d656e75 RecognizerCMState: RecResults=LogOut Conf=0.83 Grammar=mainmenu
//Prompt: 
const VozPrompts = [
    "say_or_spell_your_first_and_last_name",
    "good_morning",
    "good afternoon",
    "good_evening",
    "PlayPrompt_prompt_completed",
    "WhoIsThis_prompt_completed",
    "logging_in_as",
    "LogIn_prompt_completed",
    "u-usernamegoeshere",
    "bye",
    "genie",
    "MainMenu_prompt_completed",
    "logging_out",
    "AnnounceLogout_prompt_completed",
    "Bye_prompt_completed",
    "itys", // I think you said
    "itys_to_log_out",
    "itys_call",
    "is_this_correct",
    "ConfirmResult_prompt_completed",
    "do_not_understand",
    "try_again",
    "beam_up",
    "BeamMeUp_prompt_completed",
    "help_initial",
    "beep",
    "AskForHelpCMState_prompt_completed",
    "Help is available for call, broadcast, messages, volume, add to group, learn names and welcome tutorial.",
    "welcome_welcome",
    "welcome_confirm",
    "welcome_explain_yes_or_no",
    "welcome_dos_and_donts",
    "welcome_cannot_understand",
    "welcome_six_inches_from_chin",
    "ExplainDosAndDonts_prompt_completed",
    "welcome_can_do_more_than_make_calls",
    "welcome_just_give_me_a_simple_voice_command",
    "welcome_when_you_hear_that_prompt",
    "cancelled_welcome",
    "backoff_command",
    "AskForCommandCMState_prompt_completed",
    "backoff_call_user_or_group",
    "telephony_server_not_started"
];


/**
 * Combadge describes an instance of a Combadge existing on the network.
 * 
 * This class contains the logic for exchanging CombadgePackets with a Combadge device, 
 */
class Combadge{

    constructor (MAC, IP, sourceUDPPort, packet, UDPServer) {
        
        this.IP = IP;
        this.MAC = MAC;
        if(packet.constructor.name !== "Ping") {
            console.log("Invalid packet passed to Combadge Constructor.");
        };

        this.UDPServer = UDPServer;
        this.sourceUDPPort = sourceUDPPort;

        this.badgeSerial = packet.serial;
        this.serverSerial = this.badgeSerial;

        this.accessPoint = packet.accessPoint;

        this._agentPort = undefined;
        
        if (!(packet.userName == undefined)) {
            this.loginState = true;
            this._user = new UserIdent(packet.userName, packet.prettyName);
        } else {
            this._user = undefined;
            this.loginState = false;
        }

        console.log(`${this.MAC} ${this.getUserPrettyName()}: RX [${packet.serial}] ${packet.constructor.name} ${packet}`);

        var timeAck = new packets.Ack(this.MAC, {sendTime: true});
        timeAck.serial = this.serverSerial;
        this.sendCommandToBadge(timeAck);

        var settings = new packets.BadgeSettings(this.MAC);
        settings.serial = this.serverSerial;
        this.sendCommandToBadge(settings);

        this.callState = "Idle";
    };

    get agentPort () {
        return this._agentPort;
    };

    set agentPort (port) {
        this._agentPort = port;
    };

    get user () {
        return this._user;
    };

    set user (ident = new UserIdent("u-setuser", "SetUser Called")) {
        this._user = ident;
        this.incrementSerial();
        var login = new packets.LogIn(this.MAC, this._user);
        login.serial = this.serverSerial;
        this.sendCommandToBadge(login);
    };

    /**
     * Supercedes the Object() toString() function, allowing us to define how a Combadge instance appears in text.
     * 
     * @returns String()
     */
    toString () {
        return `Combadge ${this.MAC} is hosting user ${this._user} at location ${this.accessPoint}`;
    };

    /**
     * Used by JSON.Stringify() to represent the class in json format - mainly in our case for API use,
     * but we may find other benefits in loggin and saving?
     * 
     * Should not return function calls as object values! Only things that can be represented in JSON form!
     * 
     * @returns Object()
     */
    toJSON () {
        var state = new Object();
        state.MAC = this.MAC;
        state.IP = this.IP;
        state.user = this._user;
        state.status = this.callState;
        state.callTarget = null;
        return state;
    };
    
    sendCommandToBadge (responsePacket) {
        console.log(`${this.MAC} ${this.getUserPrettyName()}: TX [${responsePacket.serial}] ${responsePacket.constructor.name} ${responsePacket}`);
        this.UDPServer.send(responsePacket.toBuffer(), this.sourceUDPPort, this.IP);
    };

    packetSorter (packet) {
        console.log(`${this.MAC} ${this.getUserPrettyName()}: RX [${packet.serial}] ${packet.constructor.name} ${packet}`);
        this.badgeSerial = packet.serial;

        if (packet.constructor.name !== "Ack") {
            var blankAck = new packets.Ack(this.MAC);
            blankAck.serial = this.badgeSerial;
            this.sendCommandToBadge(blankAck); 
        };  

        switch(packet.constructor.name) {
            case "Ping":
                if (!(packet.userName == undefined)) {
                    this.loginState = true;
                };

                if (this.accessPoint !== packet.accessPoint) {
                    this.accessPoint = packet.accessPoint;

                    // If user has enabled patrol mode, record to track log.
                    // Send badge new AP pretty name.
                } else if (!this.loginState) {
                    this.incrementSerial();
                    var login = new packets.LogIn(this.MAC, new UserIdent("u-mobrien", "Miles O'Brien"));
                    login.serial = this.serverSerial;
                    this.sendCommandToBadge(login);
                };

                // If AP has not changed, do nothing.
                break;

            case "CallPressed":
                switch(this.callState) {
                    case "Idle":
                        switch(packet.callState) {
                            case false:
                                this.incrementSerial();
        
                                var setTargetToAgent = new packets.DisplayTarget(this.MAC);
                                setTargetToAgent.serial = this.serverSerial;
                                this.sendCommandToBadge(setTargetToAgent);
                                break;
        
                            case true:
                                this.incrementSerial();
                                var callAgent = new packets.CallRTP(this.MAC, {address: this.UDPServer.address().address, port: this.agentPort});
                                callAgent.serial = this.serverSerial;
                                this.sendCommandToBadge(callAgent);
                                this.callState = "Active";

                                /**this.incrementSerial();
                                var goodEvening = new packets.PromptText(this.MAC, {prompt: "genie"})
                                goodEvening.serial = this.serverSerial;
                                this.sendCommandToBadge(goodEvening);**/
                                break;
                        };
                        break;
                    
                    case "Active":
                        this.incrementSerial();
                        var hangUp = new packets.HangUp(this.MAC);
                        hangUp.serial = this.serverSerial;
                        this.sendCommandToBadge(hangUp); 
                        this.callState = "Ended";
                        break;

                    case "Ended":
                        this.callState = "Idle";
                }
            

            case "ErBits":
                break;

            case "BadgeLogs":
                break;

            default:
        };
    };

    /**
     * Provide the name of the current logged in user.
     */
     getUserPrettyName () {
        //var user = this.User;
        return "Inactive";
    };
 

    /**
     * Append a new serial to the serial list.
     */
    incrementSerial () {
        this.serverSerial += 1;
    };

    /**
     * Callback for an Agent (or other software) to instruct the Combadge
     * instance on what to do.
     * 
     * Initially this will be hooked to a basic restful web API so we can manually tell the badge what to do without the agent being involved.
     */
    externalCallback (instruction, values) {
        switch(instruction) {
            case "login":
                console.log("API request user change", this.MAC, values)
                this.user = new UserIdent(values.userName, values.prettyName);
            break;

            default:
        };

        return true;
    };
};

export { Combadge };
