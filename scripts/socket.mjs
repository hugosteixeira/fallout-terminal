import { MODULE_ID, SOCKET } from "./constants.mjs";

function isPrimaryGM() {
	const activeGMs = game.users?.filter(u => u.active && u.isGM) ?? [];
	if (activeGMs.length === 0) return false;
	return activeGMs[0].id === game.user.id;
}

async function resolveUuid(uuid) {
	try {
		return await fromUuid(uuid);
	}
	catch {
		return null;
	}
}

export function registerSocketHandlers() {
	game.socket.on(`module.${MODULE_ID}`, async payload => {
		if (!payload || payload?.event !== SOCKET.EVENT) return;

		const { action } = payload;
		if (!action) return;

		// GM -> Player: start a hacking session on the target user's client.
		if (action === "start") {
			const { targetUserId, targetUuid, actorName, config } = payload;
			if (!targetUserId || !targetUuid) return;
			if (game.user.id !== targetUserId) return;

			const mod = await import("./TerminalHackingApp.mjs");
			new mod.TerminalHackingApp({
				actorName: actorName ?? "Terminal",
				targetUuid,
				config,
			}).render(true);
			return;
		}

		// Player -> GM: update ownership (unlock/lock).
		if (!game.user.isGM) return;
		if (!isPrimaryGM()) return;

		const { targetUuid, userId, level } = payload;
		if (!targetUuid || !userId || typeof level !== "number") return;

		const doc = await resolveUuid(targetUuid);
		if (!doc) return;
		if (typeof doc.update !== "function") return;

		const ownership = foundry.utils.duplicate(doc.ownership ?? {});
		ownership[userId] = level;
		await doc.update({ ownership });

		const user = game.users.get(userId);
		const label = user?.name ?? userId;
		const msg = action === "unlock"
			? `Terminal: liberado para ${label}`
			: `Terminal: travado para ${label}`;
		ChatMessage.create({ content: msg, whisper: ChatMessage.getWhisperRecipients("GM") });
	});
}


