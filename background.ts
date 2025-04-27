import {
  downloadVideoV2,
  retrieveVideoQualitys
} from "~helpers/videos"
import type { Action } from "~types"

export {}

chrome.runtime.onMessage.addListener((message: Action, sender) => {
  switch (message.type) {
    case "overviewVideo":
      retrieveVideoQualitys(message.payload).then((info) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          payload: info,
          type: "qualitysVideo"
        } as Action)
      })
      return
    case "downloadVideo":
      downloadVideoV2(
        message.payload.url,
        message.payload.quality,
        ({ current, total, chunk }) => {
          chrome.tabs.sendMessage(sender.tab.id, {
            payload: {
              base64: chunk,
              numberOfChunk: current,
              quality: message.payload.quality,
              totalChunks: total
            },
            type: "saveVideo"
          } as Action)
        }
      )
      return
  }
})
