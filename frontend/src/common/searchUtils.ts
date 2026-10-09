 export function searchByNameOrId<T extends { name: string | null; id: number }>(items: T[], value: string): T[] {
    if (!value) return items;

    const lowerCaseValue = value.toLowerCase();
    return items.filter(({ name, id }) =>
        (name?.toLowerCase().includes(lowerCaseValue)) ||
        String(id).includes(value)
    );
}