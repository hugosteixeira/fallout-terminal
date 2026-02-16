// Word lists deliberately generic (no copyrighted Fallout strings).
// Provide enough entries for 5–8 letters.
const WORDS_BY_LENGTH = {
	5: [
		"ALERT", "ARRAY", "BYTES", "CACHE", "CHAIN", "CHECK", "CLEAN", "CLOSE", "CODEC", "COUNT",
		"CRASH", "CRYPT", "DEBUG", "DELAY", "DRIVE", "ERROR", "EVENT", "FETCH", "FIELD", "FINAL",
		"FLASH", "FRAME", "GUARD", "HASHI", "INDEX", "INPUT", "ISSUE", "LATCH", "LIMIT", "LOADS",
		"LOCAL", "LOGIC", "MERGE", "METER", "MODEL", "NOTES", "ORDER", "PATCH", "PAUSE", "PHASE",
		"QUERY", "QUEUE", "RESET", "ROUTE", "SCOPE", "STACK", "STATE", "STORE", "TRACE", "WRITE",
	],
	6: [
		"ACCESS", "ASSERT", "BACKUP", "BINARY", "BUFFER", "CHARGE", "CLIENT", "CONFIG", "CONSOL", "CREATE",
		"CURSOR", "DELETE", "DEVICE", "DRIVER", "ENCODE", "ENGINE", "EXPORT", "FILTER", "FORMAT", "FUSION",
		"IMPORT", "INSERT", "KERNEL", "LEGACY", "MEMORY", "MODULE", "MONITO", "NETWORK", "PACKET", "PARSE",
		"PLAYER", "POINTER", "PROCESS", "RECORD", "RENDER", "REPAIR", "REPORT", "RETURN", "ROUTER", "SERVER",
		"SIGNAL", "SOURCE", "STREAM", "SWITCH", "TARGET", "THREAD", "TUNING", "UPDATE", "VERIFY", "WINDOW",
	],
	7: [
		"DRIVING", "STORING", "HEALING", "MANAGED", "WALKING", "READING", "WRITING", "SCANNED", "WARNING", "WORKING",
		"HOLDING", "TRACKED", "LOADING", "SAVINGS", "RANKING", "CLOSING", "OPENING", "MAPPING", "HACKING", "FINDING",
		"SIGNALS", "LOGGING", "RETURNS", "DECRYPT", "ENCRYPT", "PAYLOAD", "PACKETS", "KERNELS", "UPGRADE", "CAPTURE",
		"CONTROL", "PRIVATE", "DEFAULT", "PROCESS", "ANALYZE", "NETWORK", "SERIALS", "LOCKOUT", "FIREWAL", "COUNTER",
	],
	8: [
		"COMPUTER", "DATABASE", "DOWNLOAD", "ENCODING", "FIREWALL", "FIRMWARE", "HARDWARE", "KEYBOARD", "KILOSCAN", "MIGRATOR",
		"MONITOR", "NOTEBOOK", "OVERRIDE", "PASSWORD", "PIPELINE", "PLATFORM", "PROTOCOL", "RECOVERY", "REGISTER", "REPOSITR",
		"RESOURCE", "SECURITY", "SEQUENCE", "SHUTDOWN", "SOLUTION", "STABILITY", "STORAGE", "TERMINAL", "TRANSFER", "UPDATING",
		"VALIDATE", "VIEWPORT", "VIRTUALS", "WORKFLOW", "WRITABLE", "READABLE", "CACHEABLE", "COMPRESS", "DECOMPRES", "SCANNING",
	],
};

function shuffleInPlace(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export function pickWords({ length = 7, count = 12 }) {
	const pool = (WORDS_BY_LENGTH[length] ?? []).map(w => w.toUpperCase());
	const shuffled = shuffleInPlace([...pool]);
	return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function likeness(a, b) {
	let n = 0;
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		if (a[i] === b[i]) n++;
	}
	return n;
}
