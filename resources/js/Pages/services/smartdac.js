import axios from "axios";

export async function getTemperatures() {
    const response = await fetch("/api/smartdac/temperatures");

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
}
