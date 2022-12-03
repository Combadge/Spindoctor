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


/**
 * Contact class represents a person or organisation which can be called from
 * a communicator, or which can call into the Voice Server from an external
 * location.
 * 
 * Optional attributes:
 * - interpretation: The training data for/from the implementation's Speech-To-
 *   Text Engine that allows it to recognise this contact.
 * - pronunciation: The description of the contact's name in the machine-readable
 *   format used by the text-to-speech engine selected in that implementation.
 *   The default position is to trust the TTSE, but this permits override.
 */


class Contact {
    constructor() {
        
    }
}