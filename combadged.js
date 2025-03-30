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
import { CombadgePacket, Combadge } from './Libraries/ecma-cccp/index.mjs';
import { Agent } from './Libraries/robin-agent/index.mjs';
import { RTPServer } from './Libraries/ecma-rtp/index.mjs';
import express from 'express';


const netAddress = '10.98.2.30';
const apiPort = 1031; // Canonically the earliest appearance of combadges is Disco, so - NCC (port) 1031.
const updatePort = 5555;
const controlPort = 5002;
const rtpPortRangeStart = 5300; // Start here, go up.
const rtpPoolInit = 10; // Init this many agent threads to start.
const rtpPortRangeEnd = 5400 // Absolute cap of rtp, 


class AgentManager {
    constructor () {
        //set_up_the_agents;
        this._FreeAgents = {};
        this._AssignedAgents = {};
    }

    createAgent (rtpPortNumber) {
        var agent = new Agent();
        var rtpServer = new RTPServer(netAddress, rtpPortNumber, agent.recieveSamples);
        rtpServer.consumer = agent;
        rtpServer.registerRemote("address/port object goes here")
        agent.audioResponder = rtpServer.queueAudio;
        this._FreeAgents[rtpPortNumber] = agent;
    }

    getSpecificAgent (agentPort) {
        return this._FreeAgents.concat(this._AssignedAgents)[agentPort]
    }

    getAgent (callback) {
        if (this._FreeAgents.length == 0) {
            var maxKey = Math.max(...Object.keys(this._AssignedAgents));
            if (maxKey >= rtpPortRangeEnd) {
                throw "Reached maximum number of simultaneous Agents";
            } else {
                this.createAgent(maxKey++);
            }
        }

        var firstAgent = Object.keys(this._FreeAgents)[0];
        this._AssignedAgents[firstAgent] = this._FreeAgents[firstAgent];
        this._AssignedAgents[firstAgent].callback = callback;
        delete this._FreeAgents[firstAgent];
        return firstAgent;
    }

    freeAgent (agentPort) {
        this._FreeAgents[agentPort] = this._AssignedAgents[agentPort];
        this._FreeAgents[agentPort] = undefined;
        delete this._AssignedAgents[agentPort];
        return true;
    }

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

for (let rtpPort = rtpPortRangeStart; rtpPort < (rtpPortRangeStart + rtpPoolInit); rtpPort += 2) {
    console.log(`Spawning agent at port ${rtpPort}`)
    Manager.createAgent(rtpPort);
}

/**
 * Handle the command and control protocol. Detect new badges to create Objects for
 * and pass traffic to existing badges based on MAC address.
 */
controlServer.on('message', (message, clientInfo) => {  
    var address = clientInfo.address; var port = clientInfo.port;
    var packet = CombadgePacket.from(message)
    // console.log(message.toString('hex')); - Useful debug step - uncomment to dump the hex stream of incoming packets to console.
    if (packet == undefined) {
        console.log(`Received datagram from badge at ${address}:${port}. Ignoring faulty or incompatible packet.`);
        return false;
    }
    if (packet.MAC in activeBadges) {
        activeBadges[packet.MAC].packetSorter(packet);
    } else {
        activeBadges[packet.MAC] = new Combadge(packet.MAC, address, port, packet, controlServer);
        activeBadges[packet.MAC].agentPort = Manager.getAgent(activeBadges[packet.MAC].externalCallback);
    }
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
app.use(express.json());

app.get('/', (request, responder) => {
    return responder.send(["badges"]);
});

app.get('/badges', (request, responder) => {
    return responder.send(Object.keys(activeBadges));
});

app.get('/badges/:badgeMAC', (request, responder) => {
    return responder.send(activeBadges[request.params.badgeMAC]);
});

app.post('/badges/:badgeMAC/callTarget', (request, responder) => {
    if (!(request.params.badgeMAC in activeBadges)) {
        responder.status(404);
        return responder.send(`Badge ${request.params.badgeMAC} is not registered on the server.`);
    }
    if (!("targetMAC" in request.body)) {
        responder.status(400);
        return responder.send("Request body must be either empty or contain string values userName and prettyName.");
    } else if (!(request.body["targetMAC"] in activeBadges)) {
        responder.status(404);
        return responder.send(`Badge ${request.body["targetMAC"]} is not registered on the server.`);
    } else {
        var initiator = activeBadges[request.params.badgeMAC];
        var target = activeBadges[request.body["targetMAC"]];
        initiator.callRTP(target.IP, 5200);
        target.callRTP(initiator.IP, 5200);
    }

    return responder.send([true]);
});

app.post('/badges/:badgeMAC/user', (request, responder) => {
    if (!(request.params.badgeMAC in activeBadges)) {
        responder.status(404);
        return responder.send(`Badge ${request.params.badgeMAC} is not registered on the server.`);
    }
    if (!Object.keys(request.body).length) {
        return responder.send(activeBadges[request.params.badgeMAC].externalCallback("logout"));
    } else if (("userName" in request.body) && ("prettyName" in request.body)) {
        return responder.send(activeBadges[request.params.badgeMAC].externalCallback("login", request.body));
    } else {
        responder.status(400);
        return responder.send("Request body must be either empty or contain string values userName and prettyName.");
    }
});

app.listen(apiPort, () =>
    console.log(`Combadge control REST API now active on TCP port ${apiPort}!`),
);
