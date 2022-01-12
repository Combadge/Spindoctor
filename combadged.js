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
 * Note - this program will initially contain methods and assumptions that will
 * be transferred to more specific models, config and interfaces as development
 * progresses. This will start ugly and clean up as we work out the final
 * architecture.
 */


import dgram from 'dgram';
import { CombadgePacket, Combadge } from './Libraries/combadge-protocol/index.mjs';


const netAddress = '10.98.2.30';
const updatePort = 5555;
const controlPort = 5002;


const controlServer = dgram.createSocket('udp4');
controlServer.bind(controlPort, netAddress);
controlServer.on('listening', () => {
    const address = controlServer.address();
    console.log(`C&C server listening ${address.address}:${address.port}`);
});

const updateServer = dgram.createSocket('udp4');
updateServer.bind(updatePort, netAddress);
updateServer.on('listening', () => {
    const address = updateServer.address();
    console.log(`Updater server listening ${address.address}:${address.port}`);
});


const rtpStartPort = 5299; // Start here, go up.
const rtpPoolInit = 3; // Init this many agent threads to start.
var agentPool = [];
/**
 * Populate agentPool with (rtpPoolInit) instances of open agent ports, that can be passed
 * to Combadge instances on demand for inferencing.
 */

/**
 * 
 * Pseudocode:
 * // for i in range(1, rtpPoolInit):
 * //     agentPool.append(dgram.createSocket())
 * 
 * need to also handle locking/releasing of the threads to combadge instances and
 * generating/killing additional threads on demand fot badges 4+
 * 
 * We should also try not to lock this too hard to badges - We should be able to handle
 * agent calls from different devices, with different default contexts. E.G. A combadge will
 * default to communications, while a replicator (coffee machine) with integrated audio 
 * hooking into the system will default to food ordering, and a wall panel will default to
 * environment.
 * 
 * And we should try not to block multi-part interfaces either - Combadges will be audio-only
 * but audio+display interfaces should also be considered, but not implemented upfront. 
 * 
 * This needs more design!
 * 
 */


 var activeBadges = {};

/**
 * Handle the command and control protocol. Detect new badges to create Objects for
 * and pass traffic to existing badges based on MAC address.
 */
controlServer.on('message', (message, clientInfo) => {
    var address = clientInfo.address; var port = clientInfo.port;
    var packet = CombadgePacket.from(message)
    if (packet == undefined) {
        console.log(`Received datagram from badge at ${address}:${port}. Ignoring faulty or incompatible packet.`);
        return false;
    };
    if (packet.MAC in activeBadges) {
        activeBadges[packet.MAC].packetSorter(packet);
    } else {
        activeBadges[packet.MAC] = new Combadge(packet.MAC, address, port, packet, controlServer);
    };
});

/**
 * Receive and respond to updater requests from badges. We don't have the firmware (unless OEM decides to release it separate from the CVS)
 * so just tell them to chill out. Need to find an Ack for this.
 */
updateServer.on('message', (message, clientInfo) => {
    console.log(`Received datagram from badge at ${clientInfo.address}:${clientInfo.port}`);
    console.log(message.toString('hex'));
});
