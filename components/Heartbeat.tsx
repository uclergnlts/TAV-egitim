"use client";

import { useEffect } from "react";

/**
 * Tarayıcı açık olduğu sürece sunucuya heartbeat gönderir.
 * Tüm sekmeler kapandığında heartbeat durur ve sunucu otomatik kapanır.
 */
export function Heartbeat() {
    useEffect(() => {
        // Hemen ilk ping'i at
        fetch("/api/heartbeat", { method: "POST" }).catch(() => {});

        // Her 15 saniyede bir ping at
        const interval = setInterval(() => {
            fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
        }, 15_000);

        return () => clearInterval(interval);
    }, []);

    return null;
}
