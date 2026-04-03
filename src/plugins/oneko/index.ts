/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * https://github.com/Vendicated/Vencord/blob/main/src/plugins/oneko/index.ts
 */

import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { fetchExternal } from "@utils/misc";
import definePlugin from "@utils/types";

const logger = new Logger("Oneko");

const ONEKO_SCRIPT = "https://raw.githubusercontent.com/adryd325/oneko.js/c4ee66353b11a44e4a5b7e914a81f8d33111555e/oneko.js";
const ONEKO_GIF = "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif";

let stopped = false;

export default definePlugin({
    name: "Oneko",
    description: "Cat follows your mouse cursor.",
    authors: [Devs.adryd],
    cleanupSelectors: ["#oneko"],

    async start() {
        stopped = false;
        try {
            const s = (await (await fetchExternal(ONEKO_SCRIPT)).text())
                .replace("./oneko.gif", ONEKO_GIF)
                .replace("(isReducedMotion)", "(false)");
            if (stopped) return;
            const el = document.createElement("script");
            el.src = URL.createObjectURL(new Blob([s], { type: "text/javascript" }));
            document.head.appendChild(el);
            el.addEventListener("load", () => { el.remove(); URL.revokeObjectURL(el.src); }, { once: true });
        } catch (e) {
            logger.error("Failed to load oneko script", e);
        }
    },

    stop() {
        stopped = true;
    },
});
