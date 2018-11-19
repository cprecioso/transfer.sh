import byteSize from "byte-size"
import Listr from "listr"
import { autorun, observable, when } from "mobx"

export const state = observable({
  uploadStatus: "idle" as "idle" | "progress" | "done",
  uploaded: 0,
  input: null as null | number
})

export const start = () =>
  new Listr(
    [
      {
        title: "Calculating input file size...",
        async task(ctx, task) {
          await when(() => state.input != null)
          task.title = `Input size: ${byteSize(state.input!)}`
        }
      },
      {
        title: "Uploading file...",
        async task(ctx, task) {
          const dispose = autorun(() => {
            if (state.uploadStatus === "idle") {
              task.output = "Waiting..."
            } else {
              task.output = `${byteSize(state.uploaded)} uploaded`
            }
          })
          await when(() => state.uploadStatus === "done")
          dispose()
          task.title = "File uploaded"
        }
      }
    ],
    { concurrent: true, nonTTYRenderer: "silent" }
  ).run()
