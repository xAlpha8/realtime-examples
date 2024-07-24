import { useState } from "react";
import { useDaily } from "@daily-co/daily-react";
import { ArrowRight, Ear, Loader2 } from "lucide-react";

import Session from "./components/Session";
import { Configure, RoomSetup } from "./components/Setup";
import { Alert } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { fetch_start_agent } from "./actions";

type State =
  | "idle"
  | "configuring"
  | "requesting_agent"
  | "connecting"
  | "connected"
  | "started"
  | "finished"
  | "error";

const status_text = {
  configuring: "Let's go!",
  requesting_agent: "Requesting agent...",
  requesting_token: "Requesting token...",
  connecting: "Connecting to room...",
};

// Server URL (ensure trailing slash)
let serverUrl = import.meta.env.VITE_SERVER_URL;
let serverAuth = import.meta.env.VITE_SERVER_AUTH;
if (serverUrl && !serverUrl.endsWith("/")) serverUrl += "/";

// Auto room creation (requires server URL)
const autoRoomCreation = true;

// Query string for room URL
const roomQs = new URLSearchParams(window.location.search).get("room_url");
const checkRoomUrl = (url: string | null): boolean =>
  !!(url && /^(https?:\/\/[^.]+\.daily\.co\/[^/]+)$/.test(url));

// Show config options
const showConfigOptions = import.meta.env.VITE_SHOW_CONFIG;

// Mic mode
const isOpenMic = import.meta.env.VITE_OPEN_MIC ? true : false;

export default function App() {
  const daily = useDaily();

  const [state, setState] = useState<State>(
    showConfigOptions ? "idle" : "configuring"
  );
  const [error, setError] = useState<string | null>(null);
  const [startAudioOff, setStartAudioOff] = useState<boolean>(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(roomQs || null);
  const [roomError, setRoomError] = useState<boolean>(
    (roomQs && checkRoomUrl(roomQs)) || false
  );
  const [capacityError, setCapacityError] = useState<string>(""); // New state for start error

  function handleRoomUrl() {
    if ((autoRoomCreation && serverUrl) || checkRoomUrl(roomUrl)) {
      setRoomError(false);
      setState("configuring");
    } else {
      setRoomError(true);
    }
  }

  async function start() {
    console.log(
      "start",
      daily,
      roomUrl,
      autoRoomCreation,
      import.meta.env.VITE_MANUAL_ROOM_ENTRY
    );
    if (!daily || (!roomUrl && !autoRoomCreation)) return;

    let data;

    // Request agent to start, or join room directly
    if (import.meta.env.VITE_SERVER_URL) {
      // Request a new agent to join the room
      setState("requesting_agent");

      try {
        data = await fetch_start_agent(`${serverUrl}create_room`, serverAuth);
        if (data && !data.error) {
          fetch(`${serverUrl}start_bot`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serverAuth}`,
            },
            body: JSON.stringify({
              room_url: data.result.url,
              token: data.result.token,
            }),
          }).catch((e) => {
            console.error(`Failed to make request to ${serverUrl}/main: ${e}`);
          });
        } else {
          setCapacityError(
            "We are currently at capacity for this demo. Please try again later."
          );
          setState("configuring");
          return;
          // setError(data.detail.message);
          // setState("error");
        }
      } catch (e) {
        console.log(e);
        setCapacityError(
          "We are currently at capacity for this demo. Please try again later."
        );
        setState("configuring");
        // setError(`Unable to connect to the bot server at '${serverUrl}'`);
        // setState("error");
        return;
      }
    }

    // Join the daily session, passing through the url and token
    setState("connecting");

    try {
      await daily.join({
        url: data.result.url || roomUrl,
        token: data.result.token || "",
        videoSource: false,
        startAudioOff: startAudioOff,
      });
    } catch (e) {
      setError(`Unable to join room: '${data?.room_url || roomUrl}'`);
      setState("error");
      return;
    }
    // Away we go...
    setState("connected");
  }

  async function leave() {
    await daily?.leave();
    await daily?.destroy();
    setState(showConfigOptions ? "idle" : "configuring");
  }

  if (state === "error") {
    return (
      <Alert intent="danger" title="An error occurred">
        {error}
      </Alert>
    );
  }

  if (state === "connected") {
    return (
      <Session
        onLeave={() => leave()}
        openMic={isOpenMic}
        startAudioOff={startAudioOff}
      />
    );
  }

  if (state !== "idle") {
    return (
      <Card
        shadow="md"
        className="animate-fade-in-up max-w-2xl mx-auto my-4 bg-gray-200"
      >
        <CardHeader>
          <CardTitle>Configure your devices</CardTitle>
          <CardDescription>
            Please configure your microphone and speakers below
          </CardDescription>
        </CardHeader>
        <CardContent stack>
          <div className="flex flex-row gap-3 bg-gray-300 px-5 py-3 md:py-3 text-base items-center justify-center rounded-lg font-semibold text-navy-900">
            <Ear className="size-8 md:size-6 text-navy-600" />
            Works best in a quiet environment.
          </div>
          <Configure
            startAudioOff={startAudioOff}
            handleStartAudioOff={() => setStartAudioOff(!startAudioOff)}
          />
        </CardContent>
        <CardFooter>
          <Button
            key="start"
            fullWidthMobile
            onClick={() => start()}
            disabled={state !== "configuring"}
            className="bg-navy-700 hover:bg-navy-800 text-white font-bold py-2 px-4 rounded"
          >
            {state !== "configuring" && <Loader2 className="animate-spin" />}
            {status_text[state as keyof typeof status_text]}
          </Button>
        </CardFooter>
        {capacityError && (
          <div className="text-red-700 mt-3 p-4 rounded bg-red-200">
            {capacityError}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card shadow className="animate-appear max-w-lg">
      <CardHeader>
        <CardTitle>{import.meta.env.VITE_APP_TITLE}</CardTitle>
        <CardDescription>Check configuration below</CardDescription>
      </CardHeader>
      <CardContent stack>
        <RoomSetup
          serverUrl={serverUrl}
          roomQs={roomQs}
          roomQueryStringValid={checkRoomUrl(roomQs)}
          handleCheckRoomUrl={(url) => setRoomUrl(url)}
          roomError={roomError}
        />
      </CardContent>
      <CardFooter>
        <Button
          id="nextBtn"
          fullWidthMobile
          key="next"
          disabled={
            !!((roomQs && !roomError) || (autoRoomCreation && !serverUrl))
          }
          onClick={() => handleRoomUrl()}
        >
          Next <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
