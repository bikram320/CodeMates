import fs from "fs";
import path from "path";

const ROOT = "src";
const EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".json"]);
// Fixed by hand, so don't auto-resolve these.
const SKIP = new Set(["Register.jsx", "AppRoutes.jsx"]);

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (EXTS.has(path.extname(entry.name))) out.push(full);
    }
    return out;
}

const fixed = [];
const warnings = [];

for (const file of walk(ROOT)) {
    if (SKIP.has(path.basename(file))) continue;
    const text = fs.readFileSync(file, "utf8");
    if (!/^<<<<<<< /m.test(text)) continue;

    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    let state = "normal"; // normal | ours (Updated upstream) | theirs (Stashed changes)
    const out = [];

    for (const line of text.split(/\r?\n/)) {
        if (line.startsWith("<<<<<<< ")) { state = "ours"; continue; }
        if (state === "ours" && line.startsWith("=======")) { state = "theirs"; continue; }
        if (state === "theirs" && line.startsWith(">>>>>>> ")) { state = "normal"; continue; }
        if (state === "ours") continue; // drop the "Updated upstream" side
        out.push(line);
    }

    if (state !== "normal") warnings.push(file);
    fs.writeFileSync(file, out.join(eol), "utf8");
    fixed.push(file);
}

console.log("Resolved (kept Stashed changes):");
fixed.forEach((f) => console.log("  " + f));
if (warnings.length) {
    console.log("\nUnbalanced markers, check by hand:");
    warnings.forEach((f) => console.log("  " + f));
}