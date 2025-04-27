interface QualityVideo {
  quality: string
  chunksOverviewFilename: string
}

export interface ChunkDownloaded{
  base64:string;
  quality:number;
  numberOfChunk:number;
  totalChunks:number;
}

export type Action =
  | {
      type: "overviewVideo"
      payload: string
    }
  | {
      type: "qualitysVideo"
      payload: QualityVideo[]
    }
  | {
      type: "downloadVideo"
      payload: {
        url: string
        quality: number
      }
    }
  | {
      type: "saveVideo"
      payload: ChunkDownloaded
    }
