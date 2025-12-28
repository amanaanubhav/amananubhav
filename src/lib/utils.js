import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Helper to normalize achievement data from string to object
export const normalizeAchievement = (item) => {
    if (typeof item === 'string') {
        // Simple string parsing fallback
        const parts = item.split('(');
        const title = parts[0].trim();
        const meta = parts[1] ? parts[1].replace(')', '') : 'Honor';
        return {
            title: title,
            desc: "Awarded for excellence in technical innovation and problem solving.",
            skills: [meta],
            rank: "Winner"
        };
    }
    return item;
};