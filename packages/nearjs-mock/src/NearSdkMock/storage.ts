export class StorageMock {
  private data = new Map<string, Uint8Array>();

  get(key: string): Uint8Array {
    return this.data.get(key);
  }

  set(key: string, value: Uint8Array): void {
    this.data.set(key, value);
  }

  sizeInBytes(): number {
    let size = 0;
    for (let [key, value] of this.data.entries()) {
      size += key.length + value.byteLength;
    }
    return size;
  }
}
