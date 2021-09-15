import { computeHash } from '../helpers';
import { Context, key } from '../state';
import { HOST, VRL_RESOLVE_ENDPOINT } from '../values';
import { Help } from './Help';

import axios from "axios";
import { useContext, useEffect } from "react";
import { useParams } from 'react-router';
import Editor from '@monaco-editor/react';
import useLocalStorage from 'use-local-storage';

const keys = {
  hashUrl: key("hash_url")
}

export const Main = () => {
  const [hashUrl, setHashUrl] = useLocalStorage(keys.hashUrl, null);

  const { hash } = useParams();

  const { titleState, eventState, programState, outputState, resultState, errorState } = useContext(Context);
  const [title, setTitle] = titleState;
  const [event, setEvent] = eventState;
  const [program, setProgram] = programState;
  const [output, setOutput] = outputState;
  const [result, setResult] = resultState;
  const [errorMsg, setErrorMsg] = errorState;

  const resolve = () => {
    const resolvePayload = { event, program };

    axios.post(VRL_RESOLVE_ENDPOINT, resolvePayload)
      .then(res => {
        const result = res.data;

        if (result.success) {
          setOutput(result.success.output);
          setResult(result.success.result);
        } else if (result.error) {
          setErrorMsg(result.error);
          setResult(null);
          setOutput(null);
        }
      })
      .catch(e => {
        const msg = `Server error: ${e}`;
        setErrorMsg(msg);
        setResult(null);
        setOutput(null);
      });
  }

  useEffect(() => {
    if (hash != null) {
      const h = atob(hash);
      const obj = JSON.parse(h);
      setTitle(obj.title);
      setEvent(obj.event);
      setProgram(obj.program);
      setOutput(obj.output);
      setResult(obj.result);
    }
  }, [setTitle, setEvent, setProgram, setOutput, setResult]);

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(hashUrl);
  }

  const exportHash = () => {
    const hashed = computeHash(title, event, program, output, result);
    const url = `${HOST}/h/${hashed}`;
    setHashUrl(url);
    setErrorMsg(null);
  }

  const onProgramChange = (val) => {
    setProgram(val);
  }

  const onEventChange = (val) => {
    setEvent(JSON.parse(val));
  }

  return <main>
    <p className="text-3xl mb-6">
      {title}
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <p className="title">
          Event
        </p>
        
        <Editor
          height="400px"
          theme="vs-dark"
          value={JSON.stringify(event, null, 2)}
          onChange={onEventChange}
        />
      </div>

      <div>
        <p className="title">
          Program
        </p>

        <Editor
          height="400px"
          theme="vs-dark"
          value={program}
          onChange={onProgramChange}
        />
      </div>
    </div>

    {errorMsg && (
      <p className="text-xl text-red-500 font-bold">
        {errorMsg}
      </p>
    )}

    {output && (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {result && (
          <div>
            <p className="title">
              Resolved
            </p>

            <pre className="text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <p className="title">
            Output
          </p>

          <pre className="text-sm">
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      </div>
    )}

    <div className="mt-8 flex space-x-2">
      <button onClick={resolve}>
        Resolve
      </button>

      <button onClick={exportHash}>
        Export
      </button>
    </div>

    {hashUrl && (
      <div className="mt-6">
        <div className="flex space-x-2">
          <button onClick={copyUrlToClipboard}>
            Copy URL to clipboard
          </button>

          <button onClick={() => window.location = hashUrl}>
            Navigate to exported URL
          </button>
        </div>
      </div>
    )}

    <Help />
  </main>
}