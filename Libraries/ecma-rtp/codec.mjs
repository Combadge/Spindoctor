/**
 * ecma-rtp, an RTP Library for Spin Doctor
 * Copyright (C) 2021-2022 The Combadge Project by mo-g
 * 
 * ecma-rtp is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * 
 * ecma-rtp is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with ecma-rtp.  If not, see <https://www.gnu.org/licenses/>.
 */


import alawmulaw from 'alawmulaw';
import waveResampler from 'wave-resampler';

/**
 * Superclass to represent an audio Codec.
 */
class Codec {
    constructor ({clientRate = 16000,
                  clientDepth = 16,
                  serverRate = 8000,
                  serverDepth = 8} = {}) {
        
        this.clientRate = clientRate;
        this.clientDepth = clientDepth;
        this.serverRate = serverRate;
        this.serverDepth = serverDepth;

        this.samples = []
    }

    transcode () {

    }

        /**
     * We need to do some testing to see how resampling options affect STT because
     * 
     * Cubic without Low Pass Filter:
     * generate: 0.283ms
     * transcode: 0.144ms
     * resample: 0.442ms
     * 
     * Cubic with LPF:
     * generate: 0.375ms
     * transcode: 0.123ms
     * resample: 6.605ms
     * 
     * That's on 20ms audio on an i5 9500. Interestingly it scales x2 per x10 duration,
     * so it's not terrible - but if we can shave time off, so much the better
     * 
     * First test - LPF Off doesn't seem to hurt anything!
     */
    static resampleAudio (samples) {
        var wavSamples = alawmulaw.mulaw.decode(samples);
        var floatSamples=Float32Array.from(Float32Array.from(wavSamples).map(x=>x/0x8000));
        var newSamples = waveResampler.resample(floatSamples, 8000, 16000, {method: "cubic", LPF: false}); // RETURNS A FLOAT64 NOT AN INT16 READ THE DOCS
        var samples1616=Int16Array.from(newSamples.map(x => (x>0 ? x*0x7FFF : x*0x8000)));
        return Buffer.from(samples1616.buffer);
    }

    set samples (samples) {
        this.samples.push(this.transcode(samples));
    }

    get samples () {
        return this.samples.pop;
    }
}

/**
 * Represents mulaw (as used by Combadges)
 */
class muLaw8K extends Codec {
    constructor ({} = {}) {
        super({clientRate: 8000,
            clientDepth: 16,
            serverRate: 16000,
            serverDepth: 8});
    }

    decode (samples, callback) {
        wavSamples = samples;
        //var wavSamples = alawmulaw.mulaw.decode(samples);
        var reSamples = Codec.resample(wavSamples);
        callback(reSamples);
    }
}

export { Codec }
