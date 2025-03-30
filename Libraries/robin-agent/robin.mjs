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

const modelFile = "./model.tflite";
const scorerFile = "./huge-vocabulary.scorer";

const vadTimeOut = 300;
const vadAggressiveness = vad.Mode.VERY_AGGRESSIVE;
const vadInstance = new vad(vadAggressiveness);

console.error('Loading model from file %s', modelFile);
var model = new stt.Model(modelFile);
model.enableExternalScorer(scorerFile);
console.error('Loaded model.');

/**
 * Agent provides an instance of an automated responder to take voice commands and send commands back to badges for action
 * 
 * The API for this and ecma-rtp should be made more-or-less independent, so you can feed this any source of numbers and it should work - from file, ecma-rtp, or something else.
 * We should also (for now) hard code a specific codec and profile, and transcode in the RTP library.
 */
class Agent {
    constructor (callback = undefined, audioResponder = undefined) {
        this.samples = [];
        this.recSamples = [];
        this.transcoding = false;
        this._callback = callback;
        this._audioResponder = audioResponder;
    }

    recogniseBatch () {
        console.log("Result:", model.stt(new Buffer.from(this.recSamples)));
        //this.transcoding = false;
    }

    receiveSamples (samples) {
        this.samples.push(...samples);
        if (this.samples.length > 100000) {
            this.recSamples = this.samples;
            this.samples = [];
            this.recogniseBatch();
        }
        return true;
    }

    set callback (callback = undefined) {
        // Future task - verify that callback is either undefined or a function here.
        this._callback = callback;
    }

    get callback () {
        return this._callback;
    }

    /**
     * Expects a function(Buffer) to pass back audio to, which will be transcoded
     * and encapsulated as an RTP packet before sending to the client.
     */
    set audioResponder (audioResponder = undefined) {
        this._audioResponder = audioResponder;
    }

    get audioResponder () {
        return this._audioResponder;
    }
}

export { Agent };
