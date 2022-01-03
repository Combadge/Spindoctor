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


import dgram from 'dgram'; // The CnC Protocol is UDP-based.
//const rtp = require('./Libraries/rtp.js');
import alawmulaw from 'alawmulaw'; // mulaw is the codec.
import stt from 'stt';
import waveResampler from 'wave-resampler';
import wav  from 'wav';


const netAddress = '10.98.2.30'; // The interface to listen on.
const rtpAudioPort = 5299; // The port for the RTP audio service.


function Recognise (recSamples) {
    var wavSamples = alawmulaw.mulaw.decode(recSamples);
    writer.write(new Buffer.from(wavSamples.buffer));
    var floatSamples=Float32Array.from(Float32Array.from(wavSamples).map(x=>x/0x8000));
    var newSamples = waveResampler.resample(floatSamples, 8000, 16000); // RETURNS A FLOAT64 NOT AN INT16 READ THE DOCS
    var samples1616=Int16Array.from(newSamples.map(x => (x>0 ? x*0x7FFF : x*0x8000)));
    var wav16buffer = new Buffer.from(samples1616.buffer);
    writer.write(wav16buffer);
    console.log("Result:", model.stt(wav16buffer));
    writer.end();
    throw new Error();
}


const audioServer = dgram.createSocket('udp4');
audioServer.bind(rtpAudioPort, netAddress);
audioServer.on('listening', () => {
    const address = audioServer.address();
    console.log(`RTP server listening ${address.address}:${address.port}`);
});


const modelFile = "./model.tflite"
const scorerFile = "./huge-vocabulary.scorer"

console.error('Loading model from file %s', modelFile);
let model = new stt.Model(modelFile);
model.enableExternalScorer(scorerFile);
console.error('Loaded model.');
var timer = 0
var samples = new Buffer.from([])

var writer = new wav.FileWriter('badgeout.wav', {
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16
});

var recording = true;
audioServer.on('message', (message, clientInfo) => {
    console.log(`Received datagram from badge at ${clientInfo.address}:${clientInfo.port}`);
    var muSamples = message.subarray(12);
    samples = Buffer.concat([samples, muSamples]);

    if (timer > 250) {
        Recognise(samples);
    }
    timer += 1;
});