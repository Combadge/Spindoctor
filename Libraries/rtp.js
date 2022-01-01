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

const Payload = {
    Mulaw8K: 0,
    Alaw8K: 8,
    G7228K: 9,
    G7298K: 18
}
/**
 * This is a specific hardcoded header for Spin Doctor audio. It's not meant to be general purpose.
 */
class RTPHeader {
    constructor(chunkSize) {
        this.sampleCount = chunkSize;
        // Byte 1
        this.version = new Number(2); // 2 bits
        this.padding = new Boolean(false);
        this.extension = new Boolean(false);
        this.csrcCount = Payload.Mulaw8K; // 4 bits

        // Byte 2
        this.marker = new Boolean(false);
        this.payloadType = new Number(0); // 7 bits

        // Bytes 3-4
        this.sequenceNo = Math.floor(Math.random() * (65534/2))

        // Bytes 5-8
        this.timeStamp = Math.floor(Math.random() * (2147483647/4))

        // Bytes 9-12
        this.ssrc = new Number(14375); // The default SSRC used by the OEM agent

        // Bytes 13+
        this.csrcs = new Array(); // Not currently in use, but might as well have it.
        this.extension = null; // See above.
    };

    /**
     * Get the current header value. Return as hex bytes so it can be prepended to a hex or buffer audio stream easily.
     */
    getHeader() {
        var fallBackHeader = "8000";
        var sequence = this.sequenceNo.serial.toString(16).padStart(4, '0');
        var timestamp = this.timeStamp.serial.toString(16).padStart(8, '0');
        var ssrc = this.ssrc.serial.toString(16).padStart(8, '0');

        return `${fallBackHeader}${sequence}${timestamp}${ssrc}`;
    };

    /**
     * Update header with latest sequence and timestamp
     */
    updateHeader() {
        this.sequenceNo += 1;
        this.timeStamp += this.sampleCount;
    };

    /**
     * Decode an arbitrary header passed in.
     */
    decode(bytes) {
        return null; // return new Header with the decoded values.
    }
};

/**
 * Temporary class - replace with RTPPacket instances when you work out how.
 */
class RTPStream {
    constructor() {
        this.sampleCount = new Number(160); // At 8 bits/sample, this can be used for both incrementing the timestamp AND counting bytes.
        this.header = new RTPHeader(this.sampleCount);
    }


    /**
     * Return a completed media packet without transcoding.
     */
    sendCopy(bytes) {
        var headerConstruct = this.header.getHeader();
        var headerBuffer = new Buffer.from(headerConstruct, 'hex');
        var completeBuffer = Buffer.concat([headerBuffer, bytes]);
        this.header.updateHeader();
        return completeBuffer;
    }

    /**
     * Return a decoded media array without transcoding.
     */
    receiveCopy(bytes) {
        var headerSection = bytes.subarray(0,12)
        var mediaSection = bytes.subarray(headerLength)

        headerValues = this.header.decode(headerSection);

        return mediaSection;
    }
}

/**
 * Again - values specifically hardcoded for Spin Doctor.
 */
 class RTPPacket {
    constructor(header, bytes) {
        this.header = header;
        while (bytes.length < this.header.sampleCount) {
            // pad to length with null values.
        }
        this.media = bytes;
    }

    /**
     * Transcode media to desired codec. Will presumably also need to handle
     * sample rate conversion? Don't think we can alter interval sizes here.
     * 
     * - Need to define codecs/profiles in some sensible way in this library.
     * - Need to update the header after transcoding?
     */
    transcode(codec) {

    }

    /**
     * Return the packet, ready to send.
     */
    
}

class MediaQueue {
    constructor() {
        this.inQueue = new Array();
        this.outQueue = new Array();
    }

    /**
     * Add a packet to the queue for RTP decoding
     */
    addReceivedPacket (packet, callback) {
        return null;
    }

    /**
     * Add a media stream for RTP encoding
     */
    addTransmitMedia (samples, callback) {
        return null;
    }
}