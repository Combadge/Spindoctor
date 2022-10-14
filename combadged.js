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
import { Agent } from './Libraries/robin-agent/index.mjs';
import { RTPHeader, RTPPacket } from './Libraries/rtp-protocol/index.mjs';
import express from 'express';
import bodyparser from 'body-parser';


const netAddress = '10.98.2.30';
const apiPort = 1031; // Canonically the earliest appearance of combadges is Disco, so - NCC (port) 1031.
const updatePort = 5555;
const controlPort = 5002;
const rtpPortRangeStart = 5300; // Start here, go up.
const rtpPoolInit = 5; // Init this many agent threads to start.
const rtpPortRangeEnd = 5400 // Absolute cap of rtp, 


class AgentManager {
    constructor () {
        //set_up_the_agents;
        this._FreeAgents = {};
        this._AssignedAgents = {};
    };

    createAgent (rtpPortNumber) {
        var agent = new Agent;
        this._FreeAgents[rtpPortNumber] = agent;
        var rtpPort;
        rtpPort = dgram.createSocket('udp4');
        rtpPort.bind(rtpPortNumber, netAddress)
        rtpPort.on('listening', () => {
            const address = rtpPort.address();
            console.log(`Agent worker spawned at ${address.address}:${address.port}`);
        });
        rtpPort.on('message', (message, clientInfo) => {  
            var rtpPacket = RTPPacket.from(message);
            agent.receiveSamples(rtpPacket.payload);
        });
    };

    getSpecificAgent (agentPort) {
        return this._FreeAgents.concat(this._AssignedAgents)[agentPort]
    };

    getAgent (callback) {
        if (this._FreeAgents.length == 0) {
            var maxKey = Math.max(...Object.keys(this._AssignedAgents));
            if (maxKey >= rtpPortRangeEnd) {
                throw "Reached maximum number of simultaneous Agents";
            } else {
                this.createAgent(maxKey++);
            };
        };

        var firstAgent = Object.keys(this._FreeAgents)[0];
        this._AssignedAgents[firstAgent] = this._FreeAgents[firstAgent];
        this._AssignedAgents[firstAgent].callback = callback;
        delete this._FreeAgents[firstAgent];
        return firstAgent;
    };

    freeAgent (agentPort) {
        this._FreeAgents[agentPort] = this._AssignedAgents[agentPort];
        this._FreeAgents[agentPort] = undefined;
        delete this._AssignedAgents[agentPort];
        return true;
    };

}


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

var activeBadges = {};
const Manager = new AgentManager;

// Populate Manager with agents.

for (let rtpPort = rtpPortRangeStart; rtpPort < (rtpPortRangeStart + rtpPoolInit); rtpPort++) {
    console.log(`Spawning agent at port ${rtpPort}`)
    Manager.createAgent(rtpPort);
};   

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
        activeBadges[packet.MAC].agentPort = Manager.getAgent(activeBadges[packet.MAC].externalCallback);
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

var app = new express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.get('/', (request, responder) => {
    return responder.send(["badges"]);
});

app.get('/badges', (request, responder) => {
    return responder.send(Object.keys(activeBadges));
});

app.get('/badges/:badgeMAC', (request, responder) => {
    return responder.send(activeBadges[request.params.badgeMAC]);
});

app.post('/badges/:badgeMAC/user', (request, responder) => {
    return responder.send(activeBadges[request.params.badgeMAC].externalCallback("login", request.body));
});

app.listen(apiPort, () =>
    console.log(`Combadge control REST API now active on TCP port ${apiPort}!`),
);
