// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function regenerateQuoteItemsUUID(metadata: any): void {
  if (metadata && metadata['quote_items']) {
    metadata['quote_items'].forEach((item: { uuid: string }) => {
      item.uuid = generateNewUUID(); // Assuming you have a function to generate new UUIDs
    });
  }
}

export function generateNewUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function randString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
