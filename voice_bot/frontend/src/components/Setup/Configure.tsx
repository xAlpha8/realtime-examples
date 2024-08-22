import React from "react";

import HelpTip from "../ui/helptip";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

import DeviceSelect from "./DeviceSelect";

interface ConfigureProps {
  startAudioOff: boolean;
  handleStartAudioOff: () => void;
}

export const Configure: React.FC<ConfigureProps> = ({
  startAudioOff,
  handleStartAudioOff,
}) => {
  return (
    <>
      <DeviceSelect hideMeter={false} />
    </>
  );
};
