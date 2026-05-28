export function toInt(value) {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
}
