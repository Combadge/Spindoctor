# The Spin Doctor Combadge Server #

This application is intended to be a drop-in replacement for the OEM Combadge Voice Server. It's purpose is not to supplant the commercial product in the safety-critical settings it is marketed to, but to allow individuals to reduce the speed at which these badges transition from deployment to disposal by allowing them to be re-used in an affordable and useful way.

The application is single-licenced under the Affero GPL v3.0, a copyleft licence. There is no commercial version.

## Instructions ##

- Clone to a folder
- run npm install to pull down all dependencies
- use node to run combadged.js.

## Current State ##

- If you manually configure a B2000, B3000 or B3000n badge of the right firmware version using the on-device configuration menu, and run this software on a server connected to the right IP with the right ssid and password... you can probably get some really bad speech recognition output. Pretty good for a hobby project!
- The controller code will handle the existence of multiple badges, and will transcribe each stream fully independently. So far, the transcription is terrible and nothing is done with it - but it is technically functional.
- There is a rudimentary self-describing API at port 1031. You can send the json `{"userName":"u-jdax","prettyName":"Jadzia Dax"}` or similar to the `/badge/:macaddress/user` endpoint on the api to change user on a badge. Sending an empty body (as in, `{}`) to the same endpoint will log out the badge. As an example: `curl -H "Content-Type: application/json" -d '{"userName":"u-wsomogh","prettyName":"Worf, Son of Mogh"}'  http://servername:1031/badges/0009efabcdef/user`
- The API also allows you to make badge to badge calls, currently only between pairs of badges (multicast grouping is not supported). As an example `curl -H "Content-Type: application/json" -d '{"targetMAC":"0009effedcba"}' http://servername:1031/badges/0009efabcdef/callTarget`. The code is *very* oversimplified, and the API is likely to change in short order.
- Should work on Node 12, 14, 16? I've not been too brave. Doesn't work on node 18 due to STT issues.
- Now requires AVX! THANKS, tflite. You'll run on a Pi 02, but not a brand new Atom or a Westmere Xeon... P.S. You can manually compile tflite, but blegh.

Since v0.0.5, the agent code has been merged into combadged - so all you should need to do is npm install, download the huge model and scorer from Coqui and launch that script. It ignores you while transcribing to avoid spooling up a bunch of parallel STT instances on slow hardware. Once we have VAD in place we may be able to get rid of that restriction. The old agent files can no longer be used unless you modify combadged to not start audio ports. However, they have been kept around for use as references.

## Immediate To-Do-List ##

- Continuous inferencing with silence detection. (VAD)
- TTS and beeps for responding to badge.
- User concept and ability to log in and log out a badge.
- Hook some kind of NLP into the agent, to be able to recognise basic log in/out.
- Convince someone to send me a free network-controllable bean-to-cup coffee machine so I can hook into its protocol.

## Intended feature set ##

- Complete implementation of the command-and-control protocol for badge firmware 4.1.0.55
   - Prioritised: association with the server, log in of a user, and calling/messaging features.
   - As needed: Remote shut down, log transfer, 
   - Deprioritised: Software update - badge firmware is only distributed with the OEM Voice Server. Anyone using Spin Doctor does not have access to this firmware.
- A threaded RTP server for handling connections between the badge and the Voice Agent.
- An open-source Voice Agent that offers calling and identity management functions.
   - Follow the design patterns used in Star Trek for utterances and responses - particularly TNG, DS9, Voy. (TOS: Too simple. DIS: Way too "natural" to be successfully replicated by this project.)
   - Low priority: Additionally support simple home automation including physical access, lighting and music control.
   - Critical: Must support voice operation of at least one model of networked bean-to-cup coffee maker. See details below.
- A voice gateway allowing the badge to integrate with external applications. Either SIP or Jingle, depending on what best fits the presencing and metadata needs of the application.
- A comprehensive contact management system for the Voice Server, that can handle both internal and external recipients.
   - Handle alternate numbers for contacts: "Rachel to John." «John is not logged in. Calling John, Cellphone.»
   - Handle user-contextual contacts: "John to Pharmacy." «Calling Lloyds Pharmacy, Penrith.» "Rachel to Pharmacy." «Calling J.Cowper Chemists, Penrith.»
- A method to transfer to or accept calls on a different device, e.g. a video conferencing terminal. "Onscreen."

Supplementary concept:

It is hoped that someone with an interest in such things might use the Spin Doctor Voice Server to implement a foldable handheld replacement for the OEM badge. If you make an open source hardware and firmware to build a voice-server compatible "gold flip-phone", we'll be very open to bringing it on board this project as an alternative hardware to the badge. Just throwing that out there.

## Things we're not implementing ##

- "Code Lavender". This is not meant to be used somewhere important where meaningful conversations need be had. It's a toy project for nerds to play with disposed combadges.
- "Funny Genie". I'd rather hook in to productive things than make transporter sounds.
- "Firmware update". Currently the OEM only distributes the badge firmware with the proprietary server software, so there's no legal way for a Spindoctor user to obtain it. So, we're not even going to support it. What firmware you have, is the firmware you work with. If the OEM starts publishing firmware updates online, we will revisit this - but that seems unlikely.

## Coffee Sponsorship ##

If you are a company making networked coffee makers and like the idea of the "Coffee - Black." command being implemented for your device? Get in touch. If you're prepared to give a coffee machine (or a couple, if this project takes off with many developers) and a little documentation that might help us write in support for your machine? We're interested.

### Conditions ###

- Local control only, although we'd accept an internet based initial set-up of the machine (activate local mode or generate access token) as long as it can run "off-grid" persistently after. We're not interested in supporting the OEM-server-dependent model of IoT, since reducing e-waste is literally the sole purpose of this project. Plus, I want to be able to install this in a spacecraft one day and there is no access to your cloud at 40 Eridani A.
- We're not interested in adding black boxes or binary blobs to this project. All code necessary must be open.
- Any machine(s) we do get satisfactory manafacturer-support for adding to the project will be encouragingly supported in documentation.
   - We're prepared to negotiate more prominent sponsor-status, but only if your machine supports never-online functioning including setup. Also, if your machine can additionally make "Tea, Earl Grey - Hot" and dispense water at multiple temperatures on demand - we're prepared to be **very** negotiable.
   - If it's wall-installable, I will find a way to get a transit van and build a runabout. Full "cosplay" interior, your generously donated "replicator", on board computer, everything. And show it off at a con.
   - If your machine can make breakfast burritos with multiple optional types of salsa, you're just showing off. But please still send us one.
   - See also: Hot, Plain, Tomato Soup.