declare module "byte-size" {
  export = byte_size

  declare function byte_size(
    bytes: number,
    options?: any
  ): { value: number; unit: string }
}
