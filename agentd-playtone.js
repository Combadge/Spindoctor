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


const dgram = require('dgram'); // RTP is UDP-based.
const rtp = require('./Libraries/rtp.js');
const alawmulaw = require('alawmulaw'); // mulaw is the codec.
const tone = require('tonegenerator');

Object.defineProperty(Buffer.prototype, 'chunk', {
    value: function(chunkSize) {
        var that = this;
        return Array(Math.ceil(that.length/chunkSize)).fill().map(function(_,i){
            return that.slice(i*chunkSize,i*chunkSize+chunkSize);
        });
    }
});

function generateSamples (oldSamples) {
    var newSamples = Int16Array.from(tone({ freq: 1701, lengthInSecs: 0.2, volume: tone.MAX_16 }));
    if (oldSamples.length == 0) {
        outSamples = newSamples;
    } else {
        var testSamples = Array.from(oldSamples)
        var lastSilent = testSamples.map(function(sample, index) {
                var output = {};
                output.sample = sample;
                output.index = index;
                return output;
            }).filter(function(mappedSample) {
            return mappedSample.sample == 0
        }).slice(-1)[0].index;

        oldSamples = oldSamples.subarray(0, lastSilent);
        var outSamples = new Int16Array(oldSamples.length+newSamples.length);
        outSamples.set(oldSamples);
        outSamples.set(newSamples,oldSamples.length);
    };

    return outSamples;
};

const interface = '10.98.2.30'; // The interface to listen on.
const rtpAudioPort = 5299; // The port for the RTP audio service.



const audioServer = dgram.createSocket('udp4');
audioServer.bind(rtpAudioPort, interface);
audioServer.on('listening', () => {
    const address = audioServer.address();
    console.log(`RTP server listening ${address.address}:${address.port}`);
});

const rhdr = "8000";
var rtpSerial = 13;
var rtpTimeStamp = 42; // 4 bytes, this is as good a starting number as any
const ssrc = "00003827";
var samples = new Array();

audioServer.on('message', (message, clientInfo) => {
    console.log(`Received datagram from badge at ${clientInfo.address}:${clientInfo.port}`);
    //console.log(message.toString('hex'));
    var mubytes = message.subarray(12);

    if (samples.length < 2000) {
        samples = generateSamples(samples);
    };

    var pcmClip = samples.subarray(0,160);
    samples = samples.subarray(160);

    var muClip = alawmulaw.mulaw.encode(pcmClip)
    var serial = rtpSerial.toString(16).padStart(4,'0')
    var timestamp = rtpTimeStamp.toString(16).padStart(8,'0')

    var dgramConstruct = rhdr + serial + timestamp + ssrc;
    var headerBuffer = new Buffer.from(dgramConstruct, 'hex')

    var completeBuffer = Buffer.concat([headerBuffer,muClip])
    audioServer.send(completeBuffer , clientInfo.port, clientInfo.address);

    rtpSerial += 1;
    rtpTimeStamp += 160;
});
