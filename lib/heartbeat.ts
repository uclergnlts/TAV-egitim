/**
 * Heartbeat Tracker
 * Tarayıcı kapandığında sunucuyu otomatik kapatır.
 *
 * Client her 15 saniyede bir /api/heartbeat'e ping atar.
 * 60 saniye boyunca ping gelmezse sunucu kendini kapatır.
 */

let lastHeartbeat = Date.now();
let shutdownTimer: ReturnType<typeof setInterval> | null = null;

const HEARTBEAT_TIMEOUT = 60_000; // 60 saniye
const CHECK_INTERVAL = 10_000;    // 10 saniyede bir kontrol

export function recordHeartbeat() {
    lastHeartbeat = Date.now();

    // İlk heartbeat'te zamanlayıcıyı başlat
    if (!shutdownTimer) {
        shutdownTimer = setInterval(() => {
            const elapsed = Date.now() - lastHeartbeat;
            if (elapsed > HEARTBEAT_TIMEOUT) {
                console.log("[Heartbeat] Tarayıcı kapandı, sunucu kapatılıyor...");
                process.exit(0);
            }
        }, CHECK_INTERVAL);

        // Timer'ı process'i canlı tutmasın (unref)
        if (shutdownTimer && typeof shutdownTimer === "object" && "unref" in shutdownTimer) {
            shutdownTimer.unref();
        }
    }
}
