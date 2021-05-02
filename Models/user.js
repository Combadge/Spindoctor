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
 * User class describes a person who signs in to a Communicator. A User will
 * have the following mandatory attributes:
 * - username: a unique identifier. This will link a User object to it's source
 *   in the database, and will be derived from and associated to any directory.
 * - name: The user's human-readable name as they or the directory records.
 * 
 * Additionally, a User may have the following optional attributes:
 * - presence: A representation of the presence state of the user. This could
 *   be offline, available, DND, in-call.
 * - permittedContacts: A machine readable reference to the contacts permitted
 *   to contact this user. i.e. in SME, allow your secretary to contact the CEO
 *   but not the chaiwala. Should probably handle state-dependent logic - i.e.
 *   allow your partner to contact you in DND mode, but not your mother-in-law.
 * - personalContacts: A store of the contacts that relate specifically to you.
 *   E.G. Your pharmacy, your work. This allows shorthands that wouldn't make
 *   sense when used by other people.
 */
class User {
    constructor() {
    };
};