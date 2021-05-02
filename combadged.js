/**
 * Spin Doctor, a Combadge Voice Server
 * Copyright (C) 2021 Gray Marchiori-Simpson
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
 * Note - this program will initially contain methods and assumptions that will
 * be transferred to more specific models, config and interfaces as development
 * progresses. This will start ugly and clean up as we work out the final
 * architecture.
 */


const dgram = require('dgram'); // The CnC Protocol is UDP-based.
const communicator = require('./Models/communicator.js');


const interface = '10.98.2.30'; // The interface to listen on.
const protocolIdent = "aeaeaeae"; // The ident string for the badge protocol.
const updatePort = 5555; // The port for the updater service.
const controlPort = 5002; // The port for the command-and-control service.
const rtpAudioPort = 5200; // The port for the RTP audio service.

const commandProtocolValues = {
    legacy: "0000",
    smart: "0001"
};


const controlServer = dgram.createSocket('udp4');
controlServer.bind(controlPort, interface);
controlServer.on('listening', () => {
    const address = controlServer.address();
    console.log(`C&C server listening ${address.address}:${address.port}`);
});

const updateServer = dgram.createSocket('udp4');
updateServer.bind(updatePort, interface);
updateServer.on('listening', () => {
    const address = updateServer.address();
    console.log(`Updater server listening ${address.address}:${address.port}`);
});


/**
 * 
 * @param {*} badgeCall 
 * @returns 
 */
 function slicePacket (message) {
    if (message.slice(0, 8) == protocolIdent) {
        return {
            command: message.slice(8, 12),
            settingOne: message.slice(12, 16),
            settingTwo: message.slice(16, 20),
            serial: parseInt(message.slice(20, 28), 16),
            MAC: message.slice(28, 40),
            data: message.slice(40)
        };
    };
    return undefined;
};

activeBadges = {};

/**
 * Handle the command and control protocol. Detect new badges to create Objects for
 * and pass traffic to existing badges based on MAC address.
 */
controlServer.on('message', (message, clientInfo) => {
    address = clientInfo.address; port = clientInfo.port;
    packet = slicePacket(message.toString('hex'));

    if (packet == undefined) {
        console.log(`Received datagram from badge at ${address}:${port}. Ignoring faulty or incompatible packet.`);
        return false;
    };

    if (packet.MAC in activeBadges) {
        activeBadges[packet.MAC].packetSorter(packet);
    } else {
        activeBadges[packet.MAC] = new communicator.Combadge(packet.MAC, address, port, packet, controlServer);
    };

});

/**
 * Receive and respond to updater requests from badges. We don't have the firmware (unless OEM decides to release it separate from the CVS)
 * so just tell them to chill out.
 */
updateServer.on('message', (message, clientInfo) => {
    console.log(`Received datagram from badge at ${clientInfo.address}:${clientInfo.port}`);
    console.log(message.toString('hex'));
});
