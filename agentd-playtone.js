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
const fs = require('fs');

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
const testAudioFile = "./SAMPLEAUDIO.pcm";

const audioServer = dgram.createSocket('udp4');
audioServer.bind(rtpAudioPort, interface);
audioServer.on('listening', () => {
    const address = audioServer.address();
    console.log(`RTP server listening ${address.address}:${address.port}`);
});

rawAudio = fs.readFileSync(testAudioFile, null);
console.log(rawAudio.length)

const rhdr = "8000"
var rtpSerial = 13;
var rtpTimeStamp = 42; // 4 bytes, this is as good a starting number as any
const ssrc = "00003827"

var srcStart = 0;
var srcEnd = 320;

audioServer.on('message', (message, clientInfo) => {
    //console.log(`Received datagram from badge at ${clientInfo.address}:${clientInfo.port}`);
    console.log(message.toString('hex'));

 /*   clip = rawAudio.subarray(srcStart,srcEnd).chunk(2);
    //var clipbytes = clip.map(function(e) {
    //    e = parseInt(e.toString('hex').match(/../g).reverse().join(''),16);
    //    return e;
    //});

    var clipbytes = clip.map(function(e) {
        e = parseInt(e.toString('hex'),16);
        return e;
    });

    //console.log(clipbytes);
    muclip = alawmulaw.mulaw.encode(clipbytes);
    srcStart += 320;
    srcEnd += 320;
*/


    var mubytes = message.subarray(12);
    var wavbytes = alawmulaw.mulaw.decode(mubytes);
    var mu2bytes = alawmulaw.mulaw.encode(wavbytes)
    var serial = rtpSerial.toString(16).padStart(4,'0')
    var timestamp = rtpTimeStamp.toString(16).padStart(8,'0')

    var dgramConstruct = rhdr + serial + timestamp + ssrc;
    var headerBuffer = new Buffer.from(dgramConstruct, 'hex')

    var completeBuffer = Buffer.concat([headerBuffer,mu2bytes])
    audioServer.send(completeBuffer , clientInfo.port, clientInfo.address);

    rtpSerial += 1;
    rtpTimeStamp += 160;
});



/*
audioInput


while sampleBuffer.length > 160:
    packetBuffer = [];
    for i in 1 to 160:
        packetbuffer.append(sampleBuffer.pop())
    sendToBadge(packetBuffer)
*/

// Need to send a packet every 20ms, with 160 8-bit µlaw samples,
// for 8000 samples a second, so 8 bit 8000kHz.
// alawmulaw converts between pcm 16 bit linear signed and 8 bit unsigned µ/alaw samples
// TL;DR we need to manage any sample rate conversion ourselves or with a different
// library. And we can either forward audio in native µlaw or transcode to another format
// via 16 bit signed pcm

// 80802e2500005a1300003827ffffffffffffffffff7e7e7d7e7d7d7c7c7c7c7d7e7d7d7d7e7ffefdfcfbfbfaf9f9f9f9f8f9f9fafafaf9fafafafbfcfcfdfcfdfcfcf9fafb7e7a7a7f7c78757c7dfe7e7c7cf7ecd8cdec5256e3d57d525aebde6f5861e7e57265dbd07a5de8d1de534ff3d5f15454f6d9e7eceb7de7d5df615978e2f75e5b68716669ede476fcc1b9cd4b48f9ccec4746edcae35dc3aebc3d2f49c8ed3838f8bbbee3ddc9c9
// 80800001000000a06b8b4567fbf5f2fa7b7675756d6662f8dbd2d8ff6c69696b6d6e6f727274767678787a7a7a7a7c7c7c7c7c7c7d7d7d7c7c7c7c7d7d7d7d7d79737373757778797a7a7a7c7c7c7dfffdf5e8e2e4e5e6e8e9eaeaebebececececedecececececebebebebeaeaeae9e9e8e8e7e7e6e6e5e5e5e4e3e2e2e0e0e0dfdfdededddddcdcdbdadad9d9d9d8d7d6d5d5d5d7dbdee3e8eceff5fbfc7e76706c6a6867656562615f5e5d
// 80802e2500005a1300003827 -- header
// cbelow seq  timestmp ssrc id
// 80 80  2e25 00005a13 00003827
// 80 80  0001 000000a0 6b8b4567 - seq from badge is much simpler...

// v2 nopad noext nocsrc marker 8µl8000
// 10 0     0     0000   1      0000000

// everything after is just 160 µlaw bytes back to back


//outputSignedSamples = {sample1, etc, sample160}
//outputConvertedSamples = alawmulaw.mulaw.encode(inputSignedSamples)
//outputHeader = "8080" + sequence + timestamp + ssrcident
//audioOutputPacketBuffer = makeadgramhere
