import { stdout as execa } from "execa"
import { stat } from "fs-extra"
import { array as getStream } from "get-stream"
import { GotEmitter, Progress, put } from "got"
import { zip } from "gulp-vinyl-zip"
import { action, runInAction } from "mobx"
import { basename, resolve } from "path"
import { pipeline, Readable } from "stream"
import { URL } from "url"
import File from "vinyl"
import { src } from "vinyl-fs"
import { start, state } from "./view"

void (async () => {
  const [, , _path] = process.argv
  if (!_path) {
    console.error("No file given")
    process.exit(1)
  }

  const path = resolve(_path)
  const fileStream = await getPath(path)

  start()
  execa("du", ["-k", path]).then(
    action((v: string) => {
      state.input = parseInt(v.split(" ")[0], 10) * 1024
    })
  )

  const [file] = await getStream<File>(fileStream)
  if (!fileStream) {
    console.error("Can't find file")
    process.exit(3)
  }

  if (file.isStream()) {
    const url = new URL(file.basename, "https://transfer.sh")
    const req = put(url, { body: file.contents as Readable })

    void ((req as any) as GotEmitter).on(
      "uploadProgress",
      action((progress: Progress) => {
        state.uploadStatus = "progress"
        state.uploaded = progress.transferred
      })
    )

    const res = await req
    console.log(res.body)
    runInAction(() => (state.uploadStatus = "done"))
    process.exit(0)
  } else {
    console.error("File is not a stream")
    process.exit(4)
  }
})()

async function getPath(path: string): Promise<NodeJS.ReadableStream> {
  const info = await stat(path).catch(err => {
    console.error("No such file")
    throw process.exit(7)
  })

  if (info.isDirectory()) {
    return zipDirectory(path)
  } else if (info.isFile()) {
    return src(path, { buffer: false })
  } else {
    console.error("I don't know what to do with this")
    throw process.exit(2)
  }
}

function zipDirectory(path: string): NodeJS.ReadableStream {
  return pipeline(
    src(resolve(path, "**", "*"), { buffer: false }),
    zip(`${basename(path)}.zip`),
    err => {
      if (err) {
        console.error("Zip failed")
        process.exit(5)
      }
    }
  )
}
