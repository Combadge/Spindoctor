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

/**
 * tone({
  freq: Tones["E♭6"],
  lengthInSecs: 0.2,
  volume: tone.MAX_16/2,
  rate: 16000,
  shape: 'sine'
})
 */


import { Tones, FixedPitch, Silence} from '@combadge/ecma-tonegenerator'


/**
 * Superclass for all nonverbal sound generators. By default, we should generate audio in the same codec and profile as Robin uses internally.
 * 
 * 
 */
class Sound {
    constructor (notes) {
        this.tones = notes.map(function (note) {
            var tone = new FixedPitch({frequency:Tones[note],
                            bitDepth: 16,
                            sampleRate: 16000});
            var silence = new Silence({bitDepth: 16,
                                       sampleRate: 16000});
            
            return [tone.approximate({duration:500}), silence.accurate({duration:500})];
        });

    }
}

/**
 * Click, B5, Click, B5, Click, D6
 */
class ListeningChirp extends Sound {
    constructor () {
        notes = ["B5", "B5", "D6"];
        super(notes);
    }

    get output () {
        output = [];
        this.tones.forEach(function (tone) {
            tone.forEach(function (sample) {
                output.push(sample);
            })
        });
        return new Int16Array(output);
    }
}

/**
 * 
 */
class OfflineChirp extends Sound {
    constructor () {
        notes = ["B5", "B5"];
        super(notes);
    }
}

/**
 * B5, D6, B5
 */
class BoatswainCall extends Sound {
    constructor () {
        notes = ["B5", "D6", "B5"];
        super(notes);
    }
}

export { ListeningChirp, OfflineChirp, BotswainWhistle };