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


const dgram = require('dgram'); // RTP is UDP-based.
const rtp = require('./Libraries/rtp.js');
const alawmulaw = require('alawmulaw'); // mulaw is the codec.
const stt = require('stt');
const waveResampler = require('wave-resampler');
const wav = require('wav');

Object.defineProperty(Buffer.prototype, 'chunk', {
    value: function(chunkSize) {
        var that = this;
        return Array(Math.ceil(that.length/chunkSize)).fill().map(function(_,i){
            return that.slice(i*chunkSize,i*chunkSize+chunkSize);
        });
    }
});

const interface = '10.98.2.30'; // The interface to listen on.
const rtpAudioPort = 5299; // The port for the RTP audio service.

const audioServer = dgram.createSocket('udp4');
audioServer.bind(rtpAudioPort, interface);
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
console.log(model.sampleRate());

function Recognise (recSamples) {
    console.log(recSamples.length);
    var wavSamples = alawmulaw.mulaw.decode(recSamples);
    writer.write(new Buffer.from(wavSamples.buffer));
    floatSamples=Float32Array.from(Float32Array.from(wavSamples).map(x=>x/0x8000));
    var newSamples = waveResampler.resample(floatSamples, 8000, 16000); // RETURNS A FLOAT64 NOT AN INT16 READ THE DOCS
    samples1616=Int16Array.from(newSamples.map(x => (x>0 ? x*0x7FFF : x*0x8000)));
    var wav16buffer = new Buffer.from(samples1616.buffer);
    writer.write(wav16buffer);
    console.log(newSamples.length);
    console.log("Result:", model.stt(wav16buffer));
    writer.end();
    throw new Error();
}

timer = 0
samples = new Buffer.from([])

var writer = new wav.FileWriter('badgeout.wav', {
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16
});

recording = true;
audioServer.on('message', (message, clientInfo) => {
    console.log(`Received datagram from badge at ${clientInfo.address}:${clientInfo.port}`);
    var muSamples = message.subarray(12);
    samples = Buffer.concat([samples, muSamples]);

    if (timer > 250) {
        Recognise(samples);
    }
    timer += 1;
});