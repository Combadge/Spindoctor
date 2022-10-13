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


import dgram from 'dgram'; // The CnC Protocol is UDP-based.
//const rtp = require('./Libraries/rtp.js');
import alawmulaw from 'alawmulaw'; // mulaw is the codec.
import wav  from 'wav';


const netAddress = '10.98.2.30'; // The interface to listen on.
const rtpAudioPort = 5299; // The port for the RTP audio service.


Object.defineProperty(Buffer.prototype, 'chunk', {
    value: function(chunkSize) {
        var that = this;
        return Array(Math.ceil(that.length/chunkSize)).fill().map(function(_,i){
            return that.slice(i*chunkSize,i*chunkSize+chunkSize);
        });
    }
});


const audioServer = dgram.createSocket('udp4');
audioServer.bind(rtpAudioPort, netAddress);
audioServer.on('listening', () => {
    const address = audioServer.address();
    console.log(`RTP server listening ${address.address}:${address.port}`);
});

var timer = 0;
var recording = true;

var writer = new wav.FileWriter('badgeout.wav', {
        sampleRate: 8000,
        channels: 1,
        bitDepth: 16
    });

audioServer.on('message', (message, clientInfo) => {
    console.log(`Received datagram from badge at ${clientInfo.address}:${clientInfo.port}`);

    var muSamples = message.subarray(12);
    var wavSamples = alawmulaw.mulaw.decode(muSamples);

    console.log("writing: ", wavSamples.length);
    console.log(wavSamples.buffer);
    writer.write(new Buffer.from(wavSamples.buffer));

    if (timer > 250) {
        writer.end();
        throw new Error("Finished writing.")
    }

    timer += 1;
});