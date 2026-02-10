export default function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 900 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    const formattedValue = unitIndex === 0
        ? value.toFixed(0)
        : value.toFixed(1).replace(/\.0$/, '');

    return `${formattedValue} ${units[unitIndex]}`;
}