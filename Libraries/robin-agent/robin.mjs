/**
 * Robin-agent - an interactive voice agent for Spin Doctor
 * Copyright (C) 2021-2022 The Combadge Project by mo-g
 *
 * Robin-agent is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * Robin-agent is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Robin-agent.  If not, see <https://www.gnu.org/licenses/>.
 */


import stt from 'stt';
import vad from 'node-vad';
import waveResampler from 'wave-resampler';

const modelFile = "./model.tflite"
const scorerFile = "./huge-vocabulary.scorer"

const vadTimeOut = 300;
const vadAggressiveness = vad.Mode.VERY_AGGRESSIVE


const vadInstance = new vad(vadAggressiveness);


console.error('Loading model from file %s', modelFile);
var model = new stt.Model(modelFile);
model.enableExternalScorer(scorerFile);
console.error('Loaded model.');


/**
 * Agent provides an instance of an automated responder to take voice commands and send commands back to badges for action
 * 
 * Currently stubbed.
 */
class Agent {
    constructor (callback = undefined) {
        this.samples = []
        this.recSamples = []
        this.transcoding = false;
        this._callback = callback;
    };

    recogniseBatch () {
        console.log("Transcoding, please wait.")
        this.transcoding = true;
        var floatSamples=Float32Array.from(Float32Array.from(this.recSamples).map(x=>x/0x8000));
        var newSamples = waveResampler.resample(floatSamples, 8000, 16000); // RETURNS A FLOAT64 NOT AN INT16 READ THE DOCS
        var samples1616=Int16Array.from(newSamples.map(x => (x>0 ? x*0x7FFF : x*0x8000)));
        var wav16buffer = new Buffer.from(samples1616.buffer);
        console.log("Result:", model.stt(wav16buffer));
        this.transcoding = false;
    };

    receiveSamples (samples) {
        if (this.transcoding == false) {
            this.samples.push(...samples);
        }
        if (this.samples.length > 50000) {
            this.recSamples = this.samples;
            this.samples = [];
            this.recogniseBatch();
        }
        return true;
    };

    set callback (callback = undefined) {
        // Future task - verify that callback is either undefined or a function here.
        this._callback = callback;
    }

    get callback () {
        return this._callback;
    }
};

export { Agent };