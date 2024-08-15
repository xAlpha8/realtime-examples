import { useCallback, useEffect, useRef } from "react";
import { logger } from "../utils/logger";

export function useOnAudioPacketReceived(props) {
  const { connection } = props;
  const newAudioStartTime = useRef(0);
  const deltaCount = useRef(0);

  const onAudioPacketReceived = useCallback(
    (timestamp, prevTimestamp) => {
      if (prevTimestamp) {
        const delta = timestamp - prevTimestamp;
        if (!newAudioStartTime.current && delta > 200) {
          logger("[useOnAudioPacketReceived]", timestamp, prevTimestamp);
          newAudioStartTime.current = timestamp / 1000;
        } else if (newAudioStartTime.current && delta == 0) {
          deltaCount.current += 1;
          if (deltaCount.current > 10) {
            logger("[useAudioPacketReceived]", timestamp, prevTimestamp);
            newAudioStartTime.current = null;
            deltaCount.current = 0;
          }
        }
      } else {
        logger("[useAudioPacketReceived]", timestamp, prevTimestamp);
        newAudioStartTime.current = timestamp / 1000;
      }
    },
    [connection]
  );

  useEffect(() => {
    if (connection) {
      connection.onAudioPacketReceived(onAudioPacketReceived);
    }

    return;
  }, [connection, onAudioPacketReceived]);

  return {
    deltaCount,
    newAudioStartTime,
  };
}
