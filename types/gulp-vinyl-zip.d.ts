declare module "gulp-vinyl-zip" {
  export function src(file?: string): NodeJS.ReadWriteStream
  export function dest(file: string): NodeJS.ReadWriteStream
  export function zip(file: string): NodeJS.ReadWriteStream
}
