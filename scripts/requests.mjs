import { MODULE_ID, SOCKET } from "./constants.mjs";

export function requestOwnershipChange({ action, targetUuid, userId, level }) {
	game.socket.emit(`module.${MODULE_ID}`, {
		event: SOCKET.EVENT,
		action,
		targetUuid,
		userId,
		level,
	});
}

export function requestHackStart({ targetUserId, targetUuid, actorName }) {
	game.socket.emit(`module.${MODULE_ID}`, {
		event: SOCKET.EVENT,
		action: "start",
		targetUserId,
		targetUuid,
		actorName,
	});
}

export function requestHackStartWithConfig({ targetUserId, targetUuid, actorName, config }) {
	game.socket.emit(`module.${MODULE_ID}`, {
		event: SOCKET.EVENT,
		action: "start",
		targetUserId,
		targetUuid,
		actorName,
		config,
	});
}
