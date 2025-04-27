import React, { Fragment, useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import "bootswatch/dist/minty/bootstrap.css"

import { checkVipOnServer } from "~helpers/api"

import "~/options/styles.scss"

export default function Options() {
  const [storage] = useState(new Storage())

  const [state, setState] = useState({
    hasPremium: false,
    licenseCode: ""
  })

  useEffect(() => {
    ;(async function () {
      const hasPremium = (await storage.getItem("hasPremium")) as boolean
      const licenseCode = (await storage.getItem("licenseCode")) as string

      if (licenseCode === undefined) storage.setItem("licenseCode", "")
      if (hasPremium === undefined) storage.setItem("hasPremium", false)

      setState((current) => ({
        ...current,
        hasPremium: hasPremium || false,
        licenseCode: licenseCode || ""
      }))
    })()
  }, [])

  useEffect(() => {
    ;(async function () {
      checkVipOnServer(state.licenseCode).then((hasPremium) => {
        storage.setItem("hasPremium", hasPremium)
        setState((current) => ({
          ...current,
          hasPremium
        }))
      })
    })()
  }, [state.licenseCode])

  const handleOnChange = (licenseCode: string) => {
    storage.setItem("licenseCode", licenseCode)
    setState((current) => ({
      ...current,
      licenseCode
    }))
  }

  return (
    <div className="container">
      <h1 className="text-center">Settings</h1>
      <div>
        <label className="col-form-label col-form-label-sm mt-4">
          <strong>License code</strong>
        </label>
        <input
          maxLength={36}
          className="form-control form-control-sm"
          type="text"
          value={state.licenseCode}
          onChange={(e) => handleOnChange(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        {state.hasPremium ? (
          <small className="text-primary">
            <strong>Premium active</strong>
          </small>
        ) : (
          <div>
            You don't have premium,{" "}
            <a href="https://telegram-downloader-shop-jade.vercel.app?xvideos=1">
              get it here
            </a>{" "}
            or paying down below
          </div>
        )}
      </div>

      <div className="mt-2">
        <h5 className="text-center">Important</h5>
        <p className="m-0">
          Since this extension is a standalone tool (no external severs, no
          outsource complements needed,etc) and for the "security policies" of
          xvideos against 3rd party tools, once you have downloaded a video, you
          have 2 options
        </p>
        <ol>
          <li>
            Download and <strong>play</strong> them{" "}
            <strong>with VLC Media Player</strong>.{" "}
            <a href="https://www.youtube.com/watch?v=rHfi33d5O00&ab_channel=ProgrammingKnowledge2">
              Tutorial install VLC Media Player
            </a>
          </li>
          <li>
            <strong>Convert it to mp4</strong> with outsource tools.{" "}
            <a href="https://cloudconvert.com/">Online converter tool</a>
          </li>
        </ol>
        <p className="m-0">
          I feel so sorry for not be able to handle the videos as mp4, but I do
          what I can do with the "nature" of an extension and make it the
          cheapest and usable possible for you.
        </p>
        <p className="m-0">On my personal likings, I would rather just play them with VLC Media Player instead of converting over and over</p>
      </div>

      {state.hasPremium === false && (
        <Fragment>
          <hr />

          <details open className="mt-3 benefits">
            <summary>
              <strong>Why should I get premium? (Click me)</strong>
            </summary>
            <ol>
              <li>
                Allows you <strong>download the highest quality</strong> (up
                720p for freemium users and 1080 for premium users) , which
                xvideos doesn't provide even if you create an account with them
              </li>
              <li>Remove the ads for a cleaner navigation</li>
              <li>
                No outside navigation, always stay on xvideos, don't do that
                weird stuff of using external sites or pasting links
              </li>
              <li>
                One single payment, don't pay monthly or anually to keep the
                extension
              </li>
              <li>
                No limits, download all the videos you want, as long you don't
                over-download and make xvideos tag you as a bot
              </li>
              <li>
                100% available until the ends of the time, since this tool only
                relys on you having a good device
              </li>
              <li>
                No registration, only pay and get the email with the license
                code, ready to go
              </li>
              <li>
                <strong>Payments with PayPal</strong> for more confidence on the
                payment
              </li>
            </ol>

            <iframe
              id="kofiframe"
              src={`https://ko-fi.com/programador51/9?hidefeed=true&widget=true&embed=true&preview=true`}
              height="600"
              title="programador51"></iframe>
          </details>
        </Fragment>
      )}
    </div>
  )
}
