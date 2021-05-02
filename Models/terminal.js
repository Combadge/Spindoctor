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


/**
 * Terminal class describes a physical or virtual display terminal which can
 * send and receive AV. An example of this would be a camera-equipped TV which
 * can be used to receive a call with video, or an application on a multi-
 * purpose computer which can perform the same function. This allows the
 * implementation of "Comm Panel", "Desk Terminal" and "Viewscreen" concepts.
 * 
 * The device-side implementation of this should be computationally thin.
 * 
 * Terminals can be public or private, allowing ad-hoc usage in a shared space
 * (living room, conference room, hallway) or exclusive use in a private room.
 * 
 * Whitelist and Blacklist support is probably sensible.
 * 
 * Location-based activation should also be explored, so E.G. a terminal in a
 * private space will be defaulted to if the user's communicator is connected
 * to the AP in that space.
 */
 class Terminal {
    constructor(MAC, IP) {
    this.IP = IP;
    this.MAC = MAC;
    };
};